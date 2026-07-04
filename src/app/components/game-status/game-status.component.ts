import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovieHints } from '../../types/ost-level.model';

@Component({
  selector: 'app-game-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-status.component.html',
  styleUrl: './game-status.component.css'
})
export class GameStatusComponent {
  @Input() currentAttempt = 1;
  @Input() hints!: MovieHints;
  @Input() resolvedFrameUrl = '';
  @Input() guessHistory: string[] = [];
}
