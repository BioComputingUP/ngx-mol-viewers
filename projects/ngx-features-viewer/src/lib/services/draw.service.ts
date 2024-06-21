import {map, Observable, ReplaySubject, shareReplay, switchMap, tap} from 'rxjs';
import {Injectable} from '@angular/core';
import {InitializeService, Scale} from './initialize.service';
import {FeaturesService} from './features.service';
import {Continuous} from '../features/continuous';
import {Locus} from '../features/locus'
import * as d3 from 'd3';
import {InternalTrace, InternalTraces} from "../trace";
import {Feature} from "../features/feature";

export type Sequence = string[];

// type FeatureObject<F extends Feature> = d3.Selection<d3.BaseType, F['values'][number], null, undefined>;

// type SequenceGroup = d3.Selection<SVGGElement | d3.BaseType, Sequence, null, undefined>;

type ResidueGroup = d3.Selection<SVGGElement | d3.BaseType, string, SVGGElement | d3.BaseType, Sequence>;

type LabelGroup = d3.Selection<SVGGElement | d3.BaseType, InternalTrace, SVGGElement | d3.BaseType, InternalTraces>;

type TraceGroup = d3.Selection<SVGGElement | d3.BaseType, InternalTrace, SVGGElement, undefined>;

type GridLines = d3.Selection<SVGLineElement | SVGRectElement | d3.BaseType, InternalTrace, SVGGElement | d3.BaseType, InternalTraces>;

// type ValueGroup = d3.Selection<d3.BaseType, Feature['values'][number], SVGGElement | d3.BaseType, undefined>;

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

@Injectable({providedIn: 'platform'})
export class DrawService {
  public readonly traces$ = new ReplaySubject<InternalTraces>(1);

  public readonly sequence$ = new ReplaySubject<Sequence>(1);

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

  constructor(
    private initializeService: InitializeService,
    private featuresService: FeaturesService,
  ) {
    // Define draw initialization
    this.draw$ = this.sequence$.pipe(
      // Update horizontal scale domain
      tap((sequence) => {
        // Get horizontal scale
        const x = this.initializeService.scale.x;
        // Generate horizontal domain for sequence
        const domain = [0, sequence.length + 1];
        // Update horizontal scale
        x.domain(domain);
      }),
      // Draw sequence
      map((sequence) => this.createSequence(sequence)),
      // Initialize tooltip
      tap(() => this.initializeTooltip()),
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
      map(() => this.updateSequence()),
      // Move grid in correct position
      map(() => this.updateGrid()),
      // Move labels in correct position
      //map(() => this.updateLabels()),
      // Move traces in correct position
      map(() => this.updateTraces()),
    );
  }

  // Update vertical scale
  public updateScale(traces: InternalTraces): void {
    // Get current vertical scale
    const y = this.initializeService.scale.y;
    // Update domain
    const domain = ['sequence', ...traces.map(({id}) => id + '')];
    // Update range
    const range = domain.reduce((range: number[], id: string, i: number) => {
      // Handle sequence
      if (i === 0 && id === 'sequence') {
        // Get default line height, margin top
        const lh = this.initializeService.settings['line-height'];
        const mt = this.initializeService.settings['margin-top'];
        // Update range
        return [mt, mt + lh];
      }
      // Get current trace
      const trace = this.featuresService.getTrace(+id);
      // Case trace is defined
      if (trace) {
        // Get offset for current trace
        const mt = range.at(-1) as number;
        // Initialize line height for current trace
        let lh = trace.options?.['line-height'] || this.initializeService.settings['line-height'];
        // Case positioning is set to dodge
        if (trace.position === 'dodge') {
          // Update line height to span for all the inner features
          lh = trace.features.reduce((lh) => lh + (trace.options?.['line-height'] || this.initializeService.settings['line-height']), 0)
        }
        // Update range
        return [...range, mt + lh];
      }
      // Otherwise, throw error
      throw new Error('Trace not found');
    }, []);
    // Apply updates
    y.domain(domain).range(range);
  }

