import { TestBed } from '@angular/core/testing';
import { SequenceRenderer } from './sequence.renderer';
import { InitializeService } from '../initialize.service';
import * as d3 from 'd3';

describe('SequenceRenderer', () => {
  let renderer: SequenceRenderer;
  let initializeService: InitializeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SequenceRenderer,
        InitializeService
      ]
    });
    renderer = TestBed.inject(SequenceRenderer);
    initializeService = TestBed.inject(InitializeService);
  });

  it('should be created', () => {
    expect(renderer).toBeTruthy();
  });

  it('should mock draw and calculate char width', () => {
    // Mock the DOM elements needed
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const drawGroup = d3.select(svg).append('g');
    initializeService.draw = drawGroup as any;
    initializeService.settings = { 'x-axis-show': true, 'margin-bottom': 0 } as any;

    renderer.calculateCharWidth();

    expect(renderer.sequenceCharWidth).toBeDefined();
    expect(renderer.featureLabelCharWidth).toBeDefined();
    expect(initializeService.settings['margin-bottom']).toBeDefined();
  });
});
