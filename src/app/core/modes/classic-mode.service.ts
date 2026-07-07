import { Injectable, signal } from '@angular/core';
import { OSTLevel, LevelStatus } from '../../types/ost-level.model';

@Injectable({
  providedIn: 'root'
})
export class ClassicModeService {
  // Classic mode active category
  readonly currentCategory = signal<'movies' | 'series'>('movies');

  // Next level calculation for classic modes
  getNextLevelIndex(currentIndex: number, totalLevels: number): number | null {
    if (currentIndex >= 0 && currentIndex + 1 < totalLevels) {
      return currentIndex + 1;
    }
    return null;
  }

  // Update stats for classic modes
  updateClassicStats(
    stats: any,
    category: 'movies' | 'series',
    isWin: boolean,
    attempt: number
  ): any {
    const updated = { ...stats };
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
  }
}
