import { EventEmitter, Injectable } from '@angular/core';
import * as d3 from 'd3';
import { BaseType } from 'd3';
import {
    combineLatest,
    map,
    Observable,
    ReplaySubject,
    shareReplay,
    switchMap,
    tap,
    throttleTime,
} from 'rxjs';
import { Feature, featureIdentity } from '../features/feature';
import { Locus } from '../features/locus';
import { DSSP } from '../features/dssp';
import { StrategyFactory } from './strategies/strategy.factory';
import { FeatureRenderOptions } from './strategies/feature-strategy.interface';
import { Sequence, sequenceColors } from '../sequence';
// Data types
import { GridLines, InternalTrace, InternalTraces, LabelGroup, LayoutTrace, SequenceContainer, TraceGroup } from '../trace';
import { FeaturesService } from './features.service';
// Services
import { InitializeService, SelectionContext } from './initialize.service';
import { TooltipService } from './tooltip.service';
import { SequenceRenderer } from './renderers/sequence.renderer';
import { GridRenderer } from './renderers/grid.renderer';



// Get size of 1rem in pixel
// https://stackoverflow.com/questions/36532307/rem-px-in-javascript
export const REM = parseFloat(
  getComputedStyle(document.documentElement).fontSize
);

// Define function for extracting identifier out of unknown object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const identity = (f: InternalTrace) => {
  return f.id;
};

// Define function for extracting index out of unknown object
export const index = (f: InternalTraces) => {
  return f.map((t) => t.id).join('-');
};

@Injectable({ providedIn: 'platform' })
export class DrawService {
  private alreadyExitedFromView = new Set<Feature>();

  public readonly traces$ = new ReplaySubject<InternalTraces>(1);

  public readonly sequence$ = new ReplaySubject<Sequence>(1);

  public readonly selectedFeatureEmit$ = new EventEmitter<
    SelectionContext | undefined
  >();

  public readonly selectedFeature$: Observable<SelectionContext | undefined>;

  public 'group.labels'!: LabelGroup;

  public 'group.traces'!: TraceGroup;

  public tooltip!: d3.Selection<HTMLDivElement, unknown, null, unknown>;

  /** Draw features
   *
   * This pipeline initialize features within the drawable area
   * of the main SVG container, defined by the `draw` property.
   */
  public readonly draw$: Observable<InternalTraces>;

  public layoutTraces$!: Observable<LayoutTrace[]>;

  /** Update features
   *
   * This pipeline moves previously initialized features within the
   * drawable area, according to given scale (the one produced
   * after the zoom event took place)
   */
  public readonly drawn$: Observable<unknown>;

  private coilPoints = new Map<string, number[]>();

  constructor(
    private initializeService: InitializeService,
    private featuresService: FeaturesService,
    private tooltipService: TooltipService,
    private sequenceRenderer: SequenceRenderer,
    private gridRenderer: GridRenderer
  ) {
    // Define draw initialization
    this.draw$ = combineLatest([
      this.initializeService.initialized$,
      this.sequence$,
    ]).pipe(
      // Update horizontal scale domain
      tap(([, sequence]) => {
        // Get horizontal scale
        const x = this.initializeService.scale.x;
        // Generate horizontal domain for sequence
        const domain = [0, sequence.length + 1];
        // Update horizontal scale
        x.domain(domain);
      }),
      tap(() => this.sequenceRenderer.calculateCharWidth()),
      // Draw sequence
      map(([, sequence]) => this.sequenceRenderer.createSequence(sequence)),
      // Initialize brush region
      tap(() => this.createBrush()),
      // Initialize tooltip
      tap(() => this.createTooltip()),
      // Cache result
      shareReplay(1),
      // Switch to traces emission
      switchMap((): Observable<InternalTraces> => this.traces$),
      // Update vertical scale
      tap((traces: InternalTraces) => {
        this.updateScale(traces);
        this.gridRenderer.createGrid(traces);
        return;
      }),

      // NOTE This is required to avoid re-drawing everything on each resize/zoom event
      shareReplay(1)
    );
    // Define draw update
    this.drawn$ = combineLatest([
      this.draw$,
      this.initializeService.settings$,
    ]).pipe(
      // Move sequence residues in correct position
      tap(() => this.sequenceRenderer.updateSequence()),
      // Move grid in correct position
      tap(() => this.gridRenderer.updateGrid()),
      // Render traces (creates and updates)
      tap(([traces]) => this.renderTraces(traces)),

      // Move the selection shadow in correct position
      map(() => this.updateShadowPosition())
    );

    this.selectedFeature$ = this.selectedFeatureEmit$.pipe(
      // Debounce the event to avoid multiple updates in a short time
      throttleTime(300),
      tap((selectionContext) => {
        if (selectionContext) {
          this.setSelectionShadow(selectionContext);
        } else {
          this.removeSelectionShadow();
        }
      }),
      shareReplay(1)
    );

    this.layoutTraces$ = combineLatest([
      this.drawn$,
      this.featuresService.tracesNoNesting$,
    ]).pipe(
      map(([, traces]) => {
        const y = this.initializeService.scale.y;
        const settings = this.initializeService.settings;
        const ml = this.initializeService.margin.left;
        const mr = this.initializeService.margin.right;

        return traces.map((trace) => ({
          trace,
          top: y('' + trace.id) || 0,
          widthLeft: ml,
          widthRight: mr,
          height:
            trace.options?.['line-height'] || settings['line-height'] || 0,
        }));
      }),
      shareReplay(1)
    );
  }

