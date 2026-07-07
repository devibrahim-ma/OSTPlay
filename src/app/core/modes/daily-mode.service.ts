import { Injectable, signal } from '@angular/core';
import { OSTLevel } from '../../types/ost-level.model';

export interface DailyGameplayState {
  date: string;
  attempt: number;
  guessHistory: string[];
  state: 'playing' | 'won' | 'lost';
}

@Injectable({
  providedIn: 'root'
})
export class DailyModeService {
  // Signal to check if the daily challenge is completed today
  readonly isDailyCompleted = signal<boolean>(false);
  readonly dailyState = signal<DailyGameplayState | null>(null);

  constructor() {
    this.checkTodayState();
  }

  getTodayDateString(): string {
    // Return local date string YYYY-MM-DD
    const date = new Date();
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }

  checkTodayState() {
    const today = this.getTodayDateString();
    const saved = localStorage.getItem('ostplay_daily_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DailyGameplayState;
        if (parsed.date === today) {
          this.dailyState.set(parsed);
          this.isDailyCompleted.set(parsed.state === 'won' || parsed.state === 'lost');
          return;
        }
      } catch (e) {
        console.error('Error parseando estado diario:', e);
      }
    }
    // If no saved state or it's from a different day, reset it
    this.dailyState.set(null);
    this.isDailyCompleted.set(false);
  }

  getDailyLevel(allLevels: OSTLevel[]): OSTLevel | null {
    if (allLevels.length === 0) return null;
    
    // Calculate deterministic hash based on date string
    const todayStr = this.getTodayDateString();
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash = todayStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % allLevels.length;
    return allLevels[index];
  }

  // Restore daily state for gameplay
  getSavedGameplayState(): { attempt: number, guessHistory: string[], state: 'playing' | 'won' | 'lost' } | null {
    this.checkTodayState();
    const state = this.dailyState();
    if (state) {
      return {
        attempt: state.attempt,
        guessHistory: state.guessHistory,
        state: state.state
      };
    }
    return null;
  }

  // Save active daily gameplay
  saveDailyProgress(attempt: number, guessHistory: string[], state: 'playing' | 'won' | 'lost') {
    const today = this.getTodayDateString();
    const newState: DailyGameplayState = {
      date: today,
      attempt,
      guessHistory,
      state
    };
    localStorage.setItem('ostplay_daily_state', JSON.stringify(newState));
    this.dailyState.set(newState);
    this.isDailyCompleted.set(state === 'won' || state === 'lost');
  }

  // Update stats on complete
  onDailyCompleted(stats: any, isWin: boolean, attempt: number, category: string): any {
    const updated = { ...stats };
    if (category === 'movies') {
      updated.moviesPlayed += 1;
      if (isWin) updated.moviesWon += 1;
    } else if (category === 'series') {
      updated.seriesPlayed += 1;
      if (isWin) updated.seriesWon += 1;
    } else if (category === 'anime') {
      updated.animePlayed = (updated.animePlayed || 0) + 1;
      if (isWin) updated.animeWon = (updated.animeWon || 0) + 1;
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
  }

  getTimeUntilNextDaily(): string {
    const now = new Date();
    // Midnight in local time
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const diff = tomorrow.getTime() - now.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  resetProgress() {
    localStorage.removeItem('ostplay_daily_state');
    this.dailyState.set(null);
    this.isDailyCompleted.set(false);
  }
}
