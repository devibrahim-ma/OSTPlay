import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/game-state.service';

@Component({
  selector: 'app-levels-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './levels-grid.component.html',
  styleUrl: './levels-grid.component.css'
})
export class LevelsGridComponent {
  readonly gameStateService = inject(GameStateService);

  readonly levels = this.gameStateService.levels;
  readonly levelStatuses = this.gameStateService.levelStatuses;
  readonly isLoadingLevels = this.gameStateService.isLoadingLevels;

  selectLevel(index: number) {
    this.gameStateService.selectLevel(index);
  }
}
