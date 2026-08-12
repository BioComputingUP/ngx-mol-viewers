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
import { Feature } from '../features/feature';
import { StrategyFactory } from './strategies/strategy.factory';
import { FeatureRenderOptions } from './strategies/feature-strategy.interface';
import { Sequence, sequenceColors } from '../sequence';
// Data types
import { GridLines, InternalTrace, InternalTraces, LabelGroup, LayoutTrace, SequenceContainer, TraceGroup } from '../trace';
import { FeaturesService } from './features.service';
// Services
import { InitializeService, SelectionContext } from './initialize.service';
import { TooltipService } from './tooltip.service';



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

const alreadyExitedFromView = new Set<Feature>();

@Injectable({ providedIn: 'platform' })
export class DrawService {
  public readonly traces$ = new ReplaySubject<InternalTraces>(1);

  public readonly sequence$ = new ReplaySubject<Sequence>(1);

  public readonly selectedFeatureEmit$ = new EventEmitter<
    SelectionContext | undefined
  >();

  public readonly selectedFeature$: Observable<SelectionContext | undefined>;

  public 'group.residues'!: SequenceContainer;

  public 'group.dots'!: SequenceContainer;

  public 'group.labels'!: LabelGroup;

  public 'group.traces'!: TraceGroup;

  public 'group.grid'!: GridLines;

  public sequenceCharWidth = 0.0;
  public featureLabelCharWidth = 0.0;

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
    private tooltipService: TooltipService
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
      tap(() => this.calculateCharWidth()),
      // Draw sequence
      map(([, sequence]) => this.createSequence(sequence)),
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
        this.createGrid(traces);
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
      tap(() => this.updateSequence()),
      // Move grid in correct position
      tap(() => this.updateGrid()),
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