  private initializeTooltip() {
    // Get settings
    const settings = this.initializeService.settings;
    // Define border radius according to content size
    const r = settings['content-size'] / 3;
    // Append tooltip to SVG element
    this.tooltip = d3.select(this.initializeService.div).append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      // .style('width', '300px')
      // .style('height', '200px')
      .style('display', 'none')
      .style('opacity', 1)
      .style('color', 'black')
      .style('padding', '.25rem')
      .style('background-color', 'white')
      .style('border', 'solid')
      .style('border-width', '1px')
      .style('border-radius', r + 'px');
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
    // TODO Append background rectangles to SVG element
    this['group.residues'] = group
      // Select previous residue groups
      .selectAll('g.residue')
      // Bind residue one-letter-code to each group
      .data(sequence)
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
    let charWidth = 0.0
    // Add text to each residue group
    this['group.residues']
      .append('text')
      .attr('class', 'name')
      .text((d) => '' + d)
      // Loop through each text element
      .each(function () {
        // Update text width
        charWidth = Math.max(charWidth, this.getBBox().width);
      });
    // Updated stored character width
    this['char.width'] = charWidth;
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
      .attr('height', '100%');
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
    // .each(function() {
    //   // Get the width of the text element
    //   const textWidth = this.getBBox().width;
    //   // Get the width of the text element
    //   const elementWidth = d3.select(this).attr('width');
    //   // If the actual text width is greater than the element width, replace the text with nothing
    //   if (textWidth > elementWidth) {
    //     d3.select(this).text('');
    //   }
    // });
    // // TODO Hide if width is not sufficient
    // .text((d) => width > (1 * REM) ? d : ' ');
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

    // TODO: Convert the rect to a line, and create a line for each grid line point defined by the trace, and the zero-line if defined
    this['group.grid'] = group
      .selectAll('rect.grid-line')
      .data(traces, identity)
      .join('rect')
      .attr('id', (d) => 'grid-' + d.id)
      .attr('class', 'grid-line');
  }

  public updateGrid(): void {
    const y = this.initializeService.scale.y;
    const width = this.initializeService.width;
    const margin = this.initializeService.margin;
    const settings = this.initializeService.settings;
    // Draw a line for each feature
    this['group.grid']
      // Set start, end positions
      .attr('x', margin.left)
      .attr('y', (trace) => {
        // Get first feature
        const feature = trace.features[0];
        // Compute offsets
        const mt = y('' + trace.id);
        const lh = trace.options?.['line-height'] || settings['line-height'];
        const cs = Math.min(lh, trace.options?.['content-size'] || settings['content-size']);
        // Compute vertical position for discrete feature
        if (feature.type !== 'continuous') {
          return mt + lh / 2 - 0.5
        }
        // Compute vertical position for continuous feature
        return mt + lh / 2 - cs / 2;
      })
      // Set positions
      .attr('width', width - margin.left - margin.right)
      .attr('height', (trace) => {
        const feature = trace.features[0];
        // Handle continuous feature
        if (feature.type === 'continuous') {
          // Return content size
          return trace.options?.['content-size'] || settings['content-size'];
        }
        return trace.options?.["grid-line-width"] || 1;
      })
      .attr('fill', (trace) => {
        if (!trace.options?.["grid-line"]) {
          return 'none';
        }
        return trace.options?.['grid-line-color'] || settings['grid-line-color']
      });
  }

