import { Component, inject, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/game-state.service';
import { TranslationService } from '../../core/i18n/translation.service';
import { AuthService } from '../../core/auth.service';

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
  readonly translationService = inject(TranslationService);
  readonly authService = inject(AuthService);
  private readonly elementRef = inject(ElementRef);

  showLogoutConfirm = false;

  triggerLogoutConfirm() {
    this.showLogoutConfirm = true;
    this.showStatsDropdown = false;
  }

  confirmLogout() {
    this.authService.logout();
    this.showLogoutConfirm = false;
  }

  cancelLogout() {
    this.showLogoutConfirm = false;
  }

  readonly currentLang = this.translationService.currentLang;
  t(key: string): string {
    return this.translationService.t(key);
  }

  setLanguage(lang: 'es' | 'en') {
    this.translationService.setLanguage(lang);
  }

  readonly currentView = this.gameStateService.currentView;
  readonly completedPercentage = this.gameStateService.completedPercentage;
  readonly stats = this.gameStateService.stats;

  readonly animeStreak = this.gameStateService.animeModeService.animeStreak;
  readonly maxAnimeStreak = this.gameStateService.animeModeService.maxAnimeStreak;
  readonly randomStreak = this.gameStateService.randomModeService.randomStreak;
  readonly maxRandomStreak = this.gameStateService.randomModeService.maxRandomStreak;

  showStatsDropdown = false;
  showLangDropdown = false;

  toggleLangDropdown(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showLangDropdown = !this.showLangDropdown;
    if (this.showLangDropdown) {
      this.showStatsDropdown = false;
    }
  }

  selectLanguage(lang: 'es' | 'en') {
    this.setLanguage(lang);
    this.showLangDropdown = false;
  }

  backToGrid() {
    this.gameStateService.backToGrid();
  }

  goToModes() {
    this.gameStateService.goToModes();
    this.showStatsDropdown = false;
  }

  toggleStatsDropdown(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showStatsDropdown = !this.showStatsDropdown;
    if (this.showStatsDropdown) {
      this.showLangDropdown = false;
    }
  }

  closeStatsDropdown() {
    this.showStatsDropdown = false;
  }

  triggerResetConfirm() {
    this.gameStateService.showResetConfirm.set(true);
    this.showStatsDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showLangDropdown = false;
      this.showStatsDropdown = false;
    }
  }
}
