import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild, signal, computed, inject, effect, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/game-state.service';

declare var YT: any;

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player.component.html',
  styleUrl: './player.component.css'
})
export class PlayerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() audioUrl!: string;
  @Input() currentAttempt = 1;
  @Input() audioStartOffset?: number;

  private readonly gameStateService = inject(GameStateService);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly isMuted = this.gameStateService.isMuted;

  useYoutube = false;
  private ytPlayer: any;
  private timeTrackerInterval: any;

  constructor() {
    effect(() => {
      const muted = this.isMuted();
      if (this.audioRef && this.audioRef.nativeElement) {
        this.audioRef.nativeElement.muted = muted;
      }
      if (this.ytPlayer && typeof this.ytPlayer.setVolume === 'function') {
        try {
          this.ytPlayer.setVolume(muted ? 0 : this.volume * 100);
        } catch (e) {}
      }
    });
  }

  @ViewChild('audioElement') audioRef!: ElementRef<HTMLAudioElement>;
  @ViewChild('visualizerCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  // Playback limits for each attempt (Attempt 1 = 2s, Attempt 2 = 5s, etc.)
  readonly playbackLimits = [2, 5, 10, 15, 30];

  isPlaying = false;
  isAudioLoaded = false;
  currentTime = 0;
  totalDuration = 0;
  volume = 0.5;

  // Web Audio Variables
  private audioCtx?: AudioContext;
  private analyser?: AnalyserNode;
  private sourceNode?: MediaElementAudioSourceNode;
  private animationId?: number;
  private canvasCtx?: CanvasRenderingContext2D;

  // Static wave animation values
  private wavePhase = 0;

  get allowedDuration(): number {
    const attemptIndex = Math.min(this.currentAttempt - 1, this.playbackLimits.length - 1);
    return this.playbackLimits[attemptIndex];
  }

  get startOffset(): number {
    if (this.audioStartOffset !== undefined && this.audioStartOffset >= 0) {
      return this.audioStartOffset;
    }
    // Si la duración es mayor a 45 segundos, asumimos que es la canción completa
    // y aplicamos un offset automático del 35% para saltar intros silenciosas.
    if (this.totalDuration > 45) {
      return Math.floor(this.totalDuration * 0.35);
    }
    return 0;
  }

  get progressPercentage(): number {
    if (!this.allowedDuration) return 0;
    return Math.min((this.currentTime / this.allowedDuration) * 100, 100);
  }

  get allowedPercentage(): number {
    if (!this.totalDuration) return 100;
    return Math.min((this.allowedDuration / this.totalDuration) * 100, 100);
  }

  ngOnInit() {
    this.initCanvas();
    this.startDrawingLoop();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['audioUrl']) {
      this.stopTrackingTime();
      if (this.ytPlayer) {
        try {
          this.ytPlayer.destroy();
        } catch (e) {
          console.warn('Error destroying YouTube Player:', e);
        }
        this.ytPlayer = null;
      }

      this.isAudioLoaded = false;
      this.isPlaying = false;
      this.currentTime = 0;
      this.totalDuration = 0;

      const url = this.audioUrl;
      // Detect if the url is a YouTube ID or a full YouTube URL
      if (url && (url.length === 11 || url.includes('youtube.com') || url.includes('youtu.be'))) {
        this.useYoutube = true;
        let videoId = url;
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
          const match = url.match(regExp);
          videoId = (match && match[2].length === 11) ? match[2] : url;
        }
        this.initYoutubePlayer(videoId);
      } else {
        this.useYoutube = false;
      }
    }
  }

  ngOnDestroy() {
    this.stopTrackingTime();
    this.pause();
    if (this.ytPlayer) {
      try {
        this.ytPlayer.destroy();
      } catch (e) {
        console.warn('Error destroying YouTube Player on destroy:', e);
      }
      this.ytPlayer = null;
    }
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private initYoutubePlayer(videoId: string) {
    const checkAndInit = () => {
      this.ngZone.runOutsideAngular(() => {
        const container = document.getElementById('yt-player-container');
        if (typeof YT !== 'undefined' && YT.Player && container) {
          this.ytPlayer = new YT.Player('yt-player-container', {
            height: '0',
            width: '0',
            videoId: videoId,
            playerVars: {
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              fs: 0,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              origin: window.location.origin
            },
            events: {
              onReady: () => {
                this.ngZone.run(() => {
                  this.isAudioLoaded = true;
                  this.totalDuration = this.ytPlayer.getDuration();
                  try {
                    this.ytPlayer.setVolume(this.isMuted() ? 0 : this.volume * 100);
                    this.ytPlayer.seekTo(this.startOffset, true);
                    this.ytPlayer.pauseVideo();
                  } catch (e) {}
                  this.currentTime = 0;
                  this.cdr.detectChanges();
                });
              },
              onStateChange: (event: any) => {
                this.ngZone.run(() => {
                  if (event.data === YT.PlayerState.PLAYING) {
                    this.isPlaying = true;
                    this.startTrackingTime();
                  } else {
                    this.isPlaying = false;
                    this.stopTrackingTime();
                  }
                  this.cdr.detectChanges();
                });
              },
              onError: (err: any) => {
                this.ngZone.run(() => {
                  console.error('YouTube Player Error:', err);
                  this.cdr.detectChanges();
                });
              }
            }
          });
        } else {
          setTimeout(checkAndInit, 50);
        }
      });
    };
    checkAndInit();
  }

  private startTrackingTime() {
    this.stopTrackingTime();
    this.timeTrackerInterval = setInterval(() => {
      this.ngZone.run(() => {
        if (this.ytPlayer && typeof this.ytPlayer.getCurrentTime === 'function') {
          try {
            const rawTime = this.ytPlayer.getCurrentTime();
            this.currentTime = Math.max(0, rawTime - this.startOffset);

            if (rawTime >= this.startOffset + this.allowedDuration) {
              this.pause();
              this.ytPlayer.seekTo(this.startOffset, true);
              this.ytPlayer.pauseVideo();
              this.currentTime = 0;
            }
            this.cdr.detectChanges();
          } catch (e) {}
        }
      });
    }, 100);
  }

  private stopTrackingTime() {
    if (this.timeTrackerInterval) {
      clearInterval(this.timeTrackerInterval);
      this.timeTrackerInterval = null;
    }
  }

  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
    canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);
    this.canvasCtx = canvas.getContext('2d') || undefined;
  }

  private setupWebAudio() {
    if (this.useYoutube || this.audioCtx) return;

    try {
      if (this.audioRef && this.audioRef.nativeElement) {
        const audio = this.audioRef.nativeElement;
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;

        this.sourceNode = this.audioCtx.createMediaElementSource(audio);
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
      }
    } catch (e) {
      console.warn('Web Audio API not fully initialized:', e);
    }
  }

  private startDrawingLoop() {
    const draw = () => {
      this.animationId = requestAnimationFrame(draw);
      this.drawWaveform();
    };
    draw();
  }

  private drawWaveform() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.canvasCtx;
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = 'rgba(6, 7, 10, 0.2)';
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    if (this.isPlaying && !this.useYoutube && this.analyser) {
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(dataArray);

      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#a219c7');
      gradient.addColorStop(0.5, '#6252ce');
      gradient.addColorStop(1, '#14cad8');
      ctx.strokeStyle = gradient;

      ctx.beginPath();
      const sliceWidth = width / (bufferLength / 2);
      let x = 0;

      for (let i = 0; i < bufferLength / 2; i++) {
        const v = dataArray[i] / 255.0;
        const amplitude = v * (height * 0.7);
        const y = height / 2 + (i % 2 === 0 ? -amplitude : amplitude) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    } else {
      // Pulsing wave simulation for YouTube or fallback when paused
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      if (this.isPlaying) {
        gradient.addColorStop(0, '#a219c7');
        gradient.addColorStop(0.5, '#6252ce');
        gradient.addColorStop(1, '#14cad8');
        ctx.strokeStyle = gradient;
        this.wavePhase += 0.15;
      } else {
        ctx.strokeStyle = 'rgba(162, 25, 199, 0.4)';
        this.wavePhase += 0.02;
      }

      ctx.beginPath();
      const baseAmplitude = this.isPlaying ? 12 : 3;
      const frequency = 0.025;

      for (let x = 0; x < width; x += 5) {
        const edgeFader = Math.sin((x / width) * Math.PI);
        // Add multiple sine waves for a organic soundtrack-like feel when playing
        const wave1 = Math.sin(x * frequency + this.wavePhase) * baseAmplitude;
        const wave2 = this.isPlaying ? Math.sin(x * 0.05 - this.wavePhase * 1.5) * (baseAmplitude * 0.4) : 0;
        const y = (height / 2) + (wave1 + wave2) * edgeFader * (this.isAudioLoaded ? 1.5 : 0.5);

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
  }

  togglePlay() {
    if (!this.isAudioLoaded) return;
    this.setupWebAudio();

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (this.useYoutube) {
      if (this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
        try {
          const rawTime = this.ytPlayer.getCurrentTime();
          if (rawTime < this.startOffset || rawTime >= this.startOffset + this.allowedDuration) {
            this.ytPlayer.seekTo(this.startOffset, true);
          }
          this.ytPlayer.playVideo();
        } catch (e) {}
      }
    } else {
      if (this.audioRef && this.audioRef.nativeElement) {
        const audio = this.audioRef.nativeElement;
        if (audio.currentTime < this.startOffset || audio.currentTime >= this.startOffset + this.allowedDuration) {
          audio.currentTime = this.startOffset;
        }
        audio.play().then(() => {
          this.isPlaying = true;
        }).catch(err => {
          console.error('Audio playback failed:', err);
        });
      }
    }
  }

  pause() {
    if (this.useYoutube) {
      if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
        try {
          this.ytPlayer.pauseVideo();
        } catch (e) {}
      }
      this.isPlaying = false;
    } else {
      if (this.audioRef && this.audioRef.nativeElement) {
        try {
          this.audioRef.nativeElement.pause();
        } catch (e) {}
      }
      this.isPlaying = false;
    }
  }

  rewind() {
    if (this.useYoutube) {
      if (this.ytPlayer && typeof this.ytPlayer.seekTo === 'function') {
        try {
          this.ytPlayer.seekTo(this.startOffset, true);
          this.currentTime = 0;
          if (this.isPlaying) {
            this.ytPlayer.playVideo();
          }
        } catch (e) {}
      }
    } else {
      if (this.audioRef && this.audioRef.nativeElement) {
        const audio = this.audioRef.nativeElement;
        audio.currentTime = this.startOffset;
        this.currentTime = 0;
        if (this.isPlaying) {
          this.play();
        }
      }
    }
  }

  onTimeUpdate() {
    if (this.useYoutube) return;
    if (this.audioRef && this.audioRef.nativeElement) {
      const audio = this.audioRef.nativeElement;
      this.currentTime = Math.max(0, audio.currentTime - this.startOffset);

      if (audio.currentTime >= this.startOffset + this.allowedDuration) {
        this.pause();
        audio.currentTime = this.startOffset;
        this.currentTime = 0;
      }
    }
  }

  onEnded() {
    this.isPlaying = false;
    this.currentTime = 0;
  }

  onLoadedMetadata() {
    if (this.useYoutube) return;
    if (this.audioRef && this.audioRef.nativeElement) {
      const audio = this.audioRef.nativeElement;
      audio.volume = this.volume;
      this.totalDuration = audio.duration;
      this.isAudioLoaded = true;

      audio.currentTime = this.startOffset;
      this.currentTime = 0;

      this.initCanvas();
    }
  }

  setVolume(event: Event) {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.volume = val;
    if (!this.useYoutube && this.audioRef && this.audioRef.nativeElement) {
      this.audioRef.nativeElement.volume = val;
    }
    if (this.useYoutube && this.ytPlayer && typeof this.ytPlayer.setVolume === 'function') {
      try {
        this.ytPlayer.setVolume(this.isMuted() ? 0 : val * 100);
      } catch (e) {}
    }
  }

  seek(event: MouseEvent) {
    if (!this.isAudioLoaded) return;
    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;

    const targetTime = this.startOffset + (percentage * this.allowedDuration);
    
    if (this.useYoutube) {
      if (this.ytPlayer && typeof this.ytPlayer.seekTo === 'function') {
        try {
          this.ytPlayer.seekTo(targetTime, true);
          this.currentTime = percentage * this.allowedDuration;
        } catch (e) {}
      }
    } else {
      if (this.audioRef && this.audioRef.nativeElement) {
        this.audioRef.nativeElement.currentTime = targetTime;
        this.currentTime = percentage * this.allowedDuration;
      }
    }
  }

  formatTime(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }
}

