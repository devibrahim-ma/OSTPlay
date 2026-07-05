import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/game-state.service';

@Component({
  selector: 'app-reset-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reset-confirm-modal.component.html',
  styleUrl: './reset-confirm-modal.component.css'
})
export class ResetConfirmModalComponent {
  readonly gameStateService = inject(GameStateService);

  readonly showResetConfirm = this.gameStateService.showResetConfirm;

  confirmReset() {
    this.gameStateService.resetAllGame();
    this.gameStateService.showResetConfirm.set(false);
  }

  cancelReset() {
    this.gameStateService.showResetConfirm.set(false);
  }
}
