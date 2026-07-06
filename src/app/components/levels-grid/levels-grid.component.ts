import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/game-state.service';

@Component({
  selector: 'app-levels-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './levels-grid.component.html',
  styleUrl: './levels-grid.component.css'
})
export class LevelsGridComponent {
  readonly gameStateService = inject(GameStateService);

  readonly levels = this.gameStateService.levels;
  readonly levelStatuses = this.gameStateService.levelStatuses;
  readonly isLoadingLevels = this.gameStateService.isLoadingLevels;

  readonly pageSize = 50;
  readonly currentPage = signal<number>(0);

  readonly totalPages = computed(() => {
    return Math.ceil(this.levels().length / this.pageSize);
  });

  readonly pageIndices = computed(() => {
    const pages = [];
    const count = this.totalPages();
    for (let i = 0; i < count; i++) {
      pages.push(i);
    }
    return pages;
  });

  readonly currentPageChecked = computed(() => {
    const page = this.currentPage();
    const maxPage = Math.max(0, this.totalPages() - 1);
    return page > maxPage ? maxPage : page;
  });

  readonly paginatedLevels = computed(() => {
    const all = this.levels();
    const page = this.currentPageChecked();
    const start = page * this.pageSize;
    const end = start + this.pageSize;
    return all.slice(start, end);
  });

  selectLevel(index: number) {
    this.gameStateService.selectLevel(index);
  }

  setPage(pageIndex: number) {
    this.currentPage.set(pageIndex);
  }

  getPageLabel(pageIndex: number): string {
    const start = pageIndex * this.pageSize + 1;
    const end = Math.min((pageIndex + 1) * this.pageSize, this.levels().length);
    return `${start}-${end}`;
  }
}
