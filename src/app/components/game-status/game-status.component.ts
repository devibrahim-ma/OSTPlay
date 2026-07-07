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

  private readonly gameStateService = inject(GameStateService);
  readonly translationService = inject(TranslationService);

  t(key: string): string {
    return this.translationService.t(key);
  }

  openLightbox() {
    this.gameStateService.activeLightboxImg.set(this.resolvedFrameUrl);
  }
}