  // Update vertical scale
  private updateScale(traces: InternalTraces): void {
    const axis = this.initializeService.axes;
    const scale = this.initializeService.scale;
    const sequence = this.initializeService.sequence;
    const settings = this.initializeService.settings;
    // Update domain
    const domain = ['sequence', ...traces.map(({ id }) => id + '')];
    // Initialize range
    const range = [settings['margin-top']];
    // Set sequence line height
    if (
      (Array.isArray(sequence) || typeof sequence === 'string') &&
      settings['sequence-show'] != false
    ) {
      range.push(settings['margin-top'] + settings['line-height']);
    } else {
      range.push(settings['margin-top']);
    }

    // take the first trace and add its margin-top if defined
    const firstTrace = traces[0];
    const firstTraceMt = firstTrace.options?.['margin-top'] || 0;
    range[1] += firstTraceMt;

    // Calculate range adding the margin-bottom of the previous trace, the line-height of the current trace and the margin-top of the next trace
    for (let i = 1; i < domain.length; i++) {
      const trace = this.featuresService.getTrace(+domain[i]);
      const nextTrace = this.featuresService.getTrace(+domain[i + 1]);

      const prevSpace = range[range.length - 1];
      const traceMb = trace?.options?.['margin-bottom'] || 0;
      const lh = trace?.options?.['line-height'] || settings['line-height'];
      const nextTraceMt = nextTrace?.options?.['margin-top'] || 0;

      range.push(prevSpace + traceMb + nextTraceMt + lh);
    }

    // Apply updates
    scale.y.domain(domain).range(range);
    // Translate x axis position
    axis.x.attr('transform', `translate(0, ${range[range.length - 1]})`);
    if (settings['x-axis-show'] === false) {
      axis.x.style('display', 'none');
    }
  }

  private createTooltip() {
    this.tooltip = this.tooltipService._tooltip;
  }

  private createBrush() {
    this.initializeService.brushRegion = this.initializeService.draw
      .append('g')
      .attr('class', 'brush');
  }

  private setSelectionShadow(selectionContext: SelectionContext) {
    const scale = this.initializeService.scale;
    const [start, end] = [
      selectionContext.range!.start,
      selectionContext.range!.end,
    ];

    this.initializeService.shadow
      .data([selectionContext])
      .attr('x', scale.x(start))
      .attr('width', scale.x(end) - scale.x(start));
  }

  private removeSelectionShadow() {
    this.initializeService.shadow
      .data([
        {
          trace: undefined,
          feature: undefined,
          range: undefined,
        } as SelectionContext,
      ])
      .attr('x', 0)
      .attr('width', 0);
  }

  private renderTraces(traces: InternalTraces): void {
    const scale = this.initializeService.scale;
    const settings = this.initializeService.settings;
    const currentDomainStart = scale.x.domain()[0];
    const currentDomainEnd = scale.x.domain()[1];
    const featureSortingFunc = settings?.['sort-nested-locuses'] ? sortLocuses : undefined;
    const charWidth = this.sequenceRenderer.featureLabelCharWidth;
    const cw = scale.x(1) - scale.x(0);
    const coilPoints = this.coilPoints;
    const alreadyExitedFromView = this.alreadyExitedFromView;

    this.initializeService.hoverCircleMarker.attr('display', 'none');

    // 1. Data-join on traces
    this['group.traces'] = this.initializeService.draw
      .selectAll<SVGGElement | BaseType, InternalTrace>('g.trace')
      .data<InternalTrace>(traces, identity)
      .join('g')
      .attr('id', (trace) => 'trace-' + trace.id)
      .attr('class', 'trace');

    // 2. Data-join on features
    this['group.traces'].each((trace, i, nodes) => {
      const traceGroup = d3.select(nodes[i]);

      if (featureSortingFunc) {
        trace.features.sort(featureSortingFunc);
      }

      const featureGroup = traceGroup
        .selectAll<SVGGElement, Feature>('g.feature')
        .data(trace.features, featureIdentity);

      const featureSelection = featureGroup
        .join(
          enter => this.setupFeatureGroup(enter, trace),
          update => update,
          exit => exit.remove()
        )
        .order();

      featureSelection
        .call(g => this.tooltipService.bindFeatureEvents(g, trace, this.selectedFeatureEmit$))
        .each((feature, featureIdx, featureNodes) => {
          // Calculate trace-specific layout values
          const mt = scale.y('' + trace.id) || 0;
          const lh = trace.options?.['line-height'] || settings['line-height'];
          const cs = trace.options?.['content-size'] || settings['content-size'];
          const center = mt + lh / 2;
          const bottom = center + cs / 2;
          const top = center - cs / 2;

          // Check if feature is out of view (for optimization if needed)
          const { featureStart, featureEnd } = getStartEndPositions(feature);
          const startPoint = Math.max(featureStart, currentDomainStart);
          const endPoint = Math.min(featureEnd, currentDomainEnd);

          if (endPoint < startPoint) {
            if (alreadyExitedFromView.has(feature)) {
              return;
            } else {
              alreadyExitedFromView.add(feature);
            }
          } else {
            alreadyExitedFromView.delete(feature);
          }

          const options: FeatureRenderOptions = {
            scale,
            settings,
            trace,
            featureIdx,
            charWidth,
            cw,
            top,
            bottom,
            center,
            currentDomainStart,
            currentDomainEnd,
            coilPoints
          };

          const strategy = StrategyFactory.getStrategy(feature.type);
          if (strategy) {
            strategy.render(d3.select(featureNodes[featureIdx]), feature, options);
          }
        });
    });
  }

