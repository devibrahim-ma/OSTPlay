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
import { DailyStatusComponent } from './components/daily-status/daily-status.component';
import { SurvivalStatsComponent } from './components/survival-stats/survival-stats.component';
import { TranslationService } from './core/i18n/translation.service';
import { AuthService } from './core/auth.service';
import { LoginComponent } from './components/login/login.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';

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
    ResetConfirmModalComponent,
    DailyStatusComponent,
    SurvivalStatsComponent,
    LoginComponent,
    ProfileComponent,
    AdminPanelComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {
  readonly gameStateService = inject(GameStateService);
  readonly translationService = inject(TranslationService);
  readonly authService = inject(AuthService);

  constructor() {
    document.addEventListener('backbutton', (e) => {
      const view = this.gameStateService.currentView();
      if (view !== 'modes') {
        e.preventDefault();
        this.handleHardwareBack();
      }
    }, false);
  }

  handleHardwareBack() {
    const view = this.gameStateService.currentView();
    if (view === 'game') {
      const mode = this.gameStateService.currentGameMode();
      if (mode === 'movies' || mode === 'series' || mode === 'anime') {
        this.gameStateService.currentView.set('grid');
      } else {
        this.gameStateService.currentView.set('modes');
      }
    } else if (view === 'grid' || view === 'profile') {
      this.gameStateService.currentView.set('modes');
    }
  }

  t(key: string): string {
    return this.translationService.t(key);
  }

  // Expose levels list and statuses
  readonly levels = this.gameStateService.levels;
  readonly levelStatuses = this.gameStateService.levelStatuses;

  // Active game states
  readonly currentLevelIndex = this.gameStateService.currentLevelIndex;
  readonly currentLevel = this.gameStateService.translatedLevel;
  readonly currentAttempt = this.gameStateService.currentAttempt;
  readonly gameState = this.gameStateService.gameState;
  readonly guessHistory = this.gameStateService.guessHistory;
  readonly allTitles = this.gameStateService.displayTitles;

  // Navigation state
  readonly currentView = this.gameStateService.currentView;
  readonly currentGameMode = this.gameStateService.currentGameMode;

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

  nextLevel() {
    this.gameStateService.nextLevel();
  }

  onGuessSubmitted(guess: string) {
    this.gameStateService.submitGuess(guess);
  }

  closeLightbox() {
    this.gameStateService.activeLightboxImg.set(null);
  }
}
