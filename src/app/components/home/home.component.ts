import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/game-state.service';
import { TranslationService } from '../../core/i18n/translation.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  readonly gameStateService = inject(GameStateService);
  readonly translationService = inject(TranslationService);
  isWeb = true;

  constructor() {
    this.isWeb = !(window as any).Capacitor?.isNative;
  }

  t(key: string): string {
    return this.translationService.t(key);
  }

  setGameMode(mode: 'movies' | 'series' | 'anime' | 'random' | 'daily') {
    this.gameStateService.setGameMode(mode);
  }
}
