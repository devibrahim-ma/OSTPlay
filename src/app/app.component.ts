import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from './core/game-state.service';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HomeComponent } from './components/home/home.component';
import { LevelsGridComponent } from './components/levels-grid/levels-grid.component';
import { PlayerComponent } from './components/player/player.component';
import { GuesserComponent } from './components/guesser/guesser.component';
import { GameStatusComponent } from './components/game-status/game-status.component';
import { ResetConfirmModalComponent } from './components/reset-confirm-modal/reset-confirm-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    HomeComponent,
    LevelsGridComponent,
    PlayerComponent,
    GuesserComponent,
    GameStatusComponent,
    ResetConfirmModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {
  readonly gameStateService = inject(GameStateService);

  // Expose levels list and statuses
  readonly levels = this.gameStateService.levels;
  readonly levelStatuses = this.gameStateService.levelStatuses;

  // Active game states
  readonly currentLevelIndex = this.gameStateService.currentLevelIndex;
  readonly currentLevel = this.gameStateService.currentLevel;
  readonly currentAttempt = this.gameStateService.currentAttempt;
  readonly gameState = this.gameStateService.gameState;
  readonly guessHistory = this.gameStateService.guessHistory;
  readonly allTitles = this.gameStateService.allTitles;

  // Navigation state
  readonly currentView = this.gameStateService.currentView;

  // Global settings & features
  readonly activeLightboxImg = this.gameStateService.activeLightboxImg;

  // Dynamic API resolved elements
  readonly resolvedAudioUrl = this.gameStateService.resolvedAudioUrl;
  readonly resolvedFrameUrl = this.gameStateService.resolvedFrameUrl;
  readonly isLoadingMedia = this.gameStateService.isLoadingMedia;
  readonly tmdbApiKey = this.gameStateService.tmdbApiKey;

  readonly currentCategory = this.gameStateService.currentCategory;
  readonly isLoadingLevels = this.gameStateService.isLoadingLevels;

  selectLevel(index: number) {
    this.gameStateService.selectLevel(index);
  }

  backToGrid() {
    this.gameStateService.backToGrid();
  }

  onGuessSubmitted(guess: string) {
    this.gameStateService.submitGuess(guess);
  }

  closeLightbox() {
    this.gameStateService.activeLightboxImg.set(null);
  }
}