  private setupFeatureGroup(
    enterSelection: d3.Selection<d3.EnterElement, Feature, SVGGElement | d3.BaseType, unknown>,
    trace: InternalTrace
  ): d3.Selection<SVGGElement, Feature, SVGGElement | d3.BaseType, unknown> {
    const g = enterSelection
      .append('g')
      .attr('class', (d) => 'feature ' + d.type)
      .attr('id', (f) => `trace-${trace.id}-feature-${featureIdentity(f)}`);

    return g;
  }

  private updateShadowPosition() {
    const shadow = this.initializeService.shadow;
    const scale = this.initializeService.scale;

    const selectionContext = shadow.datum();

    if (selectionContext.range) {
      // Get the feature associated with the shadow
      const selectionContext = shadow.datum();
      // Update the position of the shadow
      shadow
        .attr('x', scale.x(selectionContext.range!.start))
        .attr(
          'width',
          scale.x(selectionContext.range!.end + 0.5) -
            scale.x(selectionContext.range!.start)
        );
    }
  }

  public onLabelClick(trace: InternalTrace): void {
    // Update flag for current trace
    trace.expanded = !trace.expanded;
    const descendantsTracesIds = this.featuresService.getBranch(trace).slice(1);

    for (const descendant of descendantsTracesIds) {
      // If the trace is expanded, then only the next level of traces should be shown
      if (trace.expanded) {
        if (descendant.level === trace.level + 1) {
          descendant.show = true;
        }
      } else {
        descendant.show = false;
      }
      descendant.expanded = false;
    }

    // Emit current traces
    this.traces$.next(
      this.featuresService.tracesNoNesting$.value.filter((trace) => trace.show)
    );
  }
}
/**
 * Sorts Features to ensure locuses nested on other locuses are rendered in order
 * ensuring a locus isn't rendered over another
 * @param a first feature
 * @param b second feature
 * @returns
 */
export const sortLocuses = (a: Feature, b: Feature) => {
  const isInterval = (f: Feature): f is Locus | DSSP =>
    (f.type === 'locus' || f.type === 'dssp') && 'start' in f && 'end' in f;

  if (isInterval(a) && isInterval(b)) {
    // If b contains a, a should be drawn after b (on top)
    if (b.start <= a.start && b.end >= a.end && (b.start < a.start || b.end > a.end)) {
      return 1;
    }
    // If a contains b, a should be drawn before b (underneath)
    if (a.start <= b.start && a.end >= b.end && (a.start < b.start || a.end > b.end)) {
      return -1;
    }
    if (a.start !== b.start) {
      return a.start - b.start;
    }
    return (b.end - b.start) - (a.end - a.start);
  }
  return 0;
}
function parseSequence(sequence: Sequence): string[] {
  const residues: string[] = [];
  // Case sequence is an array
  if (Array.isArray(sequence)) {
    // Update residues list
    residues.push(...sequence);
  }
  // Case sequence is a string
  else if (typeof sequence === 'string') {
    // Update residues list
    residues.push(...sequence.split(''));
  }
  return residues;
}

function getStartEndPositions(feature: Feature) {
  let featureStart, featureEnd;
  switch (feature.type) {
    case 'locus':
      featureStart = feature.start - 0.5;
      featureEnd = feature.end; // + 0.5;
      break;
    case 'dssp':
      featureStart = feature.start - 0.5;
      featureEnd = feature.end + 0.5;
      break;
    case 'continuous':
      featureStart = 0.5;
      featureEnd = feature.values.length + 0.5;
      break;
    case 'pin':
      featureStart = feature.position - 0.5;
      featureEnd = feature.position + 0.5;
      break;
    case 'poly':
      featureStart = feature.position - 0.5;
      featureEnd = feature.position + 0.5;
      break;
    default:
      featureStart = 0;
      featureEnd = 10;
  }
  return { featureStart, featureEnd };
}
