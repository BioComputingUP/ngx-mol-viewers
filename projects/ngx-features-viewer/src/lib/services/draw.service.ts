// Common
import { combineLatest, map, Observable, ReplaySubject, shareReplay, switchMap, tap, throttleTime } from 'rxjs';
import { EventEmitter, Injectable } from '@angular/core';
import * as d3 from 'd3';
// Services
import { InitializeService, SelectionContext } from './initialize.service';
import { FeaturesService } from './features.service';
import { TooltipService } from './tooltip.service';
// Data types
import { InternalTrace, InternalTraces } from '../trace';
import { Feature } from '../features/feature';
import { Continuous } from '../features/continuous';
import { Locus } from '../features/locus'
import { DSSP, DSSPPaths, dsspShape } from "../features/dssp";
import { Pin } from "../features/pin";
import { Sequence } from "../sequence";

type ResidueGroup = d3.Selection<SVGGElement | d3.BaseType, string, SVGGElement | d3.BaseType, Sequence>;

type LabelGroup = d3.Selection<SVGGElement | d3.BaseType, InternalTrace, SVGGElement | d3.BaseType, InternalTraces>;

type TraceGroup = d3.Selection<SVGGElement | d3.BaseType, InternalTrace, SVGGElement, undefined>;

type GridLines = d3.Selection<SVGGElement | d3.BaseType, InternalTrace, SVGGElement | d3.BaseType, InternalTraces>;

// type DivTooltip = d3.Selection<HTMLDivElement, unknown, null, unknown>;

// type d3Selection = d3.Selection<d3.BaseType, unknown, null, undefined>

// TODO This should not be there
export const CINEMA = {
  H: 'blue',
  K: 'blue',
  R: 'blue', // Polar, positive
  D: 'red',
  E: 'red', // Polar, negative
  S: 'green',
  T: 'green',
  N: 'green',
  Q: 'green', // Polar, neutral
  A: 'white',
  V: 'white',
  L: 'white',
  I: 'white',
  M: 'white', // Non polar, aliphatic
  F: 'magenta',
  W: 'magenta',
  Y: 'magenta', // Non polar, aromatic
  P: 'brown',
  G: 'brown',
  C: 'yellow',
  B: 'grey',
  Z: 'grey',
  X: 'grey',
  '-': 'grey', // Special characters
};

// Get size of 1rem in pixel
// https://stackoverflow.com/questions/36532307/rem-px-in-javascript
export const REM = parseFloat(getComputedStyle(document.documentElement).fontSize);

// Define function for extracting identifier out of unknown object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const identity = (f: unknown) => (f as { id: any }).id;

// Define function for extracting index out of unknown object
export const index = (f: unknown, i: number) => i;

const alreadyExitedFromView = new Set<Feature>();

@Injectable({providedIn: 'platform'})
export class DrawService {

  public readonly traces$ = new ReplaySubject<InternalTraces>(1);

  public readonly sequence$ = new ReplaySubject<Sequence>(1);

  public readonly selectedFeatureEmit$ = new EventEmitter<SelectionContext | undefined>();

  public readonly selectedFeature$: Observable<SelectionContext | undefined>;

  public 'group.residues'!: ResidueGroup;

  public 'group.labels'!: LabelGroup;

  public 'group.traces'!: TraceGroup;

  public 'group.grid'!: GridLines;

  public 'char.width' = 0.0;

  public tooltip!: d3.Selection<HTMLDivElement, unknown, null, unknown>;

