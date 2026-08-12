import { TestBed } from '@angular/core/testing';
import { GridRenderer } from './grid.renderer';
import { InitializeService } from '../initialize.service';
import * as d3 from 'd3';

describe('GridRenderer', () => {
  let renderer: GridRenderer;
  let initializeService: InitializeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GridRenderer,
        InitializeService
      ]
    });
    renderer = TestBed.inject(GridRenderer);
    initializeService = TestBed.inject(InitializeService);
  });

  it('should be created', () => {
    expect(renderer).toBeTruthy();
  });

  it('should construct grid cleanly', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const focusGroup = d3.select(svg).append('g');
    initializeService.focus = focusGroup as any;

    const traces: any = [];
    renderer.createGrid(traces);

    expect(renderer['group.grid']).toBeDefined();
  });
});
