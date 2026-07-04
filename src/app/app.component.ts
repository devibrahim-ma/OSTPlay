import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from './core/game-state.service';
import { PlayerComponent } from './components/player/player.component';
import { GuesserComponent } from './components/guesser/guesser.component';
import { GameStatusComponent } from './components/game-status/game-status.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PlayerComponent, GuesserComponent, GameStatusComponent],
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

  // Dynamic API resolved elements
  readonly resolvedAudioUrl = this.gameStateService.resolvedAudioUrl;
  readonly resolvedFrameUrl = this.gameStateService.resolvedFrameUrl;
  readonly isLoadingMedia = this.gameStateService.isLoadingMedia;
  readonly tmdbApiKey = this.gameStateService.tmdbApiKey;

  readonly currentCategory = this.gameStateService.currentCategory;
  readonly isLoadingLevels = this.gameStateService.isLoadingLevels;

  get levelsCount(): number {
    return this.levels().length;
  }

  selectLevel(index: number) {
    this.gameStateService.selectLevel(index);
  }

  setCategory(category: 'movies' | 'series') {
    this.gameStateService.setCategory(category);
  }

  backToGrid() {
    this.gameStateService.backToGrid();
  }

  onGuessSubmitted(guess: string) {
    this.gameStateService.submitGuess(guess);
  }

  resetGame() {
    this.gameStateService.resetAllGame();
  }
}
