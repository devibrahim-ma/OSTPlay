import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-guesser',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      <!-- Glow effect -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.08),transparent_60%)] pointer-events-none"></div>

      <form (ngSubmit)="onSubmit()" class="relative z-10 space-y-4">
        <div>
          <label for="guess-input" class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Escribe tu respuesta
          </label>
          
          <div class="relative">
            <!-- Text Input with Autocomplete Datalist -->
            <input 
              id="guess-input"
              type="text" 
              name="userGuess"
              [(ngModel)]="guessValue"
              placeholder="¿Qué banda sonora es? Ej: SoundHelix..."
              list="ost-titles"
              autocomplete="off"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/25 transition duration-200" />
            
            <!-- Native Datalist for autocomplete -->
            <datalist id="ost-titles">
              <option *ngFor="let option of autocompleteOptions" [value]="option"></option>
            </datalist>
          </div>
        </div>

        <!-- Submit Guess Button -->
        <button 
          type="submit"
          [disabled]="!guessValue.trim()"
          class="w-full py-3 px-6 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-slate-950 font-extrabold rounded-xl shadow-lg hover:shadow-teal-500/10 transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 group">
          <span>Enviar Intento</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </form>
    </div>
  `,
  styles: []
})
export class GuesserComponent {
  @Input() autocompleteOptions: string[] = [];
  @Output() guessSubmitted = new EventEmitter<string>();

  guessValue = '';

  onSubmit() {
    const value = this.guessValue.trim();
    if (value) {
      this.guessSubmitted.emit(value);
      this.guessValue = '';
    }
  }
}
