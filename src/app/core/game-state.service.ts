import { Injectable, signal, computed } from '@angular/core';
import { db } from './firebase.config';
import { collection, getDocs } from 'firebase/firestore';
import { OSTLevel, LevelStatus } from '../types/ost-level.model';

export interface GameStats {
  moviesPlayed: number;
  moviesWon: number;
  seriesPlayed: number;
  seriesWon: number;
  streak: number;
  maxStreak: number;
  distribution: number[]; // 5 indices for attempts 1-5
}

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  // All levels loaded from Firestore
  allLevels = signal<OSTLevel[]>([]);

  // Current active category
  currentCategory = signal<'movies' | 'series'>('movies');

  // Loading state for the DB fetch
  isLoadingLevels = signal<boolean>(true);

  // Filtered levels based on current category
  levels = computed<OSTLevel[]>(() => {
    return this.allLevels().filter(l => l.category === this.currentCategory());
  });

  // TMDb API Key (Paste your API key here for dynamic fallback frames, though n8n provides them)
  tmdbApiKey = signal<string>('');

  // Resolved dynamic URLs resolved at runtime
  resolvedAudioUrl = signal<string>('');
  resolvedFrameUrl = signal<string>('');
  isLoadingMedia = signal<boolean>(false);

  // Dictionary to store the status of each level (levelId -> status)
  levelStatuses = signal<Record<string, LevelStatus>>({});

  // Active level selection (null represents the grid dashboard)
  currentLevelIndex = signal<number | null>(null);

  // Active navigation view
  currentView = signal<'modes' | 'grid' | 'game'>('modes');

  // Per-level active attempt states
  currentAttempt = signal<number>(1); // 1 to 5
  gameState = signal<'playing' | 'won' | 'lost'>('playing');
  guessHistory = signal<string[]>([]);

  // Stats tracking signal
  stats = signal<GameStats>({
    moviesPlayed: 0,
    moviesWon: 0,
    seriesPlayed: 0,
    seriesWon: 0,
    streak: 0,
    maxStreak: 0,
    distribution: [0, 0, 0, 0, 0]
  });

  // Mute state signal
  isMuted = signal<boolean>(false);

  // Active lightbox image signal
  activeLightboxImg = signal<string | null>(null);

  // Show reset confirmation modal signal
  showResetConfirm = signal<boolean>(false);

  // Computed / Derived State
  currentLevel = computed<OSTLevel | null>(() => {
    const idx = this.currentLevelIndex();
    const currentList = this.levels();
    return idx !== null && idx >= 0 && idx < currentList.length ? currentList[idx] : null;
  });

  allTitles = computed<string[]>(() => {
    return this.levels().map(l => l.title);
  });

  completedPercentage = computed<number>(() => {
    const currentList = this.levels();
    if (currentList.length === 0) return 0;
    const wonCount = currentList.filter(lvl => this.levelStatuses()[lvl.levelId] === 'won').length;
    return Math.round((wonCount / currentList.length) * 100);
  });

  constructor() {
    this.loadLevelsFromFirestore();
    this.loadLocalStats();
  }

  private loadLocalStats() {
    const savedStats = localStorage.getItem('ostplay_stats');
    if (savedStats) {
      try {
        this.stats.set(JSON.parse(savedStats));
      } catch (e) {
        console.error('Error parseando estadísticas:', e);
      }
    }

    const savedMuted = localStorage.getItem('ostplay_muted');
    if (savedMuted) {
      this.isMuted.set(savedMuted === 'true');
    }
  }

  /**
   * Carga los niveles de Firestore en tiempo real y recupera los estados locales de completado.
   */
  private async loadLevelsFromFirestore() {
    this.isLoadingLevels.set(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'levels'));
      const fetchedLevels: OSTLevel[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedLevels.push({
          levelId: data['levelId'] || doc.id,
          category: data['category'] || 'movies',
          title: data['title'] !== undefined && data['title'] !== null ? String(data['title']) : '',
          audioUrl: data['audioUrl'] || '',
          youtubeId: data['youtubeId'] || '',
          correctAnswers: Array.isArray(data['correctAnswers']) ? data['correctAnswers'] : [],
          hints: {
            actors: data['hints']?.actors || '',
            director: data['hints']?.director || '',
            frameUrl: data['hints']?.frameUrl || '',
            plot: data['hints']?.plot || ''
          },
          audioStartOffset: data['audioStartOffset'] !== undefined ? Number(data['audioStartOffset']) : undefined
        });
      });

      // Mezclar los niveles usando un hash determinista del ID para que el orden sea
      // aleatorio y no queden agrupados por nombre, pero siga siendo consistente al recargar.
      const getLevelHash = (id: string) => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
          hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
      };
      fetchedLevels.sort((a, b) => getLevelHash(a.levelId) - getLevelHash(b.levelId));

      this.allLevels.set(fetchedLevels);
      this.initializeStatuses(fetchedLevels);
    } catch (error) {
      console.error('Error cargando niveles de Firestore:', error);
    } finally {
      this.isLoadingLevels.set(false);
    }
  }

  private initializeStatuses(fetchedLevels: OSTLevel[]) {
    // Intentar recuperar el estado guardado del almacenamiento local
    const saved = localStorage.getItem('ostplay_statuses');
    let localStatuses: Record<string, LevelStatus> = {};
    if (saved) {
      try {
        localStatuses = JSON.parse(saved);
      } catch (e) {
        console.error('Error parseando localStorage:', e);
      }
    }

    const initial: Record<string, LevelStatus> = {};
    fetchedLevels.forEach(lvl => {
      initial[lvl.levelId] = localStatuses[lvl.levelId] || 'neutral';
    });
    this.levelStatuses.set(initial);
  }

  /**
   * Cambia la categoría activa y redirige a la cuadrícula de niveles.
   */
  setCategory(category: 'movies' | 'series') {
    this.currentCategory.set(category);
    this.currentLevelIndex.set(null);
    this.currentView.set('grid');
    window.scrollTo(0, 0);
  }

  /**
   * Navega a un nivel específico e inicia la resolución de audios/imágenes vía API.
   */
  async selectLevel(index: number) {
    const currentList = this.levels();
    if (index >= 0 && index < currentList.length) {
      const level = currentList[index];
      this.currentLevelIndex.set(index);

      // Restaurar estado guardado si ya ha sido jugado o está en curso
      const savedState = this.getLevelGameplayState(level.levelId);
      if (savedState) {
        this.currentAttempt.set(savedState.attempt);
        this.guessHistory.set(savedState.guessHistory);
        this.gameState.set(savedState.state);
      } else {
        this.currentAttempt.set(1);
        this.guessHistory.set([]);
        this.gameState.set('playing');
      }

      this.currentView.set('game');
      window.scrollTo(0, 0);

      // Resolve audio and frame URLs from APIs
      await this.resolveLevelMedia(level);
    }
  }

  /**
   * Obtiene la pista de iTunes (gratis, sin key) y usa el fotograma precargado en Firestore.
   */
  private async resolveLevelMedia(level: OSTLevel) {
    this.isLoadingMedia.set(true);
    this.resolvedAudioUrl.set('');

    // El fotograma ya viene resuelto por n8n en el campo frameUrl
    this.resolvedFrameUrl.set(level.hints.frameUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=780');

    try {
      // 1. Resolve YouTube Video ID (prioritize level.youtubeId, then extract from level.audioUrl)
      if (level.youtubeId) {
        this.resolvedAudioUrl.set(level.youtubeId);
      } else if (level.audioUrl && (level.audioUrl.includes('youtube.com') || level.audioUrl.includes('youtu.be'))) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = level.audioUrl.match(regExp);
        const videoId = (match && match[2].length === 11) ? match[2] : null;
        this.resolvedAudioUrl.set(videoId || level.audioUrl);
      } else {
        this.resolvedAudioUrl.set(level.audioUrl || '');
      }

      // 2. Si no hay frameUrl resuelto por n8n, lo buscamos en TMDb en vivo (si se configuró API Key)
      if (!level.hints.frameUrl) {
        const key = this.tmdbApiKey().trim();
        if (key) {
          const endpoint = level.category === 'series' ? 'tv' : 'movie';
          const tmdbUrl = `https://api.themoviedb.org/3/search/${endpoint}?api_key=${key}&query=${encodeURIComponent(level.title)}&language=es`;
          const tmdbRes = await fetch(tmdbUrl);
          const tmdbData = await tmdbRes.json();

          if (tmdbData.results && tmdbData.results.length > 0 && tmdbData.results[0].backdrop_path) {
            this.resolvedFrameUrl.set(`https://image.tmdb.org/t/p/w780${tmdbData.results[0].backdrop_path}`);
          }
        }
      }

    } catch (err) {
      console.error('Error resolviendo APIs multimedia de nivel:', err);
      this.resolvedAudioUrl.set(level.audioUrl || '');
    } finally {
      this.isLoadingMedia.set(false);
    }
  }

  /**
   * Regresa a la cuadrícula de selección de niveles.
   */
  backToGrid() {
    this.currentLevelIndex.set(null);
    this.currentView.set('grid');
    window.scrollTo(0, 0);
  }

  /**
   * Regresa al selector de modos principal.
   */
  goToModes() {
    this.currentLevelIndex.set(null);
    this.currentView.set('modes');
    window.scrollTo(0, 0);
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
      this.updateStats(true, this.currentAttempt(), this.currentCategory());
      this.saveLevelGameplayState(level.levelId, this.currentAttempt(), this.guessHistory(), 'won');
      return true;
    } else {
      const updatedHistory = [...this.guessHistory(), guess.trim()];
      this.guessHistory.set(updatedHistory);

      const nextAttempt = this.currentAttempt() + 1;
      if (nextAttempt <= 5) {
        this.currentAttempt.set(nextAttempt);
        this.saveLevelGameplayState(level.levelId, nextAttempt, updatedHistory, 'playing');
      } else {
        this.gameState.set('lost');
        this.updateLevelStatus(level.levelId, 'lost');
        this.updateStats(false, 5, this.currentCategory());
        this.saveLevelGameplayState(level.levelId, 5, updatedHistory, 'lost');
      }
      return false;
    }
  }

  private updateStats(isWin: boolean, attempt: number, category: 'movies' | 'series') {
    this.stats.update(curr => {
      const updated = { ...curr };
      if (category === 'movies') {
        updated.moviesPlayed += 1;
        if (isWin) updated.moviesWon += 1;
      } else {
        updated.seriesPlayed += 1;
        if (isWin) updated.seriesWon += 1;
      }

      if (isWin) {
        updated.streak += 1;
        if (updated.streak > updated.maxStreak) {
          updated.maxStreak = updated.streak;
        }
        const idx = Math.min(Math.max(0, attempt - 1), 4);
        updated.distribution = [...updated.distribution];
        updated.distribution[idx] += 1;
      } else {
        updated.streak = 0;
      }

      localStorage.setItem('ostplay_stats', JSON.stringify(updated));
      return updated;
    });
  }

  toggleMute() {
    const nextMuted = !this.isMuted();
    this.isMuted.set(nextMuted);
    localStorage.setItem('ostplay_muted', String(nextMuted));
  }

  selectLevelByNumber(num: number): boolean {
    const currentList = this.levels();
    const idx = num - 1;
    if (idx >= 0 && idx < currentList.length) {
      this.selectLevel(idx);
      return true;
    }
    return false;
  }

  private updateLevelStatus(levelId: string, status: LevelStatus) {
    this.levelStatuses.update(current => {
      const updated = {
        ...current,
        [levelId]: status
      };
      // Persistir en localStorage
      localStorage.setItem('ostplay_statuses', JSON.stringify(updated));
      return updated;
    });
  }

  resetAllGame() {
    const initial: Record<string, LevelStatus> = {};
    this.allLevels().forEach(lvl => {
      initial[lvl.levelId] = 'neutral';
    });
    this.levelStatuses.set(initial);
    localStorage.removeItem('ostplay_statuses');
    localStorage.removeItem('ostplay_gameplay_states');

    const initialStats: GameStats = {
      moviesPlayed: 0,
      moviesWon: 0,
      seriesPlayed: 0,
      seriesWon: 0,
      streak: 0,
      maxStreak: 0,
      distribution: [0, 0, 0, 0, 0]
    };
    this.stats.set(initialStats);
    localStorage.removeItem('ostplay_stats');

    this.currentLevelIndex.set(null);
    this.currentView.set('modes');
    window.scrollTo(0, 0);
  }

  private saveLevelGameplayState(levelId: string, attempt: number, guessHistory: string[], state: 'playing' | 'won' | 'lost') {
    const saved = localStorage.getItem('ostplay_gameplay_states');
    let gameplayStates: Record<string, { attempt: number, guessHistory: string[], state: 'playing' | 'won' | 'lost' }> = {};
    if (saved) {
      try {
        gameplayStates = JSON.parse(saved);
      } catch (e) { }
    }
    gameplayStates[levelId] = { attempt, guessHistory, state };
    localStorage.setItem('ostplay_gameplay_states', JSON.stringify(gameplayStates));
  }

  private getLevelGameplayState(levelId: string): { attempt: number, guessHistory: string[], state: 'playing' | 'won' | 'lost' } | null {
    const saved = localStorage.getItem('ostplay_gameplay_states');
    if (saved) {
      try {
        const gameplayStates = JSON.parse(saved);
        return gameplayStates[levelId] || null;
      } catch (e) { }
    }
    return null;
  }
}
