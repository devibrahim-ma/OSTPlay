import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { db } from './firebase.config';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { OSTLevel, LevelStatus } from '../types/ost-level.model';
import { ANIME_OST_LEVELS } from '../data/animeLevels';
import { ClassicModeService } from './modes/classic-mode.service';
import { AnimeModeService } from './modes/anime-mode.service';
import { RandomModeService } from './modes/random-mode.service';
import { DailyModeService } from './modes/daily-mode.service';
import { TranslationService } from './i18n/translation.service';
import { AuthService } from './auth.service';

export interface GameStats {
  moviesPlayed: number;
  moviesWon: number;
  seriesPlayed: number;
  seriesWon: number;
  animePlayed: number;
  animeWon: number;
  streak: number;
  maxStreak: number;
  distribution: number[]; // 5 indices for attempts 1-5
}

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  // Mode-specific services
  readonly classicModeService = inject(ClassicModeService);
  readonly animeModeService = inject(AnimeModeService);
  readonly randomModeService = inject(RandomModeService);
  readonly dailyModeService = inject(DailyModeService);
  readonly translationService = inject(TranslationService);
  readonly authService = inject(AuthService);

  isInitializedFromCloud = false;

  // All levels loaded from Firestore + local fallbacks
  allLevels = signal<OSTLevel[]>([]);
  displayTitles = signal<string[]>([]);
  translatedLevel = signal<OSTLevel | null>(null);

  // Current active game mode
  currentGameMode = signal<'movies' | 'series' | 'anime' | 'random' | 'daily'>('movies');

  // Current active category (movies, series, anime)
  currentCategory = signal<'movies' | 'series' | 'anime'>('movies');

  // Loading state for the DB fetch
  isLoadingLevels = signal<boolean>(true);

  // Filtered levels based on current category
  levels = computed<OSTLevel[]>(() => {
    const category = this.currentCategory();
    if (category === 'anime') {
      return this.allLevels().filter(l => l.isAnime === true);
    }
    return this.allLevels().filter(l => l.category === category && l.isAnime !== true);
  });

  // TMDb API Key (for dynamic fallback frames)
  tmdbApiKey = signal<string>('0554cd14a911e41f1caa592119361511');

  // Resolved dynamic URLs
  resolvedAudioUrl = signal<string>('');
  resolvedFrameUrl = signal<string>('');
  isLoadingMedia = signal<boolean>(false);

  // Dictionary to store the status of each level (levelId -> status)
  levelStatuses = signal<Record<string, LevelStatus>>({});

  // Active level selection for grid modes (movies, series, anime)
  currentLevelIndex = signal<number | null>(null);

  // Active custom level for non-grid modes (random, daily)
  activeCustomLevel = signal<OSTLevel | null>(null);

  // Active navigation view
  currentView = signal<'modes' | 'grid' | 'game' | 'profile'>('modes');

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
    animePlayed: 0,
    animeWon: 0,
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
    const mode = this.currentGameMode();
    if (mode === 'random' || mode === 'daily') {
      return this.activeCustomLevel();
    }
    const idx = this.currentLevelIndex();
    const currentList = this.levels();
    return idx !== null && idx >= 0 && idx < currentList.length ? currentList[idx] : null;
  });

  allTitles = computed<string[]>(() => {
    const mode = this.currentGameMode();
    if (mode === 'random' || mode === 'daily') {
      return [...new Set(this.allLevels().map(l => l.title))].sort((a, b) => a.localeCompare(b));
    }
    return [...new Set(this.levels().map(l => l.title))].sort((a, b) => a.localeCompare(b));
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

    // Effect to load stats/statuses from Firestore or local storage on Login
    effect(async () => {
      const user = this.authService.currentUser();
      const levels = this.allLevels();
      if (user && levels.length > 0) {
        this.isInitializedFromCloud = false;
        if (user.uid === 'guest') {
          // Guest mode: load progress from local storage
          this.loadLocalStats();
          this.initializeStatuses(levels);
          this.isInitializedFromCloud = true;
        } else {
          const userDocRef = doc(db, 'users', user.username.toLowerCase());
          try {
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const data = userDoc.data();
              if (data['stats']) {
                this.stats.set(data['stats']);
              }
              if (data['statuses']) {
                const cloudStatuses = data['statuses'];
                const initial: Record<string, LevelStatus> = {};
                levels.forEach(lvl => {
                  initial[lvl.levelId] = cloudStatuses[lvl.levelId] || 'neutral';
                });
                this.levelStatuses.set(initial);
              }
            }
          } catch (e) {
            console.error('Error loading stats from Firestore:', e);
          } finally {
            this.isInitializedFromCloud = true;
          }
        }
      } else {
        this.isInitializedFromCloud = false;
      }
    }, { allowSignalWrites: true });

    // Effect to save stats/statuses to Firestore or local storage on changes
    effect(async () => {
      const user = this.authService.currentUser();
      const stats = this.stats();
      const statuses = this.levelStatuses();

      if (user) {
        // Local storage is updated for everyone (guests and authenticated users)
        localStorage.setItem('ostplay_stats', JSON.stringify(stats));
        localStorage.setItem('ostplay_statuses', JSON.stringify(statuses));

        if (user.uid !== 'guest' && this.isInitializedFromCloud) {
          // Authenticated users also save to Firestore
          const userDocRef = doc(db, 'users', user.username.toLowerCase());
          try {
            await updateDoc(userDocRef, {
              stats,
              statuses
            });
          } catch (e) {
            console.error('Error syncing progress to Firestore:', e);
          }
        }
      }
    });

    // Effect to dynamically translate active level's title and plot overview
    effect(async () => {
      const level = this.currentLevel();
      const lang = this.translationService.currentLang();
      if (!level) {
        this.translatedLevel.set(null);
        return;
      }
      if (lang === 'en') {
        const tTitle = await this.translationService.translateEsToEn(level.title);
        const tPlot = await this.translationService.translateEsToEn(level.hints.plot);
        const tGenre = level.hints.genre ? await this.translationService.translateEsToEn(level.hints.genre) : '';
        const tSeasons = level.hints.seasons ? await this.translationService.translateEsToEn(level.hints.seasons) : '';
        this.translatedLevel.set({
          ...level,
          title: tTitle,
          hints: {
            ...level.hints,
            plot: tPlot,
            genre: tGenre,
            seasons: tSeasons
          }
        });
      } else {
        this.translatedLevel.set(level);
      }
    }, { allowSignalWrites: true });

    // Effect to translate all titles for autocompletion dropdown in real-time
    effect(async () => {
      const rawTitles = this.allTitles();
      const lang = this.translationService.currentLang();
      if (lang === 'en') {
        const translated = await this.translationService.getTranslatedTitles(rawTitles);
        this.displayTitles.set(translated);
      } else {
        this.displayTitles.set(rawTitles);
      }
    }, { allowSignalWrites: true });
  }

  private loadLocalStats() {
    const savedStats = localStorage.getItem('ostplay_stats');
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats);
        if (parsed.animePlayed === undefined) parsed.animePlayed = 0;
        if (parsed.animeWon === undefined) parsed.animeWon = 0;
        this.stats.set(parsed);
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
          isAnime: data['isAnime'] || false,
          title: data['title'] !== undefined && data['title'] !== null ? String(data['title']) : '',
          audioUrl: data['audioUrl'] || '',
          youtubeId: data['youtubeId'] || '',
          correctAnswers: Array.isArray(data['correctAnswers']) ? data['correctAnswers'] : [],
          hints: {
            actors: data['hints']?.actors || '',
            director: data['hints']?.director || '',
            frameUrl: data['hints']?.frameUrl || '',
            plot: data['hints']?.plot || '',
            genre: data['hints']?.genre || '',
            releaseYear: data['hints']?.releaseYear || '',
            seasons: data['hints']?.seasons || ''
          },
          audioStartOffset: data['audioStartOffset'] !== undefined ? Number(data['audioStartOffset']) : undefined,
          popularity: data['popularity'] !== undefined ? Number(data['popularity']) : 0
        });
      });

      // Si no hay ningún nivel de anime cargado en Firestore, inyectamos los locales
      const hasAnime = fetchedLevels.some(lvl => lvl.isAnime === true);
      if (!hasAnime) {
        fetchedLevels.push(...ANIME_OST_LEVELS);
      }

      // Ordenar los niveles de mayor a menor popularidad de TMDb (los más famosos primero)
      fetchedLevels.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

      this.allLevels.set(fetchedLevels);
      this.initializeStatuses(fetchedLevels);
    } catch (error) {
      console.error('Error cargando niveles de Firestore:', error);
      // Fallback a los niveles locales si hay error de conexión
      this.allLevels.set(ANIME_OST_LEVELS);
      this.initializeStatuses(ANIME_OST_LEVELS);
    } finally {
      this.isLoadingLevels.set(false);
    }
  }

  private initializeStatuses(fetchedLevels: OSTLevel[]) {
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
   * Cambia el modo de juego activo y la vista.
   */
  setGameMode(mode: 'movies' | 'series' | 'anime' | 'random' | 'daily') {
    this.currentGameMode.set(mode);
    this.currentLevelIndex.set(null);
    this.activeCustomLevel.set(null);

    if (mode === 'movies' || mode === 'series' || mode === 'anime') {
      this.currentCategory.set(mode);
      this.currentView.set('grid');
    } else if (mode === 'random') {
      this.currentView.set('game');
      this.startRandomLevel();
    } else if (mode === 'daily') {
      this.currentView.set('game');
      this.startDailyLevel();
    }
    window.scrollTo(0, 0);
  }

  /**
   * Navega a un nivel clásico o de anime específico.
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
      await this.resolveLevelMedia(level);
    }
  }

  /**
   * Inicia una ronda en el Modo Aleatorio.
   */
  async startRandomLevel() {
    const level = this.randomModeService.getRandomLevel(this.allLevels());
    if (level) {
      this.activeCustomLevel.set(level);
      this.currentAttempt.set(1);
      this.guessHistory.set([]);
      this.gameState.set('playing');
      await this.resolveLevelMedia(level);
    }
  }

  /**
   * Inicia el Reto Diario de hoy.
   */
  async startDailyLevel() {
    this.dailyModeService.checkTodayState();
    const level = this.dailyModeService.getDailyLevel(this.allLevels());
    if (level) {
      this.activeCustomLevel.set(level);
      const saved = this.dailyModeService.getSavedGameplayState();
      if (saved) {
        this.currentAttempt.set(saved.attempt);
        this.guessHistory.set(saved.guessHistory);
        this.gameState.set(saved.state);
      } else {
        this.currentAttempt.set(1);
        this.guessHistory.set([]);
        this.gameState.set('playing');
      }
      await this.resolveLevelMedia(level);
    }
  }

  /**
   * Resuelve el contenido de audio y vídeo de un nivel específico.
   */
  private async resolveLevelMedia(level: OSTLevel) {
    this.isLoadingMedia.set(true);
    this.resolvedAudioUrl.set('');
    this.resolvedFrameUrl.set(level.hints.frameUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=780');

    try {
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

      const key = this.tmdbApiKey().trim();
      if (key) {
        // 1. Resolve frame image if not present
        if (!level.hints.frameUrl) {
          const endpoint = level.category === 'series' ? 'tv' : 'movie';
          const tmdbUrl = `https://api.themoviedb.org/3/search/${endpoint}?api_key=${key}&query=${encodeURIComponent(level.title)}&language=es`;
          const tmdbRes = await fetch(tmdbUrl);
          const tmdbData = await tmdbRes.json();

          if (tmdbData.results && tmdbData.results.length > 0 && tmdbData.results[0].backdrop_path) {
            this.resolvedFrameUrl.set(`https://image.tmdb.org/t/p/w780${tmdbData.results[0].backdrop_path}`);
          }
        }

        // 2. If it's an anime, dynamically resolve missing genre, releaseYear, or seasons from TMDb details
        if (level.isAnime && (!level.hints.genre || !level.hints.releaseYear || !level.hints.seasons)) {
          const tmdbUrl = `https://api.themoviedb.org/3/search/tv?api_key=${key}&query=${encodeURIComponent(level.title)}&language=es`;
          const tmdbRes = await fetch(tmdbUrl);
          const tmdbData = await tmdbRes.json();

          if (tmdbData.results && tmdbData.results.length > 0) {
            const show = tmdbData.results[0];
            const tvId = show.id;

            const detailsUrl = `https://api.themoviedb.org/3/tv/${tvId}?api_key=${key}&language=es`;
            const detailsRes = await fetch(detailsUrl);
            const details = await detailsRes.json();

            if (details) {
              let updated = false;
              if (!level.hints.genre && details.genres) {
                level.hints.genre = details.genres.map((g: any) => g.name).join(', ');
                updated = true;
              }
              if (!level.hints.releaseYear && details.first_air_date) {
                level.hints.releaseYear = details.first_air_date.split('-')[0];
                updated = true;
              }
              if (!level.hints.seasons) {
                const seasonsCount = details.number_of_seasons || 1;
                const episodesCount = details.number_of_episodes || 0;
                level.hints.seasons = `${seasonsCount} temporadas (${episodesCount} episodios)`;
                updated = true;
              }

              if (updated) {
                // Trigger signal updates by re-setting the level reference
                const mode = this.currentGameMode();
                if (mode === 'random' || mode === 'daily') {
                  this.activeCustomLevel.set({ ...level });
                } else {
                  this.allLevels.update(lvls => {
                    return lvls.map(l => l.levelId === level.levelId ? { ...level } : l);
                  });
                }
              }
            }
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
   * Regresa a la vista anterior (cuadrícula o selector de modos).
   */
  backToGrid() {
    const mode = this.currentGameMode();
    if (mode === 'random' || mode === 'daily') {
      this.goToModes();
    } else {
      this.currentLevelIndex.set(null);
      this.currentView.set('grid');
      window.scrollTo(0, 0);
    }
  }

  goToModes() {
    this.currentLevelIndex.set(null);
    this.activeCustomLevel.set(null);
    this.currentView.set('modes');
    window.scrollTo(0, 0);
  }

  normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  submitGuess(guess: string): boolean {
    const level = this.currentLevel();
    if (!level || this.gameState() !== 'playing') return false;

    // Map English title back to original Spanish title if matched in the map
    const originalGuess = this.translationService.englishToSpanishMap.get(guess.toLowerCase().trim()) || guess;
    const normalizedGuess = this.normalizeText(originalGuess);
    const isCorrect = 
      this.normalizeText(level.title) === normalizedGuess ||
      level.correctAnswers.some(
        ans => this.normalizeText(ans) === normalizedGuess
      );

    if (isCorrect) {
      this.gameState.set('won');
      this.handleRoundComplete(true);
      return true;
    } else {
      const updatedHistory = [...this.guessHistory(), guess.trim()];
      this.guessHistory.set(updatedHistory);

      const nextAttempt = this.currentAttempt() + 1;
      if (nextAttempt <= 5) {
        this.currentAttempt.set(nextAttempt);
        this.saveActiveGameplayState(nextAttempt, updatedHistory, 'playing');
      } else {
        this.gameState.set('lost');
        this.handleRoundComplete(false);
      }
      return false;
    }
  }

  private handleRoundComplete(isWin: boolean) {
    const level = this.currentLevel();
    if (!level) return;

    const mode = this.currentGameMode();
    const attempt = this.currentAttempt();
    const history = this.guessHistory();
    const status = isWin ? 'won' : 'lost';

    if (mode === 'daily') {
      this.dailyModeService.saveDailyProgress(attempt, history, status);
      this.stats.update(curr => {
        return this.dailyModeService.onDailyCompleted(curr, isWin, attempt, level.category || 'movies');
      });
    } else if (mode === 'random') {
      this.stats.update(curr => {
        if (isWin) {
          return this.randomModeService.onLevelWon(curr);
        } else {
          return this.randomModeService.onLevelLost(curr);
        }
      });
    } else if (mode === 'anime') {
      this.updateLevelStatus(level.levelId, status);
      this.saveLevelGameplayState(level.levelId, attempt, history, status);
      this.stats.update(curr => {
        if (isWin) {
          return this.animeModeService.onLevelWon(curr);
        } else {
          return this.animeModeService.onLevelLost(curr);
        }
      });
    } else {
      // películas o series clásicos
      this.updateLevelStatus(level.levelId, status);
      this.saveLevelGameplayState(level.levelId, attempt, history, status);
      this.stats.update(curr => {
        return this.classicModeService.updateClassicStats(curr, mode, isWin, attempt);
      });
    }
  }

  private saveActiveGameplayState(attempt: number, guessHistory: string[], state: 'playing' | 'won' | 'lost') {
    const level = this.currentLevel();
    if (!level) return;

    const mode = this.currentGameMode();
    if (mode === 'daily') {
      this.dailyModeService.saveDailyProgress(attempt, guessHistory, state);
    } else if (mode === 'random') {
      // El modo aleatorio no necesita persistirse tras recarga para rondas intermedias
    } else {
      this.saveLevelGameplayState(level.levelId, attempt, guessHistory, state);
    }
  }

  /**
   * Carga el siguiente nivel disponible o ronda según el modo.
   */
  nextLevel() {
    const mode = this.currentGameMode();
    if (mode === 'random') {
      this.startRandomLevel();
    } else if (mode === 'daily') {
      // El Daily Challenge no tiene nivel siguiente
    } else {
      const currentIdx = this.currentLevelIndex();
      if (currentIdx !== null) {
        const nextIdx = currentIdx + 1;
        if (nextIdx < this.levels().length) {
          this.selectLevel(nextIdx);
        } else {
          this.backToGrid();
        }
      }
    }
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

    this.animeModeService.resetProgress();
    this.randomModeService.resetProgress();
    this.dailyModeService.resetProgress();

    const initialStats: GameStats = {
      moviesPlayed: 0,
      moviesWon: 0,
      seriesPlayed: 0,
      seriesWon: 0,
      animePlayed: 0,
      animeWon: 0,
      streak: 0,
      maxStreak: 0,
      distribution: [0, 0, 0, 0, 0]
    };
    this.stats.set(initialStats);
    localStorage.removeItem('ostplay_stats');

    this.currentLevelIndex.set(null);
    this.activeCustomLevel.set(null);
    this.currentGameMode.set('movies');
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
