import { Injectable, signal, computed } from '@angular/core';
import { MOCK_OST_LEVELS } from '../data/mockLevels';
import { OSTLevel, LevelStatus } from '../types/ost-level.model';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  readonly levels: OSTLevel[] = MOCK_OST_LEVELS;

  // TMDb API Key (Paste your API key here for dynamic frames)
  tmdbApiKey = signal<string>('');

  // Resolved dynamic URLs resolved at runtime
  resolvedAudioUrl = signal<string>('');
  resolvedFrameUrl = signal<string>('');
  isLoadingMedia = signal<boolean>(false);

  // Dictionary to store the status of each level (levelId -> status)
  levelStatuses = signal<Record<string, LevelStatus>>({});

  // Active level selection (null represents the grid dashboard)
  currentLevelIndex = signal<number | null>(null);
  
  // Per-level active attempt states
  currentAttempt = signal<number>(1); // 1 to 5
  gameState = signal<'playing' | 'won' | 'lost'>('playing');
  guessHistory = signal<string[]>([]);

  // Computed / Derived State
  currentLevel = computed<OSTLevel | null>(() => {
    const idx = this.currentLevelIndex();
    return idx !== null ? this.levels[idx] : null;
  });

  allTitles = computed<string[]>(() => {
    return this.levels.map(l => l.title);
  });

  constructor() {
    this.initializeStatuses();
  }

  private initializeStatuses() {
    const initial: Record<string, LevelStatus> = {};
    this.levels.forEach(lvl => {
      initial[lvl.levelId] = 'neutral';
    });
    this.levelStatuses.set(initial);
  }

  /**
   * Navega a un nivel específico e inicia la resolución de audios/imágenes vía API.
   */
  async selectLevel(index: number) {
    if (index >= 0 && index < this.levels.length) {
      this.currentLevelIndex.set(index);
      this.currentAttempt.set(1);
      this.guessHistory.set([]);
      this.gameState.set('playing');
      
      // Resolve audio and frame URLs from APIs
      await this.resolveLevelMedia(this.levels[index]);
    }
  }

  /**
   * Obtiene la pista de iTunes (gratis, sin key) y el fotograma de TMDb (con key opcional).
   */
  private async resolveLevelMedia(level: OSTLevel) {
    this.isLoadingMedia.set(true);
    this.resolvedAudioUrl.set('');
    this.resolvedFrameUrl.set('');

    try {
      // 1. Fetch Audio Preview from iTunes API (No API Key required)
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(level.title + ' soundtrack')}&media=music&limit=3`;
      const itunesRes = await fetch(itunesUrl);
      const itunesData = await itunesRes.json();
      
      if (itunesData.results && itunesData.results.length > 0) {
        this.resolvedAudioUrl.set(itunesData.results[0].previewUrl);
      } else {
        // Fallback to static URL if defined
        this.resolvedAudioUrl.set(level.audioUrl || '');
      }

      // 2. Fetch Movie Frame (Backdrop) from TMDb API (Requires API Key)
      const key = this.tmdbApiKey().trim();
      if (key) {
        const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${encodeURIComponent(level.title)}&language=es`;
        const tmdbRes = await fetch(tmdbUrl);
        const tmdbData = await tmdbRes.json();
        
        if (tmdbData.results && tmdbData.results.length > 0 && tmdbData.results[0].backdrop_path) {
          this.resolvedFrameUrl.set(`https://image.tmdb.org/t/p/w780${tmdbData.results[0].backdrop_path}`);
        } else {
          // Fallback if not found in TMDb
          this.resolvedFrameUrl.set(level.hints.frameUrl || 'images/frames/titanic_frame.png');
        }
      } else {
        // Fallback to local image or Unsplash if no API key is configured
        this.resolvedFrameUrl.set(level.hints.frameUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=780');
      }

    } catch (err) {
      console.error('Error resolviendo APIs multimedia de nivel:', err);
      // Fallbacks
      this.resolvedAudioUrl.set(level.audioUrl || '');
      this.resolvedFrameUrl.set(level.hints.frameUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=780');
    } finally {
      this.isLoadingMedia.set(false);
    }
  }

  /**
   * Regresa a la cuadrícula de selección de niveles.
   */
  backToGrid() {
    this.currentLevelIndex.set(null);
  }

  normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quita acentos
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  submitGuess(guess: string): boolean {
    const level = this.currentLevel();
    if (!level || this.gameState() !== 'playing') return false;

    const normalizedGuess = this.normalizeText(guess);

    const isCorrect = level.correctAnswers.some(
      ans => this.normalizeText(ans) === normalizedGuess
    );

    if (isCorrect) {
      this.gameState.set('won');
      this.updateLevelStatus(level.levelId, 'won');
      return true;
    } else {
      this.guessHistory.update(history => [...history, guess.trim()]);
      
      const nextAttempt = this.currentAttempt() + 1;
      if (nextAttempt <= 5) {
        this.currentAttempt.set(nextAttempt);
      } else {
        this.gameState.set('lost');
        this.updateLevelStatus(level.levelId, 'lost');
      }
      return false;
    }
  }

  private updateLevelStatus(levelId: string, status: LevelStatus) {
    this.levelStatuses.update(current => ({
      ...current,
      [levelId]: status
    }));
  }

  resetAllGame() {
    this.initializeStatuses();
    this.currentLevelIndex.set(null);
  }
}