  private calculateCharWidth() {
    const settings = this.initializeService.settings;
    // Get the width of the character 'A' in the sequence
    const text = this.initializeService.draw
      .append('text')
      .attr('class', 'sequence')
      .text('A');
    const bbox = text.node()!.getBBox();
    this.sequenceCharWidth = bbox.width;
    text.remove();

    // Get the width of the character 'A' in the feature label
    const text2 = this.initializeService.draw
      .append('text')
      .attr('class', 'feature')
      .text('A');
    const bbox2 = text2.node()!.getBBox();
    this.featureLabelCharWidth = bbox2.width;
    text2.remove();

    // Get the width of the character 'A' in the x-axis
    const text3 = this.initializeService.draw
      .append('text')
      .attr('class', 'tick')
      .text('A');
    const bbox3 = text3.node()!.getBBox();
    const xAxisXCharHeight = bbox3.height;
    text3.remove();

    // Update the margin bottom to accommodate at least the height of the character of the x-axis
    if (settings['x-axis-show'] !== false) {
      const settings = this.initializeService.settings;
      settings['margin-bottom'] = Math.max(
        settings['margin-bottom'],
        xAxisXCharHeight + 6
      );
    }
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

  private createSequence(sequence: Sequence) {
    // Initialize residues group
    const group = this.initializeService.draw
      // Select previous residues group
      .selectAll('g.sequence')
      // Bind residues group to sequence
      .data<Sequence>([sequence])
      // Create current residues group
      .join('g')
      .attr('class', 'sequence');

    // Create residues container inside the sequence group
    this['group.residues'] = group.append('g').attr('class', 'residues');

    this['group.dots'] = group.append('g').attr('class', 'dots');
  }

  private updateSequence() {
    // Get the sequence and from the sequence the residues
    const sequence = this.initializeService.sequence;
    const settings = this.initializeService.settings;
    const residues = parseSequence(sequence);

    // The list of residues can be empty in the case the sequence is a length only
    if (residues.length === 0 || settings['sequence-show'] === false) {
      return;
    }

    // Get scale (x, y axis)
    const { x, y } = this.initializeService.scale;
    // Get line height
    const lh = this.initializeService.settings['line-height'];
    const cs = this.initializeService.settings['content-size'];
    // Define container/cell width and (maximum) text width
    const cellWidth = x(1) - x(0);
    // Get maximum character width
    const charWidth = this.sequenceCharWidth;
    // Define residues group
    const residuesContainer = this['group.residues'];
    const dotsContainer = this['group.dots'];

    const domainStart = x.domain()[0] + 0.5;
    const domainEnd = x.domain()[1];

    if (charWidth + 0.5 > cellWidth) {
      // Remove residues if dots are to be shown
      residuesContainer.selectAll('*').remove();

      // Calculate number of dots needed
      const domainLength = domainEnd - domainStart;

      // Calculate how many cells are needed for each dot
      const spacing = 2;
      const bits = (domainLength * cellWidth) / charWidth / spacing;
      const bitSize = domainLength / bits + 1;

      const xPositions = d3
        .range(domainStart, domainEnd, bitSize)
        .map((i) => x(i + bitSize / 2));

      // Create or update dots
      dotsContainer
        .selectAll('text.dot')
        .data(xPositions)
        .join('text')
        .attr('class', 'dot')
        .text('.')
        .attr('x', (d) => d)
        .attr('y', y('sequence') + lh / 2)
        .attr('width', charWidth)
        .attr('height', lh)
        .attr('dominant-baseline', 'central')
        .style('text-anchor', 'middle');
    } else {
      // Ensure dots are removed if residues are to be shown
      this['group.dots'].selectAll('*').remove();

      const domainStartFloor = Math.floor(domainStart + 0.5);
      const domainEndCeil = Math.min(Math.ceil(domainEnd), residues.length);

      const visibleResidues = residues.slice(
        Math.max(0, domainStartFloor - 1),
        domainEndCeil
      );

      // Create the visible residues inside the residues container as rect with the color of the residue
      if (settings['sequence-background-color']) {
        const color = (d: string) =>
          sequenceColors[settings['sequence-background-color']!][d as never] ||
          sequenceColors[settings['sequence-background-color']!].X;
        let height;
        let yValue: number = y('sequence');

        switch (settings['sequence-background-height']) {
          case '100%':
            height = '100%';
            break;
          case 'content-size':
            height = cs;
            yValue += (lh - cs) / 2;
            break;
          case 'line-height':
            height = lh;
            break;
          default:
            height = cs;
        }

        residuesContainer
          .selectAll('rect.residue')
          .data(visibleResidues)
          .join('rect')
          .attr('class', 'residue')
          .attr('x', (d, i) => x(i + domainStartFloor - 0.5))
          .attr('y', yValue)
          .attr('width', cellWidth)
          .attr('height', height)
          .attr('fill', color)
          .attr('fill-opacity', settings['sequence-background-opacity'] || 0.5);
      }

      // Create the visible residues inside the residues container as text elements
      residuesContainer
        .selectAll('text.residue')
        .data(visibleResidues)
        .join('text')
        .attr('class', 'residue')
        .text((d) => '' + d)
        .attr('x', (d, i) => x(i + domainStartFloor))
        .attr('y', y('sequence') + lh / 2)
        .attr('dominant-baseline', 'central')
        .style('text-anchor', 'middle');
    }

    const textColor = settings['text-color'];
    // Update the residue and dots color always
    residuesContainer.selectAll('text.residue').attr('fill', textColor);
    dotsContainer.selectAll('text.dot').attr('fill', textColor);
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

  private createGrid(traces: InternalTraces): void {
    const group = this.initializeService.focus
      // Create parent grid element
      .selectAll<SVGGElement, InternalTraces>('g.grid')
      .data<InternalTraces>([traces], index)
      .join('g')
      .attr('class', 'grid')
      .lower();

    this['group.grid'] = group
      .selectAll<SVGGElement | BaseType, InternalTrace>('g.grid-line-group')
      .data<InternalTrace>(traces, identity)
      .join('g')
      .attr('id', (d) => 'grid-' + d.id)
      .attr('class', 'grid-line-group')
      .join('line');

    this['group.grid'].each(function (trace) {
      const traceGroup = d3.select(this);
      // Remove all existing grid lines to force re-render on updates
      traceGroup.selectAll('line.grid-line').remove();
      traceGroup.selectAll('line.zero-line').remove();

      if (trace.options?.['grid']) {
        // In each group of grid lines, create the lines
        traceGroup
          .selectAll('line.grid-line')
          .data(trace.options?.['grid-y-values'] || [])
          .enter()
          .append('line')
          .attr('class', 'grid-line')
          .style('shape-rendering', 'crispedges')
          .attr('id', (d, index) => 'grid-line-' + index);
      }

      // Create initial zero-line if defined
      if (trace.options?.['zero-line']) {
        // Create zero line
        traceGroup
          .selectAll('line.zero-line')
          .data([true])
          .enter()
          .append('line')
          .attr('class', 'zero-line')
          .style('shape-rendering', 'crispedges')
          .attr('id', 'zero-line');
      }
    });
  }

  private updateGrid(): void {
    const group: GridLines = this['group.grid'];

    const y = this.initializeService.scale.y;
    const settings = this.initializeService.settings;
    const x1 = this.initializeService.x1;
    const x2 = this.initializeService.x2;

    group.each(function (trace: InternalTrace) {
      const traceGroup = d3.select(this);

      // Get all the necessary values to compute the position of the grid lines
      const mt = y('' + trace.id);
      const lh = trace.options?.['line-height'] || settings['line-height'];
      const cs = trace.options?.['content-size'] || settings['content-size'];

      // top is calculated as the distance to the top, plus the lh/2 to get the mid-point of the line, plus the cs/2 to get the bottom of the line
      const bottom = mt + lh / 2 + cs / 2;
      const top = mt + lh / 2 - cs / 2;

      function rescaleY(yValue: number): number {
        // top and bottom are actually switched, as the y-axis is inverted
        return (
          bottom +
          ((yValue - trace.domain.min) /
            (trace.domain.max - trace.domain.min)) *
            (top - bottom)
        );
      }

      // Update grid lines
      traceGroup
        .selectAll('line.grid-line')
        .data(trace.options?.grid ? trace.options?.['grid-y-values'] || [] : [])
        .attr('x1', x1)
        .attr('x2', x2)
        .attr('y1', (d) => rescaleY(d))
        .attr('y2', (d) => rescaleY(d))
        .attr(
          'stroke',
          trace.options?.['grid-line-color'] || settings['grid-line-color']
        )
        .attr('stroke-width', trace.options?.['grid-line-width'] || 1);

      // Update zero-line if defined
      traceGroup
        .selectAll('line.zero-line')
        .data(trace.options?.['zero-line'] ? [true] : [])
        .attr('x1', x1)
        .attr('x2', x2)
        .attr('y1', rescaleY(0))
        .attr('y2', rescaleY(0))
        .attr('stroke', trace.options?.['zero-line-color'] || 'black')
        .attr('stroke-width', trace.options?.['zero-line-width'] || 1);
    });
  }

  private renderTraces(traces: InternalTraces): void {
    const scale = this.initializeService.scale;
    const settings = this.initializeService.settings;
    const currentDomainStart = scale.x.domain()[0];
    const currentDomainEnd = scale.x.domain()[1];
    const featureSortingFunc = settings?.['sort-nested-locuses'] ? sortLocuses : undefined;
    const charWidth = this.featureLabelCharWidth;
    const cw = scale.x(1) - scale.x(0);
    const coilPoints = this.coilPoints;

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
      const featureGroup = traceGroup
        .selectAll<SVGGElement, Feature>('g.feature')
        .data(trace.features);

      featureGroup
        .join(
          enter => this.setupFeatureGroup(enter, trace),
          update => update,
          exit => exit.remove()
        )
        .call(g => featureSortingFunc ? g.sort(featureSortingFunc) : g)
        .call(g => this.bindFeatureEvents(g, trace))
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
      .attr('id', (_, i) => `trace-${trace.id}-feature-${i}`);

    return g;
  }

  private bindFeatureEvents(
    selection: d3.Selection<SVGGElement, Feature, SVGGElement | d3.BaseType, unknown>,
    trace: InternalTrace
  ): void {
    const tooltipService = this.tooltipService;
    const initializeService = this.initializeService;
    const selectionEmitter$ = this.selectedFeatureEmit$;
    const circle = this.initializeService.hoverCircleMarker;
    const scale = initializeService.scale;

    selection.on('mouseenter', (event: MouseEvent, feature: Feature) => {
      const featureIdx = trace.features.indexOf(feature);
      tooltipService.onMouseEnter(event, trace, feature, featureIdx);
    });

    selection.on('mousemove', (event: MouseEvent, feature: Feature) => {
      const featureIdx = trace.features.indexOf(feature);
      tooltipService.onMouseMove(event, trace, feature, featureIdx);

      if (feature.type === 'continuous') {
        const coordinates = initializeService.getCoordinates(event, trace.id);
        if (coordinates[0] <= 0.5) return;

        const mt = scale.y('' + trace.id) || 0;
        const lh = trace.options?.['line-height'] || initializeService.settings['line-height'];
        const cs = trace.options?.['content-size'] || initializeService.settings['content-size'];
        const center = mt + lh / 2;
        const bottom = center + cs / 2;
        const top = center - cs / 2;

        const rescaleY = (yValue: number) => (
          bottom +
          ((yValue - trace.domain.min) / (trace.domain.max - trace.domain.min)) * (top - bottom)
        );

        circle
          .attr('cx', scale.x(coordinates[0]))
          .attr('cy', rescaleY((feature as any).values[coordinates[0] - 1]))
          .attr('display', 'block');
      }
    });

    selection.on('mouseleave', () => {
      tooltipService.onMouseLeave();
      circle.attr('display', 'none');
    });

    selection.on('click', (event: MouseEvent, feature: Feature) => {
      selectFeature(feature, initializeService, event, trace, selectionEmitter$);
    });
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
  if (a.type == 'locus' && b.type == 'locus') {
    const bfirst = b.start < a.start;
    const blast = b.end > a.end;
    if (bfirst && blast) {
      return 1;
    }
    if (!bfirst && !blast) {
      return -1;
    }
  }
  return 1;
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

function selectFeature(
  feature: Feature,
  initializeService: InitializeService,
  event: MouseEvent,
  trace: InternalTrace,
  selectionEmitter$: EventEmitter<SelectionContext | undefined>
) {
  let { featureStart, featureEnd } = getStartEndPositions(feature);

  const coordinates = initializeService.getCoordinates(event, trace.id);
  if (feature.type === 'continuous') {
    featureStart = coordinates[0] - 0.5;
    featureEnd = coordinates[0] + 0.5;
  }
  const selectionContext: SelectionContext = {
    trace,
    feature,
    range: { start: featureStart, end: featureEnd },
  };
  selectionEmitter$.next(selectionContext);
}
