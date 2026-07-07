import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/game-state.service';
import { TranslationService } from '../../core/i18n/translation.service';

@Component({
  selector: 'app-daily-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './daily-status.component.html',
  styleUrl: './daily-status.component.css'
})
export class DailyStatusComponent implements OnInit, OnDestroy {
  readonly gameStateService = inject(GameStateService);
  readonly dailyModeService = this.gameStateService.dailyModeService;
  readonly translationService = inject(TranslationService);

  t(key: string): string {
    return this.translationService.t(key);
  }

  readonly timeLeft = signal<string>('00:00:00');
  private timerInterval: any;

  readonly dailyState = this.dailyModeService.dailyState;
  
  readonly dailyLevel = computed(() => {
    return this.dailyModeService.getDailyLevel(this.gameStateService.allLevels());
  });

  readonly resolvedFrameUrl = computed(() => {
    const level = this.dailyLevel();
    return level?.hints?.frameUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=780';
  });

  ngOnInit() {
    this.updateTimer();
    this.timerInterval = setInterval(() => {
      this.updateTimer();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private updateTimer() {
    this.timeLeft.set(this.dailyModeService.getTimeUntilNextDaily());
  }

  backToModes() {
    this.gameStateService.goToModes();
  }
}
