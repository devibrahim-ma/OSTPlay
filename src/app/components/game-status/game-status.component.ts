import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovieHints } from '../../types/ost-level.model';
import { GameStateService } from '../../core/game-state.service';

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

  openLightbox() {
    this.gameStateService.activeLightboxImg.set(this.resolvedFrameUrl);
  }
}
