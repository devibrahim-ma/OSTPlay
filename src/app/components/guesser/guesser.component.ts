import { Component, EventEmitter, Input, Output, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-guesser',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './guesser.component.html',
  styleUrl: './guesser.component.css'
})
export class GuesserComponent {
  @Input() autocompleteOptions: string[] = [];
  @Output() guessSubmitted = new EventEmitter<string>();

  guessValue = '';
  filteredOptions: string[] = [];
  showSuggestions = false;
  activeSuggestionIndex = -1;

  constructor(private elementRef: ElementRef) {}

  onInputChange() {
    const value = this.guessValue.toLowerCase().trim();
    if (!value) {
      this.filteredOptions = [];
      this.showSuggestions = false;
      return;
    }

    // Fuzzy filtering: match contains subtitle or matches words
    this.filteredOptions = this.autocompleteOptions
      .filter(option => option.toLowerCase().includes(value))
      .slice(0, 8); // Limit to 8 suggestions for layout space

    this.showSuggestions = true;
    this.activeSuggestionIndex = -1;
  }

  onInputFocus() {
    if (this.guessValue.trim()) {
      this.showSuggestions = true;
    }
  }

  selectOption(option: string) {
    this.guessValue = option;
    this.showSuggestions = false;
    this.activeSuggestionIndex = -1;
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.showSuggestions || this.filteredOptions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeSuggestionIndex = (this.activeSuggestionIndex + 1) % this.filteredOptions.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeSuggestionIndex = (this.activeSuggestionIndex - 1 + this.filteredOptions.length) % this.filteredOptions.length;
    } else if (event.key === 'Enter') {
      if (this.activeSuggestionIndex >= 0 && this.activeSuggestionIndex < this.filteredOptions.length) {
        event.preventDefault();
        this.selectOption(this.filteredOptions[this.activeSuggestionIndex]);
      }
    } else if (event.key === 'Escape') {
      this.showSuggestions = false;
    }
  }

  onSubmit() {
    const value = this.guessValue.trim();
    if (value) {
      this.guessSubmitted.emit(value);
      this.guessValue = '';
      this.showSuggestions = false;
    }
  }

  // Close suggestions card when clicking outside this component
  @HostListener('document:click', ['$event'])
  clickOutside(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showSuggestions = false;
    }
  }
}
