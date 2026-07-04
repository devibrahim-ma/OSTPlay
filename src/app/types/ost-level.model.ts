export interface MovieHints {
  actors: string;
  director: string;
  frameUrl: string; // Image URL of a movie frame (e.g. from Wikimedia or generated image path)
  plot: string;     // Short summary/plot clue of the movie
}

export interface OSTLevel {
  levelId: string;
  category?: 'movies' | 'series';
  title: string;          // Correct name of the movie
  audioUrl: string;       // URL to public mp3
  correctAnswers: string[]; // Variations (e.g. ["Titanic", "El Titanic"])
  hints: MovieHints;      // Structured clues revealed on failures
}

export type LevelStatus = 'neutral' | 'won' | 'lost';

export interface GameState {
  currentLevelIndex: number | null; // null if on the selection grid
  currentAttempt: number;           // 1 to 5
  gameState: 'playing' | 'won' | 'lost';
  guessHistory: string[];
}
