import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/game-state.service';
import { AuthService } from '../../core/auth.service';
import { TranslationService } from '../../core/i18n/translation.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  readonly gameStateService = inject(GameStateService);
  readonly authService = inject(AuthService);
  readonly translationService = inject(TranslationService);

  showLogoutConfirm = false;
  showAvatarModal = false;
  showAttempts = false;

  t(key: string): string {
    return this.translationService.t(key);
  }

  // Bind signals/stats
  readonly stats = this.gameStateService.stats;
  readonly completedPercentage = this.gameStateService.completedPercentage;
  readonly animeStreak = this.gameStateService.animeModeService.animeStreak;
  readonly maxAnimeStreak = this.gameStateService.animeModeService.maxAnimeStreak;
  readonly randomStreak = this.gameStateService.randomModeService.randomStreak;
  readonly maxRandomStreak = this.gameStateService.randomModeService.maxRandomStreak;

  toggleAvatarModal() {
    this.showAvatarModal = !this.showAvatarModal;
  }

  toggleAttempts() {
    this.showAttempts = !this.showAttempts;
  }

  selectAvatar(avatarId: string) {
    this.authService.updateAvatar(avatarId);
    this.showAvatarModal = false;
  }

  triggerResetConfirm() {
    this.gameStateService.showResetConfirm.set(true);
  }

  triggerLogoutConfirm() {
    this.showLogoutConfirm = true;
  }

  cancelLogout() {
    this.showLogoutConfirm = false;
  }

  confirmLogout() {
    this.authService.logout();
    this.showLogoutConfirm = false;
    this.gameStateService.currentView.set('modes');
  }

  backToHome() {
    this.gameStateService.currentView.set('modes');
  }

  goToAdminPanel() {
    this.gameStateService.currentView.set('admin');
  }
}
