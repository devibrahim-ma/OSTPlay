import { Injectable, signal } from '@angular/core';
import { OSTLevel } from '../../types/ost-level.model';

@Injectable({
  providedIn: 'root'
})
export class RandomModeService {
  readonly randomStreak = signal<number>(0);
  readonly maxRandomStreak = signal<number>(0);

  private lastLevelId: string | null = null;

  constructor() {
    this.loadStats();
  }

  private loadStats() {
    const savedStreak = localStorage.getItem('ostplay_random_streak');
    if (savedStreak) {
      this.randomStreak.set(Number(savedStreak));
    }
    const savedMax = localStorage.getItem('ostplay_max_random_streak');
    if (savedMax) {
      this.maxRandomStreak.set(Number(savedMax));
    }
  }

  getRandomLevel(allLevels: OSTLevel[]): OSTLevel | null {
    if (allLevels.length === 0) return null;
    if (allLevels.length === 1) return allLevels[0];
    
    let candidate: OSTLevel;
    let attempts = 0;
    
    // Attempt to pick a level that is not the same as the last one
    do {
      const idx = Math.floor(Math.random() * allLevels.length);
      candidate = allLevels[idx];
      attempts++;
    } while (candidate.levelId === this.lastLevelId && attempts < 10);
    
    this.lastLevelId = candidate.levelId;
    return candidate;
  }

  onLevelWon(stats: any): any {
    const current = this.randomStreak() + 1;
    this.randomStreak.set(current);
    
    if (current > this.maxRandomStreak()) {
      this.maxRandomStreak.set(current);
      localStorage.setItem('ostplay_max_random_streak', String(current));
    }
    localStorage.setItem('ostplay_random_streak', String(current));

    // Also update overall stats
    const updated = { ...stats };
    updated.streak += 1;
    if (updated.streak > updated.maxStreak) {
      updated.maxStreak = updated.streak;
    }
    
    localStorage.setItem('ostplay_stats', JSON.stringify(updated));
    return updated;
  }

  onLevelLost(stats: any): any {
    this.randomStreak.set(0);
    localStorage.setItem('ostplay_random_streak', '0');

    // Update overall stats
    const updated = { ...stats };
    updated.streak = 0;
    
    localStorage.setItem('ostplay_stats', JSON.stringify(updated));
    return updated;
  }

  resetProgress() {
    this.randomStreak.set(0);
    this.maxRandomStreak.set(0);
    localStorage.removeItem('ostplay_random_streak');
    localStorage.removeItem('ostplay_max_random_streak');
  }
}
