import { TestBed } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';
import * as d3 from 'd3';
import { TooltipService, Context } from './tooltip.service';
import { InitializeService, SelectionContext } from './initialize.service';
import { InternalTrace } from '../trace';
import { Feature, featureIdentity } from '../features/feature';
import { Locus } from '../features/locus';

describe('TooltipService', () => {
  let service: TooltipService;
  let initService: InitializeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TooltipService, InitializeService]
    });
    service = TestBed.inject(TooltipService);
    initService = TestBed.inject(InitializeService);

    // Mock tooltip element
    const tooltipDiv = document.createElement('div');
    service.tooltip = tooltipDiv;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('onMouseEnter with featureIdentity', () => {
    it('should include stable featureId in emitted tooltip context', (done) => {
      const feature: Locus = { type: 'locus', start: 5, end: 15 };
      const trace: InternalTrace = {
        id: 0,
        features: [feature],
        show: true,
        expanded: false,
        level: 0,
        domain: { min: 0, max: 10 }
      };

      const expectedFid = featureIdentity(feature);

      service.tooltip$.subscribe((ctx: Context | null) => {
        if (ctx) {
          expect(ctx.feature).toBe(feature);
          expect(ctx.featureId).toBe(expectedFid);
          expect(ctx.trace).toBe(trace);
          done();
        }
      });

      const mockEvent = new MouseEvent('mouseenter', { clientX: 100, clientY: 100 });
      spyOn(initService, 'getCoordinates').and.returnValue([5, 0]);

      service.onMouseEnter(mockEvent, trace, feature, 0);
    });
  });

  describe('bindFeatureEvents under feature and trace shuffling', () => {
    it('should correctly reference features and parent trace even when features array is shuffled', (done) => {
      const f1: Locus = { type: 'locus', start: 1, end: 10, label: 'F1' };
      const f2: Locus = { type: 'locus', start: 20, end: 30, label: 'F2' };
      const f3: Locus = { type: 'locus', start: 40, end: 50, label: 'F3' };

      const trace: InternalTrace = {
        id: 42,
        features: [f1, f2, f3],
        show: true,
        expanded: false,
        level: 0,
        domain: { min: 0, max: 10 }
      };

      // Set up DOM structure: SVG -> g.trace -> g.feature elements
      const svg = d3.select(document.createElement('div')).append('svg');
      const traceG = svg.append('g').attr('class', 'trace').datum(trace);

      const featureSelection = traceG
        .selectAll<SVGGElement, Feature>('g.feature')
        .data(trace.features, featureIdentity)
        .enter()
        .append('g')
        .attr('class', 'feature');

      const selectionEmitter$ = new EventEmitter<SelectionContext | undefined>();
      service.bindFeatureEvents(featureSelection, trace, selectionEmitter$);

      // Now simulate shuffling trace.features
      trace.features = [f3, f1, f2];

      spyOn(initService, 'getCoordinates').and.returnValue([25, 0]);

      // Trigger mouseenter on the second DOM element (which corresponds to f2)
      const nodes = featureSelection.nodes();
      const nodeForF2 = nodes[1];

      service.tooltip$.subscribe((ctx: Context | null) => {
        if (ctx) {
          expect(ctx.feature).toBe(f2);
          expect(ctx.featureId).toBe(featureIdentity(f2));
          expect(ctx.trace.id).toBe(42);
          // Index should be correctly resolved in the shuffled array (f2 is at index 2 in shuffled array)
          expect(ctx.index).toBe(2);
          done();
        }
      });

      nodeForF2.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    });
  });
});
