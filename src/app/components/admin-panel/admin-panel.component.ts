import { Component, ElementRef, OnDestroy, OnInit, ViewChild, signal, computed, inject, NgZone, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../../core/game-state.service';
import { OSTLevel } from '../../types/ost-level.model';
import { TranslationService } from '../../core/i18n/translation.service';

declare var YT: any;

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.css'
})
export class AdminPanelComponent implements OnInit, OnDestroy {
  readonly gameStateService = inject(GameStateService);
  readonly translationService = inject(TranslationService);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  // Levels search & filtering
  searchQuery = signal<string>('');
  selectedCategory = signal<'all' | 'movies' | 'series' | 'anime'>('all');

  // Selected level for verification
  selectedLevel = signal<OSTLevel | null>(null);

  // Input model for the offset and youtube video
  offsetInput = 0;
  youtubeInput = '';

  // Audio Playback states
  isPlaying = false;
  currentTime = 0;
  totalDuration = 0;
  volume = 0.5;
  isMuted = false;

  // YT Player reference
  private ytPlayer: any;
  private timeTrackerInterval: any;

  // Save UI Status
  isSaving = false;
  saveSuccess = false;
  errorMessage = '';

  // visualizer waves state
  wavePhase = 0;
  private animationId?: number;
  @ViewChild('visualizerCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private canvasCtx?: CanvasRenderingContext2D;

  // All categories split & sorted by current popularity descending
  moviesList = computed(() => this.gameStateService.allLevels().filter(l => l.category === 'movies' && l.isAnime !== true));
  seriesList = computed(() => this.gameStateService.allLevels().filter(l => l.category === 'series' && l.isAnime !== true));
  animeList = computed(() => this.gameStateService.allLevels().filter(l => l.isAnime === true));

  // Local ordered list for dragging/reordering
  localOrderedLevels = signal<OSTLevel[]>([]);
  isDirty = signal<boolean>(false);
  isReorderSaving = false;
  reorderSuccess = false;
  showToastPopup = false;
  private lastLoadedCategory = '';

  draggedIndex: number | null = null;

  constructor() {
    // Keep localOrderedLevels in sync with selectedCategory and database levels list
    effect(() => {
      const category = this.selectedCategory();
      const rawLevels = this.gameStateService.allLevels();
      if (rawLevels.length === 0) return;

      const categoryChanged = category !== this.lastLoadedCategory;

      if (categoryChanged || !this.isDirty()) {
        this.lastLoadedCategory = category;

        if (category === 'movies') {
          this.localOrderedLevels.set([...this.moviesList()]);
        } else if (category === 'series') {
          this.localOrderedLevels.set([...this.seriesList()]);
        } else if (category === 'anime') {
          this.localOrderedLevels.set([...this.animeList()]);
        } else {
          // Interleave movies, series, and anime by level index
          const m = this.moviesList();
          const s = this.seriesList();
          const a = this.animeList();
          const interleaved: OSTLevel[] = [];
          const max = Math.max(m.length, s.length, a.length);
          for (let i = 0; i < max; i++) {
            if (i < m.length) interleaved.push(m[i]);
            if (i < s.length) interleaved.push(s[i]);
            if (i < a.length) interleaved.push(a[i]);
          }
          this.localOrderedLevels.set(interleaved);
        }
        this.isDirty.set(false);
      }
    });
  }

  // Filtered levels computed list (respects local reordering + search queries)
  filteredLevels = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.localOrderedLevels();

    if (!query) return list;
    return list.filter(l => 
      l.title.toLowerCase().includes(query) || 
      (l.levelId && l.levelId.toLowerCase().includes(query))
    );
  });

  // Drag and Drop Event Handlers
  onDragStart(index: number, event: DragEvent) {
    // Reordering is disabled in "Todos" or when filtering by query
    if (this.selectedCategory() === 'all' || this.searchQuery().trim()) {
      event.preventDefault();
      return;
    }
    this.draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(dropIndex: number, event: DragEvent) {
    event.preventDefault();
    if (this.draggedIndex === null || this.draggedIndex === dropIndex) return;

    const list = [...this.localOrderedLevels()];
    const [removed] = list.splice(this.draggedIndex, 1);
    list.splice(dropIndex, 0, removed);

    this.localOrderedLevels.set(list);
    this.isDirty.set(true);
    this.draggedIndex = null;
    this.cdr.detectChanges();
  }

  onDragEnd() {
    this.draggedIndex = null;
  }

  // Quick reorder buttons for accessibility and mobile support
  moveLevel(index: number, direction: 'up' | 'down') {
    const list = [...this.localOrderedLevels()];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    this.localOrderedLevels.set(list);
    this.isDirty.set(true);
    this.cdr.detectChanges();
  }

  // Save the reordered levels list to Firestore in a single batch
  async saveReorderedList() {
    if (!this.isDirty() || this.selectedCategory() === 'all') return;

    this.isReorderSaving = true;
    this.reorderSuccess = false;
    this.errorMessage = '';

    const list = this.localOrderedLevels();
    const orderedIds = list.map(l => String(l.levelId));

    try {
      await this.gameStateService.updateLevelsOrder(orderedIds);
      this.reorderSuccess = true;
      this.isDirty.set(false);
      this.triggerToastPopup();
      
      setTimeout(() => {
        this.reorderSuccess = false;
        this.cdr.detectChanges();
      }, 3000);
    } catch (err: any) {
      this.errorMessage = 'Error al reordenar: ' + (err.message || err);
    } finally {
      this.isReorderSaving = false;
      this.cdr.detectChanges();
    }
  }

  // Compute text like "Película • Nivel 5" dynamically
  getDisplayLevelText(level: OSTLevel, currentIndex: number): string {
    const cat = level.isAnime ? 'Anime' : (level.category === 'movies' ? 'Película' : 'Serie');
    
    if (this.selectedCategory() !== 'all') {
      return `${cat} • Nivel ${currentIndex + 1}`;
    } else {
      const m = this.moviesList();
      const s = this.seriesList();
      const a = this.animeList();
      
      let lvlNum = 0;
      if (level.isAnime) {
        lvlNum = a.findIndex(l => l.levelId === level.levelId) + 1;
      } else if (level.category === 'movies') {
        lvlNum = m.findIndex(l => l.levelId === level.levelId) + 1;
      } else if (level.category === 'series') {
        lvlNum = s.findIndex(l => l.levelId === level.levelId) + 1;
      }
      return `${cat} • Nivel ${lvlNum}`;
    }
  }

  triggerToastPopup() {
    this.showToastPopup = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showToastPopup = false;
      this.cdr.detectChanges();
    }, 4000);
  }

  promptMoveToPosition(index: number) {
    const targetLevelStr = prompt('Mover este nivel a la posición (número de nivel):', (index + 1).toString());
    if (targetLevelStr === null) return;
    
    const targetLevel = parseInt(targetLevelStr, 10);
    if (isNaN(targetLevel) || targetLevel < 1 || targetLevel > this.localOrderedLevels().length) {
      alert('Número de nivel inválido.');
      return;
    }

    const targetIndex = targetLevel - 1;
    if (targetIndex === index) return;

    const list = [...this.localOrderedLevels()];
    const [removed] = list.splice(index, 1);
    list.splice(targetIndex, 0, removed);

    this.localOrderedLevels.set(list);
    this.isDirty.set(true);
    this.cdr.detectChanges();
  }

  t(key: string): string {
    return this.translationService.t(key);
  }

  ngOnInit() {
    this.initCanvas();
    this.startDrawingLoop();
  }

  ngOnDestroy() {
    this.stopTrackingTime();
    this.destroyPlayer();
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  goBack() {
    this.gameStateService.currentView.set('profile');
  }

  selectLevel(level: OSTLevel) {
    this.selectedLevel.set(level);
    this.offsetInput = level.audioStartOffset !== undefined ? level.audioStartOffset : 0;
    this.youtubeInput = level.youtubeId || level.audioUrl || '';
    this.currentTime = 0;
    this.totalDuration = 0;
    this.isPlaying = false;
    this.saveSuccess = false;
    this.errorMessage = '';

    this.stopTrackingTime();
    this.loadVideoForLevel(level);
  }

  private loadVideoForLevel(level: OSTLevel) {
    this.destroyPlayer();
    const inputVal = this.youtubeInput.trim();
    const videoId = this.extractYoutubeId(inputVal) || level.youtubeId || this.extractYoutubeId(level.audioUrl);
    if (!videoId) {
      console.warn('No se pudo resolver el ID de YouTube para este nivel');
      return;
    }

    const startSecs = level.audioStartOffset || 0;
    this.loadVideoForId(videoId, startSecs);
  }

  private loadVideoForId(videoId: string, startSecs: number) {
    this.destroyPlayer();
    this.ngZone.runOutsideAngular(() => {
      const container = document.getElementById('admin-yt-player-container');
      if (typeof YT !== 'undefined' && YT.Player && container) {
        // Create wrapper element to prevent player replace issues
        const wrapper = document.createElement('div');
        wrapper.id = 'admin-player-target';
        container.appendChild(wrapper);

        this.ytPlayer = new YT.Player('admin-player-target', {
          height: '0',
          width: '0',
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            origin: window.location.origin
          },
          events: {
            onReady: (event: any) => {
              this.ngZone.run(() => {
                try {
                  this.ytPlayer.setVolume(this.isMuted ? 0 : this.volume * 100);
                  this.ytPlayer.seekTo(startSecs, true);
                  this.ytPlayer.playVideo();
                } catch (e) {
                  console.error('Error starting video playback:', e);
                }
                this.totalDuration = this.ytPlayer.getDuration();
                this.currentTime = startSecs;
                this.isPlaying = true;
                this.startTrackingTime();
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
                console.error('Admin YouTube Player Error:', err);
                this.errorMessage = 'Error al cargar el video de YouTube.';
                this.cdr.detectChanges();
              });
            }
          }
        });
      }
    });
  }

  previewNewVideo() {
    const videoId = this.extractYoutubeId(this.youtubeInput);
    if (!videoId) {
      this.errorMessage = 'ID o URL de YouTube no válido';
      return;
    }
    this.errorMessage = '';
    this.currentTime = 0;
    this.totalDuration = 0;
    this.isPlaying = false;
    this.loadVideoForId(videoId, this.offsetInput);
  }

  private destroyPlayer() {
    this.stopTrackingTime();
    if (this.ytPlayer) {
      try {
        this.ytPlayer.destroy();
      } catch (e) {
        console.warn('Error destroying player:', e);
      }
      this.ytPlayer = null;
    }
    const container = document.getElementById('admin-yt-player-container');
    if (container) {
      container.innerHTML = '';
    }
  }

  togglePlay() {
    if (!this.ytPlayer) return;
    if (this.isPlaying) {
      this.ytPlayer.pauseVideo();
    } else {
      this.ytPlayer.playVideo();
    }
  }

  seekTo(seconds: number) {
    if (!this.ytPlayer) return;
    this.ytPlayer.seekTo(seconds, true);
    this.currentTime = seconds;
    this.cdr.detectChanges();
  }

  skip(seconds: number) {
    if (!this.ytPlayer) return;
    const target = Math.max(0, Math.min(this.totalDuration, this.currentTime + seconds));
    this.seekTo(target);
  }

  setOffsetFromCurrentTime() {
    this.offsetInput = Math.round(this.currentTime);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ytPlayer) {
      this.ytPlayer.setVolume(this.isMuted ? 0 : this.volume * 100);
    }
  }

  onVolumeChange(val: string) {
    this.volume = parseFloat(val);
    this.isMuted = false;
    if (this.ytPlayer) {
      this.ytPlayer.setVolume(this.volume * 100);
    }
  }

  async saveOffset() {
    const level = this.selectedLevel();
    if (!level) return;

    this.isSaving = true;
    this.saveSuccess = false;
    this.errorMessage = '';

    const cleanVideoId = this.extractYoutubeId(this.youtubeInput);
    if (!cleanVideoId) {
      this.errorMessage = 'ID o URL de YouTube no válido';
      this.isSaving = false;
      return;
    }

    const newAudioUrl = `https://www.youtube.com/watch?v=${cleanVideoId}`;

    try {
      const details = {
        audioStartOffset: this.offsetInput,
        youtubeId: cleanVideoId,
        audioUrl: newAudioUrl
      };
      await this.gameStateService.updateLevelDetails(level.levelId, details);
      this.saveSuccess = true;
      this.triggerToastPopup();
      
      // Update local level reference to reflect changes
      level.audioStartOffset = this.offsetInput;
      level.youtubeId = cleanVideoId;
      level.audioUrl = newAudioUrl;
      
      setTimeout(() => {
        this.saveSuccess = false;
        this.cdr.detectChanges();
      }, 3000);
    } catch (err: any) {
      this.errorMessage = 'Error al guardar en Firestore: ' + (err.message || err);
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  private startTrackingTime() {
    this.stopTrackingTime();
    this.timeTrackerInterval = setInterval(() => {
      if (this.ytPlayer && typeof this.ytPlayer.getCurrentTime === 'function') {
        try {
          this.currentTime = this.ytPlayer.getCurrentTime();
          const duration = this.ytPlayer.getDuration();
          if (duration && duration !== this.totalDuration) {
            this.totalDuration = duration;
          }
          this.cdr.detectChanges();
        } catch (e) {}
      }
    }, 250);
  }

  private stopTrackingTime() {
    if (this.timeTrackerInterval) {
      clearInterval(this.timeTrackerInterval);
      this.timeTrackerInterval = null;
    }
  }

  formatTime(secs: number): string {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  private extractYoutubeId(url: string): string {
    if (!url) return '';
    if (url.length === 11) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  }

  // --- Visual Canvas Animation (Premium aesthetics) ---
  private initCanvas() {
    if (this.canvasRef && this.canvasRef.nativeElement) {
      const canvas = this.canvasRef.nativeElement;
      this.canvasCtx = canvas.getContext('2d') || undefined;
      
      // Handle high DPI displays
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      this.canvasCtx?.scale(dpr, dpr);
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
    if (!this.canvasCtx || !this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    this.canvasCtx.clearRect(0, 0, width, height);

    // Wave color gradient
    const gradient = this.canvasCtx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#14cad8'); // brand cyan
    gradient.addColorStop(0.5, '#6366f1'); // brand indigo
    gradient.addColorStop(1, '#a855f7'); // brand purple

    this.canvasCtx.lineWidth = 2.5;
    this.canvasCtx.strokeStyle = gradient;
    this.canvasCtx.lineCap = 'round';

    this.canvasCtx.beginPath();

    const points = 80;
    const amplitude = this.isPlaying ? 22 : 4;
    this.wavePhase += this.isPlaying ? 0.08 : 0.015;

    for (let i = 0; i <= points; i++) {
      const x = (i / points) * width;
      // Multiplying by a sine factor to taper waves at edges
      const edgeTaper = Math.sin((i / points) * Math.PI);
      const angle = (i / points) * Math.PI * 8 + this.wavePhase;
      const y = height / 2 + Math.sin(angle) * amplitude * edgeTaper;

      if (i === 0) {
        this.canvasCtx.moveTo(x, y);
      } else {
        this.canvasCtx.lineTo(x, y);
      }
    }

    this.canvasCtx.stroke();
  }
}
