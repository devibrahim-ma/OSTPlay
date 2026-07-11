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

  showLangDropdown = false;

  toggleLangDropdown(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showLangDropdown = !this.showLangDropdown;
  }

  selectLanguage(lang: 'es' | 'en') {
    this.setLanguage(lang);
    this.showLangDropdown = false;
  }

  goBack() {
    const view = this.currentView();
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

  goToModes() {
    this.gameStateService.goToModes();
  }

  goToProfile() {
    this.gameStateService.currentView.set('profile');
    this.showLangDropdown = false;
  }

  triggerResetConfirm() {
    this.gameStateService.showResetConfirm.set(true);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showLangDropdown = false;
    }
  }
}
