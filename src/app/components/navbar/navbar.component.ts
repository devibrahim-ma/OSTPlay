import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/game-state.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  host: {
    'class': 'fixed top-0 left-0 right-0 z-50 w-full block'
  }
})
export class NavbarComponent {
  readonly gameStateService = inject(GameStateService);

  readonly currentView = this.gameStateService.currentView;
  readonly completedPercentage = this.gameStateService.completedPercentage;
  readonly stats = this.gameStateService.stats;

  showStatsDropdown = false;

  backToGrid() {
    this.gameStateService.backToGrid();
  }

  goToModes() {
    this.gameStateService.goToModes();
    this.showStatsDropdown = false;
  }

  toggleStatsDropdown() {
    this.showStatsDropdown = !this.showStatsDropdown;
  }

  closeStatsDropdown() {
    this.showStatsDropdown = false;
  }

  triggerResetConfirm() {
    this.gameStateService.showResetConfirm.set(true);
    this.showStatsDropdown = false;
  }
}
