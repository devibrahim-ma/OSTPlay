import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/game-state.service';
import { TranslationService } from '../../core/i18n/translation.service';

@Component({
  selector: 'app-survival-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './survival-stats.component.html',
  styleUrl: './survival-stats.component.css'
})
export class SurvivalStatsComponent {
  private readonly gameStateService = inject(GameStateService);
  readonly translationService = inject(TranslationService);

  t(key: string): string {
    return this.translationService.t(key);
  }

  readonly mode = this.gameStateService.currentGameMode;

  get currentStreak(): number {
    const activeMode = this.mode();
    if (activeMode === 'anime') {
      return this.gameStateService.animeModeService.animeStreak();
    } else if (activeMode === 'random') {
      return this.gameStateService.randomModeService.randomStreak();
    }
    return 0;
  }

  get maxStreak(): number {
    const activeMode = this.mode();
    if (activeMode === 'anime') {
      return this.gameStateService.animeModeService.maxAnimeStreak();
    } else if (activeMode === 'random') {
      return this.gameStateService.randomModeService.maxRandomStreak();
    }
    return 0;
  }
}
