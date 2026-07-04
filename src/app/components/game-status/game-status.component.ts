import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovieHints } from '../../types/ost-level.model';

@Component({
  selector: 'app-game-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-5">
      <!-- Attempt counter indicators (5 lights) -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <span class="block text-3xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Intentos Utilizados (Máx 5)
        </span>
        <div class="flex items-center gap-3">
          <div 
            *ngFor="let attemptNum of [1, 2, 3, 4, 5]" 
            [class.bg-red-500]="attemptNum < currentAttempt"
            [class.bg-amber-500]="attemptNum === currentAttempt"
            [class.bg-slate-950]="attemptNum > currentAttempt"
            [class.border-red-500]="attemptNum < currentAttempt"
            [class.border-amber-500]="attemptNum === currentAttempt"
            [class.border-slate-800]="attemptNum > currentAttempt"
            [class.shadow-[0_0_8px_rgba(245,158,11,0.3)]]="attemptNum === currentAttempt"
            class="flex-1 h-6 rounded-md border text-center flex items-center justify-center font-mono text-2xs font-extrabold transition-all duration-300">
            <span [class.text-slate-950]="attemptNum === currentAttempt" [class.text-white]="attemptNum !== currentAttempt">
              {{ attemptNum }}
            </span>
          </div>
        </div>
      </div>

      <!-- Progressive Hints list -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div class="flex justify-between items-center">
          <span class="block text-xs font-bold text-amber-500 uppercase tracking-widest">
            Pistas Desbloqueadas
          </span>
          <span class="text-3xs text-slate-500">Un bloqueo por cada fallo</span>
        </div>

        <div *ngIf="currentAttempt === 1" class="text-slate-500 text-xs py-6 italic text-center bg-slate-950/40 rounded-xl border border-slate-950">
          Las pistas aparecerán aquí cuando cometas algún fallo.
        </div>

        <div class="space-y-3">
          <!-- Clue 1: Actors (Unlocked at Attempt 2+) -->
          <div 
            *ngIf="currentAttempt >= 2"
            class="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-1.5 relative overflow-hidden transition-all duration-500">
            <span class="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></span>
            <span class="text-4xs text-amber-500 uppercase tracking-widest font-black">Pista #1: Reparto de Actores</span>
            <p class="text-xs text-slate-300 font-semibold mt-0.5 leading-relaxed">{{ hints.actors }}</p>
          </div>

          <!-- Clue 2: Director (Unlocked at Attempt 3+) -->
          <div 
            *ngIf="currentAttempt >= 3"
            class="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-1.5 relative overflow-hidden transition-all duration-500">
            <span class="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></span>
            <span class="text-4xs text-amber-500 uppercase tracking-widest font-black">Pista #2: Director de la Película</span>
            <p class="text-xs text-slate-300 font-semibold mt-0.5 leading-relaxed">{{ hints.director }}</p>
          </div>

          <!-- Clue 3: Plot (Unlocked at Attempt 4+) -->
          <div 
            *ngIf="currentAttempt >= 4"
            class="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-1.5 relative overflow-hidden transition-all duration-500">
            <span class="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></span>
            <span class="text-4xs text-amber-500 uppercase tracking-widest font-black">Pista #3: Sinopsis / Trama</span>
            <p class="text-xs text-slate-300 leading-relaxed font-normal mt-0.5">{{ hints.plot }}</p>
          </div>

          <!-- Clue 4: Image Frame (Unlocked at Attempt 5) -->
          <div 
            *ngIf="currentAttempt >= 5"
            class="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden transition-all duration-500">
            <span class="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></span>
            <span class="text-4xs text-amber-500 uppercase tracking-widest font-black">Pista #4: Fotograma del Film</span>
            <div class="w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-900 max-h-36">
              <img 
                [src]="resolvedFrameUrl" 
                alt="Movie Frame Hint"
                class="w-full h-full object-cover transition duration-300 hover:scale-105" />
            </div>
          </div>
        </div>
      </div>

      <!-- History of Wrong Guesses -->
      <div *ngIf="guessHistory.length > 0" class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <span class="block text-3xs text-slate-500 uppercase tracking-wider">
          Tus respuestas erróneas
        </span>
        <div class="flex flex-wrap gap-2">
          <span 
            *ngFor="let guess of guessHistory"
            class="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-2xs rounded-lg font-medium flex items-center gap-1 shadow-sm font-mono">
            <span class="w-1 h-1 rounded-full bg-red-500"></span>
            {{ guess }}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class GameStatusComponent {
  @Input() currentAttempt = 1;
  @Input() hints!: MovieHints;
  @Input() resolvedFrameUrl = '';
  @Input() guessHistory: string[] = [];
}
