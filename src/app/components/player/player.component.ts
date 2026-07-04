import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      <!-- Glow effect -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.1),transparent_60%)] pointer-events-none"></div>

      <!-- Native Audio Hidden Element -->
      <audio 
        #audioElement 
        [src]="audioUrl" 
        (timeupdate)="onTimeUpdate()" 
        (ended)="onEnded()"
        (loadedmetadata)="onLoadedMetadata()">
      </audio>

      <div class="relative z-10 flex flex-col gap-5">
        <!-- Header -->
        <div class="flex justify-between items-center">
          <span class="text-xs font-bold text-teal-400 uppercase tracking-widest flex items-center gap-1.5">
            <span class="w-2 h-2 bg-teal-500 rounded-full animate-ping"></span>
            Reproductor de Audio
          </span>
          <span class="text-2xs text-slate-500 font-mono">
            Límite: <strong class="text-slate-300 font-bold font-mono">{{ allowedDuration }}s</strong>
          </span>
        </div>

        <!-- Waveform/Progress bar simulator -->
        <div class="space-y-2">
          <!-- Timeline Bar -->
          <div 
            (click)="seek($event)"
            class="w-full h-3 bg-slate-950 border border-slate-800 rounded-full cursor-pointer relative overflow-hidden group">
            
            <!-- Played progress -->
            <div 
              class="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-100 ease-out shadow-[0_0_8px_rgba(20,184,166,0.5)]" 
              [style.width.%]="progressPercentage">
            </div>

            <!-- Allowed segment indicator -->
            <div 
              class="absolute top-0 bottom-0 border-r-2 border-red-500/80 bg-red-500/10 pointer-events-none" 
              [style.width.%]="allowedPercentage">
              <span class="absolute right-1 top-0.5 text-[8px] font-bold text-red-400 leading-none">Límite</span>
            </div>
          </div>

          <!-- Time Counters -->
          <div class="flex justify-between text-3xs font-mono text-slate-500">
            <span>{{ formatTime(currentTime) }}</span>
            <span>{{ formatTime(allowedDuration) }}</span>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex justify-center items-center gap-6">
          <!-- Rewind to 0 -->
          <button 
            type="button"
            (click)="rewind()"
            [disabled]="!isAudioLoaded"
            class="p-2.5 bg-slate-950 border border-slate-800 rounded-full text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-900 transition disabled:opacity-40 disabled:pointer-events-none active:scale-90">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
          </button>

          <!-- Play/Pause Circular Neon Button -->
          <button 
            type="button"
            (click)="togglePlay()"
            [disabled]="!isAudioLoaded"
            [class.bg-teal-500]="isPlaying"
            [class.text-slate-950]="isPlaying"
            [class.bg-slate-950]="!isPlaying"
            [class.text-teal-400]="!isPlaying"
            class="w-14 h-14 rounded-full border border-teal-500/30 flex items-center justify-center shadow-lg hover:shadow-teal-500/20 transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none active:scale-95">
            <!-- Play Icon -->
            <svg *ngIf="!isPlaying" xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>
            <!-- Pause Icon -->
            <svg *ngIf="isPlaying" xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <!-- Status indicator -->
          <div class="w-10 text-center">
            <span *ngIf="!isAudioLoaded" class="text-4xs font-bold text-amber-500 uppercase tracking-wider animate-pulse">Cargando</span>
            <span *ngIf="isAudioLoaded && isPlaying" class="text-4xs font-bold text-teal-400 uppercase tracking-wider">Sonando</span>
            <span *ngIf="isAudioLoaded && !isPlaying" class="text-4xs font-bold text-slate-500 uppercase tracking-wider">Pausa</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PlayerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() audioUrl!: string;
  @Input() currentAttempt = 1;

  @ViewChild('audioElement', { static: true }) audioRef!: ElementRef<HTMLAudioElement>;

  // Playback limits for each attempt (Attempt 1 = 2s, Attempt 2 = 5s, etc.)
  readonly playbackLimits = [2, 5, 10, 15, 30];

  isPlaying = false;
  isAudioLoaded = false;
  currentTime = 0;
  totalDuration = 0;

  get allowedDuration(): number {
    const attemptIndex = Math.min(this.currentAttempt - 1, this.playbackLimits.length - 1);
    return this.playbackLimits[attemptIndex];
  }

  get progressPercentage(): number {
    if (!this.allowedDuration) return 0;
    return Math.min((this.currentTime / this.allowedDuration) * 100, 100);
  }

  get allowedPercentage(): number {
    if (!this.totalDuration) return 100;
    return Math.min((this.allowedDuration / this.totalDuration) * 100, 100);
  }

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['audioUrl']) {
      this.isAudioLoaded = false;
      this.isPlaying = false;
      this.currentTime = 0;
    }
  }

  ngOnDestroy() {
    this.pause();
  }

  togglePlay() {
    if (!this.isAudioLoaded) return;
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    const audio = this.audioRef.nativeElement;
    // If we've already exceeded the limit, reset to 0 before playing
    if (audio.currentTime >= this.allowedDuration) {
      audio.currentTime = 0;
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
    audio.currentTime = 0;
    this.currentTime = 0;
    if (this.isPlaying) {
      this.play();
    }
  }

  onTimeUpdate() {
    const audio = this.audioRef.nativeElement;
    this.currentTime = audio.currentTime;

    // Check if player exceeded allowed duration for current attempt
    if (audio.currentTime >= this.allowedDuration) {
      this.pause();
      audio.currentTime = 0;
      this.currentTime = 0;
    }
  }

  onEnded() {
    this.isPlaying = false;
    this.currentTime = 0;
  }

  onLoadedMetadata() {
    const audio = this.audioRef.nativeElement;
    this.totalDuration = audio.duration;
    this.isAudioLoaded = true;
  }

  seek(event: MouseEvent) {
    if (!this.isAudioLoaded) return;
    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    // Seek only within the allowed duration segment
    const targetTime = percentage * this.allowedDuration;
    this.audioRef.nativeElement.currentTime = targetTime;
    this.currentTime = targetTime;
  }

  formatTime(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }
}
