import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovieHints } from '../../types/ost-level.model';
import { GameStateService } from '../../core/game-state.service';
import { TranslationService } from '../../core/i18n/translation.service';

@Component({
  selector: 'app-game-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-status.component.html',
  styleUrl: './game-status.component.css'
})
export class GameStatusComponent {
  @Input() currentAttempt = 1;
  @Input() hints!: MovieHints;
  @Input() resolvedFrameUrl = '';
  @Input() guessHistory: string[] = [];
  @Input() isAnime = false;

  private readonly gameStateService = inject(GameStateService);
  readonly translationService = inject(TranslationService);

  t(key: string): string {
    return this.translationService.t(key);
  }

  getTruncatedPlot(plot: string): string {
    if (!plot) return '';
    let firstParagraph = plot.split('\n')[0].trim();
    if (firstParagraph.length > 180) {
      const sub = firstParagraph.slice(0, 180);
      const lastPeriod = sub.lastIndexOf('.');
      if (lastPeriod > 100) {
        firstParagraph = firstParagraph.slice(0, lastPeriod + 1);
      } else {
        firstParagraph = sub.trim() + '...';
      }
    }
    return firstParagraph;
  }

  openLightbox() {
    this.gameStateService.activeLightboxImg.set(this.resolvedFrameUrl);
  }
}
