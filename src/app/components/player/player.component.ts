import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/game-state.service';

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
  readonly isMuted = this.gameStateService.isMuted;

  constructor() {
    effect(() => {
      const muted = this.isMuted();
      if (this.audioRef) {
        this.audioRef.nativeElement.muted = muted;
      }
    });
  }

  @ViewChild('audioElement', { static: true }) audioRef!: ElementRef<HTMLAudioElement>;
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
    // Para clips cortos de iTunes (30-40s), reproducimos desde el inicio (segundo 0).
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
      this.isAudioLoaded = false;
      this.isPlaying = false;
      this.currentTime = 0;
    }
  }

  ngOnDestroy() {
    this.pause();
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    // Set correct display dimensions
    canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
    canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);
    this.canvasCtx = canvas.getContext('2d') || undefined;
  }

  private setupWebAudio() {
    if (this.audioCtx) return;

    try {
      const audio = this.audioRef.nativeElement;
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;

      this.sourceNode = this.audioCtx.createMediaElementSource(audio);
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
    } catch (e) {
      console.warn('Web Audio API not fully initialized (requires user gesture):', e);
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

    // Clear Canvas with smooth trail effect
    ctx.fillStyle = 'rgba(6, 7, 10, 0.2)';
    ctx.fillRect(0, 0, width, height);

    // Setup line style
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    if (this.isPlaying && this.analyser) {
      // Dynamic mode (Web Audio frequency visualizer)
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(dataArray);

      // Gradient color for playing waveform
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#a219c7'); // Brand Purple
      gradient.addColorStop(0.5, '#6252ce'); // Brand Indigo
      gradient.addColorStop(1, '#14cad8'); // Brand Cyan
      ctx.strokeStyle = gradient;

      ctx.beginPath();
      const sliceWidth = width / (bufferLength / 2);
      let x = 0;

      for (let i = 0; i < bufferLength / 2; i++) {
        // Normalize value to height percentage
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
      // Static/Pulsing Heartbeat Mode (fallback when paused or loaded)
      ctx.strokeStyle = 'rgba(162, 25, 199, 0.4)'; // Dim Brand Purple

      ctx.beginPath();
      const amplitude = 4; // subtle wave height
      const frequency = 0.02;
      this.wavePhase += this.isPlaying ? 0.2 : 0.04;

      for (let x = 0; x < width; x += 5) {
        // Create a pulsing envelope that fades at the screen edges
        const edgeFader = Math.sin((x / width) * Math.PI);
        const y = (height / 2) + Math.sin(x * frequency + this.wavePhase) * amplitude * edgeFader * (this.isAudioLoaded ? 1.5 : 0.5);

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
    const audio = this.audioRef.nativeElement;
    // Si la posición actual está fuera del segmento permitido, reiniciamos a startOffset
    if (audio.currentTime < this.startOffset || audio.currentTime >= this.startOffset + this.allowedDuration) {
      audio.currentTime = this.startOffset;
    }
    audio.play().then(() => {
      this.isPlaying = true;
    }).catch(err => {
      console.error('Audio playback failed:', err);
    });
  }

  pause() {
    const audio = this.audioRef.nativeElement;
    audio.pause();
    this.isPlaying = false;
  }

  rewind() {
    const audio = this.audioRef.nativeElement;
    audio.currentTime = this.startOffset;
    this.currentTime = 0;
    if (this.isPlaying) {
      this.play();
    }
  }

  onTimeUpdate() {
    const audio = this.audioRef.nativeElement;
    // Calculamos el tiempo relativo respecto al startOffset
    this.currentTime = Math.max(0, audio.currentTime - this.startOffset);

    // Si excede la duración permitida del intento activo
    if (audio.currentTime >= this.startOffset + this.allowedDuration) {
      this.pause();
      audio.currentTime = this.startOffset;
      this.currentTime = 0;
    }
  }

  onEnded() {
    this.isPlaying = false;
    this.currentTime = 0;
  }

  onLoadedMetadata() {
    const audio = this.audioRef.nativeElement;
    audio.volume = this.volume;
    this.totalDuration = audio.duration;
    this.isAudioLoaded = true;

    // Colocar el reproductor en el offset de inicio
    audio.currentTime = this.startOffset;
    this.currentTime = 0;
    
    // Ajustar el canvas
    this.initCanvas();
  }

  setVolume(event: Event) {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.volume = val;
    if (this.audioRef) {
      this.audioRef.nativeElement.volume = val;
    }
  }

  seek(event: MouseEvent) {
    if (!this.isAudioLoaded) return;
    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    // Seekea relativo al startOffset
    const targetTime = this.startOffset + (percentage * this.allowedDuration);
    this.audioRef.nativeElement.currentTime = targetTime;
    this.currentTime = percentage * this.allowedDuration;
  }

  formatTime(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }
}