  /** Draw features
   *
   * This pipeline initialize features within the drawable aread
   * of the main SVG container, defined by the `draw` property.
   */
  public readonly draw$: Observable<unknown>;

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
  ) {
    // Define draw initialization
    this.draw$ = combineLatest([this.initializeService.initialized$, this.sequence$]).pipe(
      // Update horizontal scale domain
      tap(([, sequence]) => {
        // Get horizontal scale
        const x = this.initializeService.scale.x;
        // Generate horizontal domain for sequence
        const domain = [0, sequence.length + 1];
        // Update horizontal scale
        x.domain(domain);
      }),
      // Draw sequence
      map(([, sequence]) => this.createSequence(sequence)),
      // Initialize brush region
      tap(() => this.createBrush()),
      // Initialize tooltip
      tap(() => this.createTooltip()),
      // Cache result
      shareReplay(1),
      // Switch to traces emission
      switchMap(() => this.traces$),
      // Update vertical scale
      tap((traces) => this.updateScale(traces)),
      // Draw labels, without setting position but saving references
      tap((traces) => this.createLabels(traces)),
      // Draw grid, without setting position but saving references
      tap((traces) => this.createGrid(traces)),
      // Draw features, without setting position but saving references
      tap((traces) => this.createTraces(traces)),
      // NOTE This is required to avoid re-drawing everything on each resize/zoom event
      shareReplay(1),
    );
    // Define draw update
    this.drawn$ = this.draw$.pipe(
      // Move sequence residues in correct position
      tap(() => this.updateSequence()),
      // Move grid in correct position
      tap(() => this.updateGrid()),
      // Move traces in correct position
      map(() => this.updateTraces()),
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
  }

  // Update vertical scale
  public updateScale(traces: InternalTraces): void {
    const axis = this.initializeService.axes;
    const scale = this.initializeService.scale;
    const sequence = this.initializeService.sequence;
    const settings = this.initializeService.settings;
    // Update domain
    const domain = ['sequence', ...traces.map(({id}) => id + '')];
    // Initialize range
    const range = [settings['margin-top']];
    // Set sequence line height
    if (Array.isArray(sequence) || (typeof sequence === 'string')) {
      range.push(settings['margin-top'] + settings['line-height'])
    } else {
      range.push(settings['margin-top']);
    }
    // Update range
    domain.slice(1).forEach((id: string) => {
      // Get current trace
      const trace = this.featuresService.getTrace(+id);
      // Case trace is defined
      if (trace) {
        // Get offset for current trace
        const mt = range[range.length - 1];
        // Initialize line height for current trace
        const lh = trace.options?.['line-height'] || settings['line-height'];
        // Update range
        range.push(mt + lh);
      }
      // Otherwise, throw error
      else throw new Error('Trace not found');
    });
    // Apply updates
    scale.y.domain(domain).range(range);
    // Translate x axis position
    axis.x.attr('transform', `translate(0, ${range[range.length - 1]})`);
  }

  private createTooltip() {
    this.tooltip = this.tooltipService._tooltip;
  }

  private createSequence(sequence: Sequence) {
    // Color residue according to code
    const color = (d: string) => CINEMA[d as never] || CINEMA.X;
    // Initialize residues group
    const group = this.initializeService.draw
      // Select previous residues group
      .selectAll('g.sequence')
      // Bind residues group to sequence
      .data<Sequence>([sequence])
      // Create current residues group
      .join('g')
      .attr('class', 'sequence');
    // Define residues list
    const residues = [];
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
    // TODO Append background rectangles to SVG element
    this['group.residues'] = group
      // Select previous residue groups
      .selectAll('g.residue')
      // Bind residue one-letter-code to each group
      .data(residues)
      // Generate group
      .join('g')
      .attr('id', (_, i) => `residue-${i + 1}`)
      .attr('class', 'residue');
    // Add background rectangle to each residue group
    this['group.residues']
      .append('rect')
      .attr('class', 'color')
      .attr('fill', (d) => color(d))
      .attr('fill-opacity', 0.1);
    // Define maximum width of text
    this['char.width'] = 9.64  // TODO : Change char width based on font
    // Add text to each residue group
    this['group.residues']
      .append('text')
      .style('font-family', 'monospace') // TODO: Add more fonts (always monospace)
      .attr('class', 'name')
      .text((d) => '' + d)
  }

  private createBrush() {
    this.initializeService.brushRegion = this.initializeService.draw.append('g').attr('class', 'brush');
  }

  private setSelectionShadow(selectionContext: SelectionContext) {
    const scale = this.initializeService.scale;
    const [start, end] = [selectionContext.range!.start, selectionContext.range!.end];

    this.initializeService.shadow
      .data([selectionContext])
      .attr('x', scale.x(start))
      .attr('width', scale.x(end) - scale.x(start))
  }

  private removeSelectionShadow() {
    this.initializeService.shadow
      .data([{trace: undefined, feature: undefined, range: undefined} as SelectionContext])
      .attr('x', 0)
      .attr('width', 0);
  }

  public updateSequence() {
    // Get height, width, margins
    const margin = this.initializeService.margin;
    // Get scale (x, y axis)
    const {x, y} = this.initializeService.scale;
    // Get line height
    const {'line-height': lineHeight} = this.initializeService.settings;
    // Define container/cell width and (maximum) text width
    const cellWidth = x(1) - x(0);
    // Get maximum character width
    const charWidth = this['char.width'];
    // Define residues group
    const {'group.residues': residues} = this;
    // Update size, position of residue background
    residues
      .select('rect.color')
      .attr('x', (_, i) => x(i + 0.5))
      .attr('y', margin.top)
      .attr('width', () => cellWidth)
      .attr('height', lineHeight);
    // Update size, position of residue names
    residues.select<SVGTextElement>('text.name')
      .attr('x', (_, i) => x(i + 1))
      .attr('y', y('sequence') + lineHeight / 2)
      .attr('width', () => cellWidth)
      .attr('height', lineHeight)
      // Style positioning
      .attr('dominant-baseline', 'central')
      .style('text-anchor', 'middle')
      // Style color text
      .attr('fill', this.initializeService.settings['text-color'])
      // Update opacity according to text width
      .attr('opacity', () => charWidth > cellWidth ? 0 : 1);
  }

  public createLabels(traces: InternalTraces): void {
    // Initialize labels SVG group
    const group = this.initializeService.svg
      // Select previous labels group
      .selectAll('g.labels')
      // Bind group to current traces
      .data([traces], index)
      // Create current labels group
      .join('g')
      .attr('class', 'labels')
    // Add labels to their group
    this['group.labels'] = group
      .selectAll('g')
      .data([{id: 'sequence', label: 'Sequence', expanded: true}, ...traces] as InternalTraces, identity)
      .join(
        (enter) => enter.append('g'),
        (update) => update,
        (exit) => {
          // Hide labels
          exit.each((d) => {
            this.hideLabels(d);
          });
          return exit;
        },
      )
    this['group.labels'].each((trace: InternalTrace) => {
      this.setLabelsPosition(trace);
    });
  }

  private setLabelsPosition(trace: InternalTrace) {
    const y = this.initializeService.scale.y;
    const {left: ml, right: mr} = this.initializeService.margin;
    const settings = this.initializeService.settings
    // Get identifier trace
    const identifier = '' + trace.id;
    for (const place of ['left', 'right']) {
      // Get associated trace
      const label = this.initializeService.div.querySelector<HTMLDivElement>(`div#label-${place}-` + identifier);
      // If label exists, update its positioning
      if (label) {
        label.classList.add('label');
        if (place === 'left') {
          // Position the label to the left
          label.style.left = '0px';
          label.style.width = `${ml}px`;
        } else {
          // Position the label to the right, ad add a "margin" left of 8 px to space the label from the traces
          label.style.right = '0px';
          label.style.width = `${mr}px`;
        }
        label.style.top = y(identifier) + 'px';
        label.style.display = 'block';
        label.style.height = (trace.options?.['line-height'] || settings['line-height']) + 'px';
      }
    }
  }

  private hideLabels(trace: InternalTrace) {
    // Get identifier trace
    const identifier = trace.id;
    for (const place of ['left', 'right']) {
      // Get associated trace
      const label = this.initializeService.div.querySelector<HTMLDivElement>(`div#label-${place}-` + identifier);
      // If label exists, update its positioning
      if (label) {
        // Hide label
        label.style.display = 'none';
      }
    }
  }

  public createGrid(traces: InternalTraces): void {
    const group = this.initializeService.svg
      // Create parent grid element
      .selectAll('g.grid')
      .data([traces], index)
      .join('g')
      .attr('class', 'grid')
      .lower();

    this['group.grid'] = group
      .selectAll('g.grid-line-group')
      .data(traces, identity)
      .join('g')
      .attr('id', (d) => 'grid-' + d.id)
      .attr('class', 'grid-line-group')
      .join('line');

    this['group.grid'].each((trace) => {
      if (trace.options?.['grid']) {
        // In each group of grid lines, create the lines
        this['group.grid'].selectAll('line.grid-line')
          .data(trace.options?.['grid-y-values'] || [])
          .enter()
          .append('line')
          .attr('class', 'grid-line')
          .attr('id', (d, index) => 'grid-line-' + index);
      }

      // Create initial zero-line if defined
      if (trace.options?.['zero-line']) {
        // Create zero line
        this['group.grid'].selectAll('line.zero-line')
          .data([true])
          .enter()
          .append('line')
          .attr('class', 'zero-line')
          .attr('id', 'zero-line');
      }
    });
  }

  public updateGrid(): void {
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
        return bottom + (yValue - trace.domain.min) / (trace.domain.max - trace.domain.min) * (top - bottom);
      }

      // Update grid lines
      traceGroup
        .selectAll('line.grid-line')
        .data(trace.options?.grid ? trace.options?.['grid-y-values'] || [] : [])
        .attr('x1', x1)
        .attr('x2', x2)
        .attr('y1', d=> rescaleY(d))
        .attr('y2', d => rescaleY(d))
        .attr('stroke', trace.options?.["grid-line-color"] || settings["grid-line-color"])
        .attr('stroke-width', trace.options?.["grid-line-width"] || 1);

      // Update zero-line if defined
      traceGroup
        .selectAll('line.zero-line')
        .data(trace.options?.['zero-line'] ? [true] : [])
        .attr('x1', x1)
        .attr('x2', x2)
        .attr('y1', rescaleY(0))
        .attr('y2', rescaleY(0))
        .attr('stroke', trace.options?.["zero-line-color"] || 'black')
        .attr('stroke-width', trace.options?.["zero-line-width"] || 1);
    });
  }

  public createTraces(traces: InternalTraces): void {
    // Get references to local variables as `this` might be lost
    const settings = this.initializeService.settings;
    const tooltipService = this.tooltipService;
    const initializeService = this.initializeService;
    const selectionEmitter$ = this.selectedFeatureEmit$;

    // Generate and store traces groups
    this['group.traces'] = this.initializeService.draw
      .selectAll('g.trace')
      .data(traces, identity)
      .join('g')
      .attr('id', (trace) => 'trace-' + trace.id)
      .attr('class', 'trace');
    // .raise();
    // Iterate over each trace
    this['group.traces'].each(function (trace) {
      // Define trace group
      const traceGroup = d3.select(this);
      // Define feature groups
      const featureGroup = traceGroup
        .selectAll<d3.BaseType, Feature>('g.feature')
        .data(trace.features);
      // On: feature group enter
      featureGroup.enter().append('g')
        .attr('class', (d) => 'feature ' + d.type)
        .attr('id', (_, i) => `trace-${trace.id}-feature-${i}`)
        .each(function (feature, index) {
          // Define current selection
          const selection = d3.select(this);
          // Bind data to selection
          selection.data([feature]);
          // On mouse enter / over
          selection.on('mouseenter', (event: MouseEvent) => tooltipService.onMouseEnter(event, trace, feature, index));
          // On mouse move
          selection.on('mousemove', (event: MouseEvent) => tooltipService.onMouseMove(event, trace, feature, index));
          // On mouse leave
          selection.on('mouseleave', () => tooltipService.onMouseLeave());
          // On feature click
          selection.on('click', (event: MouseEvent) => selectFeature(feature, initializeService, event, trace, selectionEmitter$));

          const appendElementWithAttributes = (
            parent: d3.Selection<SVGGElement, unknown, null, undefined>,
            element: string,
            attributes: { [key: string]: number | string }
          ): d3.Selection<d3.BaseType, unknown, null, undefined> => {
            const el = parent.append(element);
            Object.entries(attributes).forEach(([key, value]) => {
              el.attr(key, value);
            });
            return el;
          };

          const container = d3.select(this);

          if (feature.type === 'locus') {
            const rectAttributes = {
              'stroke': feature["stroke-color"] || 'none',
              'stroke-opacity': 1.0,
              'stroke-width': feature["stroke-width"] || 0,
              'fill': feature.color || 'white',
              'fill-opacity': feature.opacity || 1,
              'rx': 4,
              'ry': 4
            };

            appendElementWithAttributes(container, 'rect', rectAttributes);

            // addMouseEvents(rect, tooltip, trace, feature);
            if (feature.label) {
              // Based on the color of the feature, determine if the fill of the text should be white or black
              let textColor = feature["text-color"];

              if (!textColor) {
                const featureColor = d3.hsl(d3.color(feature.color || 'black')!);
                textColor = (Number.isNaN(featureColor.l) || featureColor.l > 0.5) ? "black" : "white";
              }

              const labelAttributes = {
                "fill": textColor,
                "dominant-baseline": "central"
              }

              const text = appendElementWithAttributes(container, 'text', labelAttributes);
              text.text(feature.label)
              text.style("text-anchor", "left")
              // text.style("pinter-events", "none")
            }
          }

          if (feature.type === 'continuous') {
            const pathAttributes = {
              'stroke': feature["stroke-color"] || feature.color || 'black',
              'stroke-opacity': feature.opacity || 1,
              'stroke-width': feature["stroke-width"] || 1,
              'fill': feature.showArea ? feature.color || 'black' : 'none',
              'fill-opacity': feature.opacity || 1,
            };

            appendElementWithAttributes(container, 'path', pathAttributes);
          }

          if (feature.type === 'pin') {
            const circleAttributes = {
              'stroke': feature["stroke-color"] || 'none',
              'stroke-width': feature["stroke-width"] || 0,
              'fill': feature.color || 'black',
              'fill-opacity': feature.opacity || 1
            };
            appendElementWithAttributes(container, 'circle', circleAttributes);
          }

          if (feature.type === 'poly') {
            const polyAttributes = {
              'stroke': feature["stroke-color"] || 'black',
              'stroke-opacity': feature.opacity || 1,
              'stroke-width': feature["stroke-width"] || 1,
              'fill': feature.color || 'black',
              'fill-opacity': feature.opacity || 1
            };
            appendElementWithAttributes(container, 'polygon', polyAttributes);
          }

          if (feature.type === 'dssp') {
            const shapeToDraw = dsspShape(feature.code);

            if (shapeToDraw == "sheet") {
              const bSheetAttributes = {
                'stroke': d3.color(feature.color || 'white')!.darker(.5).formatHex(),
                'stroke-width': 2,
                'fill': feature.color || 'white',
                'fill-opacity': feature.opacity || 0.5
              };
              appendElementWithAttributes(container, 'polygon', bSheetAttributes);
            }

            if (shapeToDraw == "coil") {
              const sw = Math.min(16, Math.max(3, (trace.options?.['content-size'] || settings['content-size']) / 8));
              const coilAttributes = {
                'stroke': feature.color || 'black',
                'stroke-opacity': feature.opacity || .5,
                'stroke-width': sw,
                'stroke-linecap': 'square',
                'stroke-dasharray': `${sw}, ${sw * 1.5}`,
                'fill': 'none',
              };
              appendElementWithAttributes(container, 'path', coilAttributes);
            }
          }
        })
      // On: feature group removal
      featureGroup.exit().remove();
    });
  }

  public updateTraces(): void {
    const scale = this.initializeService.scale;
    const settings = this.initializeService.settings;
    const coilPoints = this.coilPoints;
    const charWidth = this['char.width'];

    // Loop through each trace
    this['group.traces'].each(function (trace) {
      // Select all trace groups
      const traceGroups = d3.select<d3.BaseType, InternalTraces>(this);
      // Select all feature groups
      const featureGroups = traceGroups.selectAll<d3.BaseType, Feature>('g.feature');
      // Loop through each feature group
      featureGroups.each(function (feature, featureIdx: number) {
        const {featureStart, featureEnd} = getStartEndPositions(feature);

        const currentDomainStart = scale.x.domain()[0];
        const currentDomainEnd = scale.x.domain()[1];

        // Calculate the starting point relative to the current domain (the shown part of the sequence)
        const startPoint = Math.max(featureStart, currentDomainStart);
        const endPoint = Math.min(featureEnd, currentDomainEnd);
        // If end is less than start, then the feature is not visible, so we skip it
        if (endPoint < startPoint) {
          if (alreadyExitedFromView.has(feature)) {
            // The feature was already not visible before and its position has already been updated outside the view
            return;
          } else {
            // The feature is not visible anymore, but we need to update its position to be outside the view
            alreadyExitedFromView.add(feature);
          }
        }
        // The feature is now visible, so we remove it from the set of features that are outside the view
        alreadyExitedFromView.delete(feature);

        // Get line height, content size
        const mt = scale.y('' + trace.id);
        const lh = trace.options?.['line-height'] || settings['line-height'];
        const cs = trace.options?.['content-size'] || settings['content-size'];
        const center = mt + lh / 2;
        const bottom = center + cs / 2;
        let top = center - cs / 2;

        function rescaleY(yValue: number): number {
          // top and bottom are actually switched, as the y-axis is inverted
          return bottom + (yValue - trace.domain.min) / (trace.domain.max - trace.domain.min) * (top - bottom);
        }

        function randomBetween(min: number, max: number): number {
          return Math.random() * (max - min) + min;
        }

        if (feature.type === 'locus') {
          // Define cell width
          const cw = scale.x(1) - scale.x(0);
          const featureWidth = scale.x(feature.end + .5) - scale.x(feature.start);

          if (feature.height) {
            top = top + (cs - feature.height) / 2;
          }
          // Select all rectangles (and bound data)
          d3.select<d3.BaseType, Locus>(this)
            .selectAll<d3.BaseType, Locus>('rect')
            // Set position
            .attr('x', (locus) => scale.x(locus.start - 0.5))
            .attr('y', top)
            // Set size
            .attr('height', feature.height !== undefined ? feature.height : cs)
            .attr('width', (locus) => {
              // Compute width
              return cw * (locus.end - locus.start + 1);
            })

          // If the feature is wide enough we can add the label of the feature as text inside of it
          if (feature.label) {
            const labelWidth = charWidth * feature.label.length;
            d3.select<d3.BaseType, Locus>(this)
              .selectAll<d3.BaseType, Locus>('text')
              .attr("x", scale.x(feature.start - 0.5) + 4)
              .attr('y', center)
              .attr("opacity", labelWidth + 8 < featureWidth ? 1 : 0)
          }
        }

        if (feature.type === 'continuous') {
          // Get values for feature
          const values = feature.values;
          // Initialize horizontal, vertical values
          const xy: [number, number][] = values.map((v: number, i: number) => [i + 1, v]);

          let line: d3.Line<[number, number]> | d3.Area<[number, number]>;

          let curveType: d3.CurveFactory = d3.curveStep;

          // If curveType is defined, then use it
          if (feature.curveType) {
            curveType = d3[feature.curveType];
          }

          // If showArea is true, then the line should be an area
          if (feature.showArea) {
            line = d3.area<[number, number]>().curve(curveType)
              .x(([x,]) => scale.x(x))
              .y1(([, y]) => rescaleY(y))
              .y0(bottom);
          } else {
            line = d3.line<[number, number]>().curve(curveType)
              .x(([x,]) => scale.x(x))
              .y(([, y]) => rescaleY(y));
          }

          // Update path line
          d3.select<d3.BaseType, Continuous>(this)
            .select('path')
            .attr('d', line(xy));
        }

        if (feature.type === 'pin') {
          // Select all circles (and bound data)
          d3.select<d3.BaseType, Pin>(this)
            .selectAll<d3.BaseType, Pin>('circle')
            // Set position
            .attr('cx', (pin) => scale.x(pin.position))
            .attr('cy', center)
            .attr('r', feature.radius || 8);
        }

        if (feature.type === 'poly') {
          // Given the position of the feature and the radius, we can calculate the points of the polygon
          // that will be drawn inscribed in a circle with center at the position of the feature and radius equal to the radius of the feature
          const sides = feature.sides || 3;
          const radius = feature.radius || 8;
          const angle = 2 * Math.PI / sides;
          // Calculate the points remembering that the polygon should not be stretched in the x-y axis, but it is always of size radius*2
          const points = Array.from({ length: sides }, (_, i) => {
            const x = radius * Math.cos(i * angle + Math.PI / 2 - Math.PI / sides);
            const y = radius * Math.sin(i * angle + Math.PI / 2 - Math.PI / sides);
            return [x + scale.x(feature.position), y + center];
          });
          d3.select<d3.BaseType, Pin>(this)
            .selectAll<d3.BaseType, Pin>('polygon')
            .attr('points', points.map(point => point.join(',')).join(' '));
        }

        if (feature.type === 'dssp') {
          const magicNumbers = {
            "helix": {"bitWidth": 0.25, "xScale": 0.5, "yScale": 0.119, "center": -4},
            "turn": {"bitWidth": 0.8, "xScale": 0.033, "yScale": 0.035, "center": +5.8},
            // Sheet is a special case as it is computed as a rectangle with a triangle on top at runtime
            "sheet": {"bitWidth": 4, "xScale": 0, "yScale": 0, "center": 0},
            "coil": {"bitWidth": 0.3, "xScale": 0, "yScale": 0, "center": 0},
          }

          const shapeToDraw = dsspShape(feature.code);
          const shapePath = DSSPPaths[shapeToDraw];

          const totalFeatureWidth = scale.x(endPoint) - scale.x(startPoint);
          const widthPerResidue = totalFeatureWidth / (endPoint - startPoint);

          // One helix every 100 points of width
          const bitWidth = cs * magicNumbers[shapeToDraw]["bitWidth"];
          const numBits = Math.floor(totalFeatureWidth / bitWidth + 1);
          const bitOccupancy = bitWidth / widthPerResidue;

          // Calculate the position in reverse order
          const xPositions = Array.from({length: numBits}, (_, i) => startPoint + i * bitOccupancy);

          if (xPositions.length < 2) {
            xPositions.push(endPoint);
          }

          const xScale = bitWidth * magicNumbers[shapeToDraw]["xScale"];
          const yScale = cs * magicNumbers[shapeToDraw]["yScale"];

          if (shapeToDraw == "helix" || shapeToDraw == "turn") {
            d3.select<d3.BaseType, DSSP>(this)
              .selectAll<d3.BaseType, number>('path')
              .data(xPositions)
              .join(
                enter => enter.append('path')
                  .attr("d", shapePath)
                  .attr("stroke", d3.color(feature.color || 'white')!.darker(0.5).formatHex())
                  .attr("stroke-width", shapeToDraw == "helix" ? 0.1 : 0.7)
                  .attr("fill", feature.color || 'black')
                  .attr("transform-origin", "center center"),
                update => update,
                exit => exit.remove()
              )
              .attr("fill-opacity", (_, i) => feature.opacity !== undefined ? (i % 2 == 0 ? feature.opacity - 0.2 : feature.opacity) : (i % 2 == 0 ? 0.5 : 0.7))
              .attr("transform", (xPosition, i) => {
                const flippedXScale = i % 2 == 0 ? xScale : -1 * xScale;
                return `translate(${scale.x(xPosition)}, ${center + magicNumbers[shapeToDraw]["center"]}) scale(${flippedXScale}, ${yScale})`
              });

            // Create a clip-path for each feature so to remove parts outside the range of the feature
            d3.select<d3.BaseType, DSSP>(this)
              .attr('clip-path', `url(#clip-path-${trace.id}-feature-${featureIdx})`)
              .selectAll(`#clip-path-${trace.id}-feature-${featureIdx}`)
              .data([feature])
              .join(
                enter => enter.append('defs')
                  .append('clipPath')
                  .attr('id', `clip-path-${trace.id}-feature-${featureIdx}`)
                  .append('rect')
                  .attr('width', totalFeatureWidth)
                  .attr('height', cs)
                  .attr('x', scale.x(startPoint))
                  .attr('y', top),
                update => update.select('rect')
                  .attr('width', totalFeatureWidth > 0 ? totalFeatureWidth : 0)
                  .attr('height', cs)
                  .attr('x', scale.x(startPoint))
                  .attr('y', top),
                exit => exit.remove()
              );
          }

          if (shapeToDraw == "sheet") {
            // In the case of the sheet, we just want to draw an arrow, where the body is a rectangle, and the head is a triangle
            const arrowWidth = cs / 2;
            const sheetWidth = totalFeatureWidth - arrowWidth;
            const sheetHeight = cs / 2;
            const sheetX = scale.x(startPoint);
            const sheetY = center - sheetHeight / 2;

            const arrowHeight = cs;
            const arrowX = scale.x(endPoint) - arrowWidth;
            const arrowY = center - arrowHeight / 2;

            // Define points for the polygon representing the arrow
            const points = [
              [sheetX, sheetY], // Top-left corner of the rectangle
              [sheetX + sheetWidth, sheetY], // Top-right corner of the rectangle
              [sheetX + sheetWidth, arrowY], // Transition from rectangle to arrowhead
              [arrowX + arrowWidth, arrowY + arrowHeight / 2], // Tip of the arrowhead
              [sheetX + sheetWidth, arrowY + arrowHeight], // Bottom of the arrowhead
              [sheetX + sheetWidth, sheetY + sheetHeight], // Bottom-right corner of the rectangle
              [sheetX, sheetY + sheetHeight], // Bottom-left corner of the rectangle
            ];

            // Join points into a string for the `points` attribute
            const pointsString = points.map(point => point.join(",")).join(" ");

            d3.select<d3.BaseType, DSSP>(this)
              .selectAll<d3.BaseType, number>('polygon')
              .attr("points", pointsString);
          }

          if (shapeToDraw == "coil") {
            const featureKey = `${trace.id}-feature-${featureIdx}`;

            if (!coilPoints.has(featureKey)) {
              coilPoints.set(featureKey, []);
            }

            const line = d3.line<[number, number]>().curve(d3.curveBasis)
              .x(([x,]) => scale.x(x))
              .y(([, y]) => rescaleY(y));

            d3.select<d3.BaseType, DSSP>(this)
              .selectAll<d3.BaseType, [number, number][]>('path')
              .attr("d", () => {
                const yValues = coilPoints.get(featureKey)!;
                const totalXPoints = xPositions.length + 1
                // If the number of points is less than the number of x positions, add random values at the end
                for (let i = yValues.length; i < totalXPoints; i++) {
                  const y = randomBetween(trace.domain.min, trace.domain.max);
                  // Put the value in the second to last position
                  yValues.splice(yValues.length - 1, 0, y);
                }
                // If the number of points is greater than the number of x positions, remove the last values
                for (let i = yValues.length - 1; i >= totalXPoints; i--) {
                  // Remove the value in the second to last position
                  yValues.splice(i, 1);
                }
                // The first and last points should be in the middle of the domain
                yValues[0] = (trace.domain.max + trace.domain.min) / 2;
                yValues[yValues.length - 1] = (trace.domain.max + trace.domain.min) / 2;

                // Update the current yValues to reuse them in the next iteration
                coilPoints.set(featureKey, yValues);

                // Create the xyPoints array
                const xyPoints: [number, number][] = xPositions.map((x, i) => [x, yValues[i]]);
                // Add last point to make it touch the middle of the domain
                xyPoints.push([endPoint, yValues[yValues.length - 1]]);

                return line(xyPoints)
              });
          }
        }
      });
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
        .attr('width', scale.x(selectionContext.range!.end) - scale.x(selectionContext.range!.start));
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
    this.traces$.next(this.featuresService.tracesNoNesting.filter(trace => trace.show));
  }
}


function getStartEndPositions(feature: Feature) {
  let featureStart, featureEnd;
  switch (feature.type) {
    case 'locus':
      featureStart = feature.start - 0.5;
      featureEnd = feature.end + 0.5;
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
  return {featureStart, featureEnd};
}

function selectFeature(feature: Feature, initializeService: InitializeService, event: MouseEvent, trace: InternalTrace, selectionEmitter$: EventEmitter<SelectionContext | undefined>) {
  let {featureStart, featureEnd} = getStartEndPositions(feature);

  const coordinates = initializeService.getCoordinates(event, trace.id);
  if (feature.type === 'continuous') {
    featureStart = coordinates[0] - 0.5;
    featureEnd = coordinates[0] + 0.5;
  }
  const selectionContext: SelectionContext = {
    trace,
    feature,
    range: {start: featureStart, end: featureEnd}
  }
  selectionEmitter$.next(selectionContext);
}
