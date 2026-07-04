import { Injectable, signal, computed } from '@angular/core';
import { db } from './firebase.config';
import { collection, getDocs } from 'firebase/firestore';
import { OSTLevel, LevelStatus } from '../types/ost-level.model';

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
  
  // Per-level active attempt states
  currentAttempt = signal<number>(1); // 1 to 5
  gameState = signal<'playing' | 'won' | 'lost'>('playing');
  guessHistory = signal<string[]>([]);

  // Computed / Derived State
  currentLevel = computed<OSTLevel | null>(() => {
    const idx = this.currentLevelIndex();
    const currentList = this.levels();
    return idx !== null && idx >= 0 && idx < currentList.length ? currentList[idx] : null;
  });

  allTitles = computed<string[]>(() => {
    return this.levels().map(l => l.title);
  });

  constructor() {
    this.loadLevelsFromFirestore();
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
          title: data['title'] || '',
          audioUrl: data['audioUrl'] || '',
          correctAnswers: data['correctAnswers'] || [],
          hints: data['hints'] || { actors: '', director: '', frameUrl: '', plot: '' }
        });
      });

      // Ordenar por título o ID de forma consistente
      fetchedLevels.sort((a, b) => a.title.localeCompare(b.title));
      
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
   * Cambia la categoría activa y reinicia la selección de nivel.
   */
  setCategory(category: 'movies' | 'series') {
    this.currentCategory.set(category);
    this.currentLevelIndex.set(null);
  }

  /**
   * Navega a un nivel específico e inicia la resolución de audios/imágenes vía API.
   */
  async selectLevel(index: number) {
    const currentList = this.levels();
    if (index >= 0 && index < currentList.length) {
      this.currentLevelIndex.set(index);
      this.currentAttempt.set(1);
      this.guessHistory.set([]);
      this.gameState.set('playing');
      
      // Resolve audio and frame URLs from APIs
      await this.resolveLevelMedia(currentList[index]);
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
      // 1. Fetch Audio Preview from iTunes API (No API Key required)
      const searchQuery = level.category === 'series' 
        ? `${level.title} tv soundtrack` 
        : `${level.title} soundtrack`;

      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=music&limit=3`;
      const itunesRes = await fetch(itunesUrl);
      const itunesData = await itunesRes.json();
      
      if (itunesData.results && itunesData.results.length > 0) {
        this.resolvedAudioUrl.set(itunesData.results[0].previewUrl);
      } else {
        // Fallback si no hay resultado en iTunes
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
    this.currentLevelIndex.set(null);
  }
}
