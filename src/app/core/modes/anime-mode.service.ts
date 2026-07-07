import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AnimeModeService {
  // Survival streak indicators
  readonly animeStreak = signal<number>(0);
  readonly maxAnimeStreak = signal<number>(0);

  constructor() {
    this.loadStats();
  }

  private loadStats() {
    const savedStreak = localStorage.getItem('ostplay_anime_streak');
    if (savedStreak) {
      this.animeStreak.set(Number(savedStreak));
    }
    const savedMax = localStorage.getItem('ostplay_max_anime_streak');
    if (savedMax) {
      this.maxAnimeStreak.set(Number(savedMax));
    }
  }

  // Called when a level is won
  onLevelWon(stats: any): any {
    const current = this.animeStreak() + 1;
    this.animeStreak.set(current);
    
    if (current > this.maxAnimeStreak()) {
      this.maxAnimeStreak.set(current);
      localStorage.setItem('ostplay_max_anime_streak', String(current));
    }
    localStorage.setItem('ostplay_anime_streak', String(current));

    // Also update overall stats
    const updated = { ...stats };
    updated.animePlayed = (updated.animePlayed || 0) + 1;
    updated.animeWon = (updated.animeWon || 0) + 1;
    
    // Also feed the general streak for fun
    updated.streak += 1;
    if (updated.streak > updated.maxStreak) {
      updated.maxStreak = updated.streak;
    }
    
    localStorage.setItem('ostplay_stats', JSON.stringify(updated));
    return updated;
  }

  // Called when a level is lost
  onLevelLost(stats: any): any {
    this.animeStreak.set(0);
    localStorage.setItem('ostplay_anime_streak', '0');

    // Update overall stats
    const updated = { ...stats };
    updated.animePlayed = (updated.animePlayed || 0) + 1;
    updated.streak = 0; // Reset general streak too
    
    localStorage.setItem('ostplay_stats', JSON.stringify(updated));
    return updated;
  }

  // Calculation for the next index in the anime category levels list
  getNextLevelIndex(currentIndex: number, totalLevels: number): number | null {
    if (currentIndex >= 0 && currentIndex + 1 < totalLevels) {
      return currentIndex + 1;
    }
    return null;
  }

  resetProgress() {
    this.animeStreak.set(0);
    this.maxAnimeStreak.set(0);
    localStorage.removeItem('ostplay_anime_streak');
    localStorage.removeItem('ostplay_max_anime_streak');
  }
}