  public createTraces(traces: InternalTraces): void {
    // Define tooltip events
    const tooltip = this.tooltip;
    const scale = this.initializeService.scale;
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
        .each(function (feature) {
          if (feature.type === 'locus') {
            // Define a rectangle for each locus
            const rect = d3.select(this).append('rect')
              .attr('stroke', feature.color || 'black')
              .attr('stroke-opacity', 1.0)
              .attr('stroke-width', 1.0)
              .attr('fill', feature.color || 'white')
              .attr('fill-opacity', 0.5)
              .attr('rx', 8)
              .attr('ry', 8);
            // Associate data to rectangle
            rect.data([{start: feature.start, end: feature.end}]);
            // Add mouse events
            rect.on('mouseover', (event: MouseEvent) => onMouseOver(event, tooltip, trace, feature));
            rect.on('mousemove', (event: MouseEvent) => onMouseMove(event, tooltip, trace, feature));
            rect.on('mouseleave', (event: MouseEvent) => onMouseLeave(event, tooltip, trace, feature));

            // rect.on('click', function(d,i) {
            //     // handle events here
            //     // d - datum
            //     // i - identifier or index
            //     // this - the `<rect>` that was clicked
            //     console.log('clicked on', d, i, this);
            // });
          }
          if (feature.type === 'continuous') {
            // Define path for continuous feature
            const path = d3.select(this).append('path')
              .attr('stroke', feature.color || 'black')
              .attr('stroke-opacity', 1.0)
              .attr('stroke-width', 2.0)
              .attr('fill', 'none');

            path.on('mouseover', (event: MouseEvent) => onMouseOver(event, tooltip, trace, feature));
            path.on('mousemove', (event: MouseEvent) => onMouseMove(event, tooltip, trace, feature, scale));
            path.on('mouseleave', (event: MouseEvent) => onMouseLeave(event, tooltip, trace, feature));

            // Associate data to path
            path.data([feature.values]);
          }
        });
      // On: feature group removal
      featureGroup.exit().remove();
    });
  }

  public updateTraces(): void {
    // Define x, y scale
    const scale = this.initializeService.scale;
    // Retrieve settings
    const settings = this.initializeService.settings;
    // Loop through each trace
    this['group.traces'].each(function (trace) {
      // Select all trace groups
      const traceGroups = d3.select<d3.BaseType, InternalTraces>(this);
      // Select all feature groups
      const featureGroups = traceGroups.selectAll<d3.BaseType, Feature>('g.feature');
      // Loop through each feature group
      featureGroups.each(function (feature) {
        // Get line height, content size
        const mt = scale.y('' + trace.id);
        const lh = trace.options?.['line-height'] || settings['line-height'];
        let cs = trace.options?.['content-size'] || settings['content-size'];
        if (cs > lh) {
          console.warn(`Content size ${cs} is greater than line height ${lh} for trace ${trace.id}`);
          cs = lh;
        }
        // TODO Case feature is loci
        if (feature.type === 'locus') {
          // Define cell width
          const cw = scale.x(1) - scale.x(0);
          // Select all rectangles (and bound data)
          d3.select<d3.BaseType, Locus>(this)
            .selectAll<d3.BaseType, Locus>('rect')
            // Set position
            .attr('x', (locus) => scale.x(locus.start - 0.5))
            .attr('y', mt + lh / 2 - cs / 2)
            // Set size
            .attr('height', cs)
            .attr('width', (locus) => {
              // Compute width
              return cw * (locus.end - locus.start + 1);
            })
        }
        // Case feature is continuous
        if (feature.type === 'continuous') {
          // Get values for feature
          const values = feature.values;
          // Define minimum, maximum value
          const min = feature.min !== undefined ? feature.min : Math.min(...feature.values);
          const max = feature.max !== undefined ? feature.max : Math.max(...feature.values);
          // Initialize horizontal, vertical values
          const xy: [number, number][] = values.map((v, i) => [i + 1, 1 - (v - min) / (max - min)]);
          // Define line function
          const line = d3.line<[number, number]>().curve(d3.curveStep)
            .x(([x,]) => scale.x(x))
            .y(([, y]) => mt + lh / 2 - (cs - 2) / 2 + (cs - 2) * y);
          // Update path line
          d3.select<d3.BaseType, Continuous>(this)
            .select('path')
            .attr('d', line(xy));
        }
      });
    });
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onMouseOver(event: MouseEvent, tooltip: d3.Selection<HTMLDivElement, unknown, null, unknown>, trace: InternalTrace, feature: Feature): void {
  // Set tooltip visible
  tooltip.style("display", "block");
  tooltip.style("opacity", 1);
}

function onMouseMove(event: MouseEvent, tooltip: d3.Selection<HTMLDivElement, unknown, null, unknown>, trace: InternalTrace, feature: Feature, scale: Scale | undefined = undefined): void {
  if (feature.type == "locus") {

    // Set value as locus
    // Update tooltip content
    tooltip.html(
      `Trace: ${trace.id}<br>` +
      `${feature.label + '<br>' || ''}` +
      `Value: ${feature.start !== feature.end ? feature.start + '-' + feature.end : feature.start}`
    );
  }

  let tooltipX = event.offsetX + 10;
  let tooltipY = event.offsetY + 10;

  if (feature.type == "continuous") {
    let xScaled = scale!.x.invert(d3.pointer(event)[0]);
    // Round the number to the nearest integer
    xScaled = Math.round(xScaled);
    // Get the index of the residue
    const index = xScaled;
    // Get the value of the residue
    const value = feature.values[index - 1];
    // Update tooltip content
    tooltip.html(
      `Trace: ${trace.id}<br>` +
      `${feature.label + '<br>' || ''}` +
      `Index: ${index}<br>` +
      `Value: ${value}`
    );

    // The tooltip in this case needs to be placed on the index (x-axis) and value (y-axis) of the feature
    //tooltipX = scale!.x(index) + 10;
    //tooltipY = scale!.y(trace.id + '') + 10;
  }

  if (feature.type === 'locus') {
    // Set value as locus
    // Update tooltip content
    tooltip.html(
      `Trace: ${trace.id}<br>` +
      `${feature.label + '<br>' || ''}` +
      `Value: ${feature.start !== feature.end ? feature.start + '-' + feature.end : feature.start}`
    );
  }

  // Update tooltip position
  tooltip
    .style('left', tooltipX + 'px')
    .style('top', tooltipY + 'px');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onMouseLeave(event: MouseEvent, tooltip: d3.Selection<HTMLDivElement, unknown, null, unknown>, trace: InternalTrace, feature: Feature): void {
  // Set tooltip invisible
  tooltip.style("opacity", 0);
  tooltip.style("display", "none");
}
