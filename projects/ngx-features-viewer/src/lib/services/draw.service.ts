import {map, Observable, ReplaySubject, shareReplay, switchMap, tap} from 'rxjs';
import {Injectable} from '@angular/core';
// // Custom components
// import { NgxFeaturesViewerLabelDirective } from '../ngx-features-viewer.directive';
// Custom providers
import {InitializeService} from './initialize.service';
import {FeaturesService} from './features.service';
// import { ResizeService } from './resize.service';
// Custom data types
import {Continuous} from '../features/continuous';
import {Loci, Locus} from '../features/loci'
import {Hierarchy} from '../hierarchy';
import {Feature} from '../features';
// D3 library
import * as d3 from 'd3';
import {NgxFeaturesViewerLabelDirective} from "@ngx-features-viewer";

export type Trace = Hierarchy[number] & { type: 'trace' }

export type Sequence = string[];

// type FeatureObject<F extends Feature> = d3.Selection<d3.BaseType, F['values'][number], null, undefined>;

// type SequenceGroup = d3.Selection<SVGGElement | d3.BaseType, Sequence, null, undefined>;

type ResidueGroup = d3.Selection<SVGGElement | d3.BaseType, string, SVGGElement | d3.BaseType, Sequence>;

type LabelGroup = d3.Selection<SVGGElement | d3.BaseType, Trace, SVGGElement | d3.BaseType, Trace[]>;

type TraceGroup = d3.Selection<SVGGElement | d3.BaseType, Trace, SVGGElement, undefined>;

type GridLines = d3.Selection<SVGLineElement | SVGRectElement | d3.BaseType, Trace, SVGGElement | d3.BaseType, Trace[]>;

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

// function createLoci(group: d3.Selection<d3.BaseType | SVGGElement, unknown, null, undefined>, feature: Omit<Loci, 'type'> & Pick<Loci | Pins | DSSP, 'type'>) {
//   // Generate foreign object(s)
//   const foreignObject = group
//     // Get currently rendered elements
//     .selectAll(`foreignObject.${feature.type}`)
//     // Bind elements to data (loci)
//     .data(feature.values, index)
//     // Generate parent foreign object
//     .join('foreignObject')
//     .attr('class', `${feature.type} ${feature.id}`);
//   // Define foreground (border) color
//   const color = feature.color || 'black';
//   // Define background color, fall back to transparent eventually
//   const background = feature.color || 'transparent';
//   // Add background HTML div
//   // NOTE This element has decrease opacity, just shows the background color.
//   // NOTE It must be created before the foreground in ordeer to behave correctly
//   foreignObject
//     .selectAll('div.background')
//     .data(d => [d], index)
//     .join('xhtml:div')
//     .attr('class', 'background')
//     .style('background-color', background);
//   // Add foreground HTML div
//   // NOTE This element shows both border and text, hence has full opacity
//   foreignObject
//     .selectAll('div.foreground')
//     .data(d => [d], index)
//     .join('xhtml:div')
//     .attr('class', 'foreground')
//     .style('border-color', color);
//   // .style('color', color);
//   // Return foreign object
//   return foreignObject;
// }

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// function createPins(group: d3.Selection<d3.BaseType | SVGGElement, unknown, null, undefined>, feature: Pins) {
//   // Map pins to loci
//   const loci = feature.values.map((pin) => ({ ...pin, end: pin.start }));
//   // Generate loci
//   const foreignObject = createLoci(group, { ...feature, values: loci });
//   // Remove background
//   foreignObject
//     .select('div.background')
//     .remove();
//   // Substitute text with pin
//   foreignObject
//     .select('div.foreground')
//     .html((d) => (d ? '<i class="bi bi-pin"></i>' : ''));
//   // Return generated foreign object
//   return foreignObject;
// }

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// function createDSSP(group: d3.Selection<d3.BaseType | SVGGElement, unknown, null, undefined>, feature: DSSP) {
//   // Generate loci
//   const foreignObject = createLoci(group, { ...feature });
//   // Remove background
//   foreignObject
//     .select('div.background')
//     .remove();
//   // Substitute text with pin
//   foreignObject
//     .select('div.foreground')
//     .html((d: unknown) => {
//       // Get DSSP locus
//       const locus = d as DSSP['values'][number];
//       // Get background color
//       const background = locus.color || feature.color || 'black';
//       // Handle helices
//       if (locus.code === 'G' || locus.code === 'H' || locus.code === 'I') {
//         return `<i class="dssp dssp-helix" style="background-color: ${background}"></i>`;
//       }
//       // Handle strands
//       else if (locus.code === 'E' || locus.code === 'B') {
//         return `<i class="dssp dssp-strand" style="background-color: ${background}"></i>`;
//       }
//       // Handle loops
//       else if (locus.code === 'C' || locus.code === 'S' || locus.code === 'T') {
//         return `<i class="dssp dssp-loop" style="background-color: ${background}"></i>`;
//       }
//       // Otherwise, let empty
//       return '';
//     });
//   // Return generated foreign object
//   return foreignObject;
// }

@Injectable({providedIn: 'platform'})
export class DrawService {

  // public readonly features$ = new ReplaySubject<Feature[]>(1);

  public readonly traces$ = new ReplaySubject<Trace[]>(1);

  public readonly sequence$ = new ReplaySubject<Sequence>(1);

  // public label?: NgxFeaturesViewerLabelDirective;

  // public children!: Map<Feature, Feature[]>;

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
    // private resizeService: ResizeService,
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
      // TODO Initialize tooltip
      tap(() => {
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
      }),
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
  public updateScale(traces: Trace[]): void {
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
        let lh = trace['line-height'] || this.initializeService.settings['line-height'];
        // Case positioning is set to dodge
        if (trace.position === 'dodge') {
          // Update line height to span for all the inner features
          lh = trace.values.reduce((lh, feature) => lh + (feature['line-height'] || this.initializeService.settings['line-height']), 0)
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

  // TODO Use sequence type
  public createSequence(sequence: string[]) {
    // Color residue according to code
    const color = (d: string) => CINEMA[d as never] || CINEMA.X;
    // Intiialize residues group
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
    // Add background rectangle to each resdiue group
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

  public createLabels(traces: Trace[]): void {
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
      .data([{id: 'sequence', label: 'Sequence', expanded: true}, ...traces] as Trace[], identity)
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
    this['group.labels'].each((trace: Trace) => {
      this.setLabelsPosition(trace);
    });
  }

  private setLabelsPosition(trace: Trace) {
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
        label.style.height = (trace['line-height'] || settings['line-height']) + 'px';
      }
    }
  }

  private hideLabels(trace: Trace) {
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

  public updateLabels(): void {
    // Get vertical scale
    const y = this.initializeService.scale.y;
    const settings = this.initializeService.settings;
    // TODO Remove this
    this['group.labels']
      // Select all inner foreign objects
      .select('rect')
      // Update positions
      .attr('y', trace => y(String(trace.id)))
      .attr('x', 0);
    // Update each label
    this['group.labels']
      // Select all inner foreign objects
      .select('text')
      // Update positions
      .attr('y', (trace) => {
        // Define offset, line height and content size
        const mt = y(String(trace.id));
        const lh = trace['line-height'] || settings['line-height'];
        // const cs = trace['content-size'] || settings['content-size'];
        // Compute text offset
        return mt + lh / 2;
      })
      // .attr('y', d => y(d.id))
      .attr('x', 0)
      // Set text alignment
      .attr('dominant-baseline', 'central')
      // Set text color
      .attr('fill', (d) => d['text-color'] || settings['text-color']);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createGrid(traces: Trace[]): void {
    // Define labels group
    const group = this.initializeService.svg
      // Create parent grid element
      .selectAll('g.grid')
      .data([traces], index)
      .join('g')
      .attr('class', 'grid')
      .lower();
    // Add labels to their group
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
        const feature = trace.values[trace.values.length - 1];
        // Compute offsets
        const mt = y('' + trace.id);
        const lh = feature['line-height'] || trace['line-height'] || settings['line-height'];
        const cs = feature['content-size'] || trace['content-size'] || settings['content-size'];
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
        // TODO
        const feature = trace.values[trace.values.length - 1];
        // Handle continuous feature
        if (feature.type === 'continuous') {
          // Get line height, content size
          // const lh = feature['line-height'] || trace['line-height'] || settings['line-height'];
          const cs = feature['content-size'] || trace['content-size'] || settings['content-size'];
          // Return content size
          return cs;
        }
        // Handle discrete features
        return 1;
      })
      // TODO Set custom color
      .attr('fill', this.initializeService.settings['grid-color']);
  }

  public createTraces(traces: Trace[]): void {
    // Retrieve settings
    const settings = this.initializeService.settings;
    // Define tooltip events
    const tooltip = this.tooltip;
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
      const tg = d3.select(this);
      // Define feature groups
      const fg = tg
        .selectAll<d3.BaseType, Feature>('g.feature')
        .data(trace.values);
      // On: feature griup enter
      fg.enter().append('g')
        .attr('class', (d) => 'feature ' + d.type)
        .attr('id', (_, i) => `trace-${trace.id}-feature-${i}`)
        .each(function (feature, i) {
          // NOTE `feature.values` is an array of objects `{ start, end, ... }`
          if (feature.type === 'loci') {
            // Iterate over each item in the feature.values array
            feature.values.forEach((value, j) => {
              // Define radius
              const r = (feature['content-size'] || trace['content-size'] || settings['content-size']) / 3;
              // Define a rectangle for each locus
              const rect = d3.select(this).append('rect')
                .attr('stroke', feature['trace-color'] || trace['trace-color'] || settings['trace-color'])
                .attr('stroke-opacity', 1.0)
                .attr('stroke-width', 1.0)
                .attr('fill', feature['trace-color'] || trace['trace-color'] || settings['trace-color'])
                .attr('fill-opacity', 0.5)
                .attr('rx', r)
                .attr('ry', r);
              // Associate data to rectangle
              rect.data([value]);
              // Add mouse events
              rect.on('mouseover', (event: MouseEvent) => onMouseOver(event, tooltip, trace, {
                ...feature,
                index: i
              }, j, value));
              rect.on('mousemove', (event: MouseEvent) => onMouseMove(event, tooltip, trace, {
                ...feature,
                index: i
              }, j, value));
              rect.on('mouseleave', (event: MouseEvent) => onMouseLeave(event, tooltip, trace, {
                ...feature,
                index: i
              }, j, value));

              // rect.on('click', function(d,i) {
              //     // handle events here
              //     // d - datum
              //     // i - identifier or index
              //     // this - the `<rect>` that was clicked
              //     console.log('clicked on', d, i, this);
              // });
            });
          }
          // Handle continuous feature
          // NOTE `feature.values` is an array of numbers (e.g. `[0.2, 2.56, -3.0, ...]`)
          if (feature.type === 'continuous') {
            // Define path for continuous feature
            const path = d3.select(this).append('path')
              .attr('stroke', feature['trace-color'] || trace['trace-color'] || settings['trace-color'])
              .attr('stroke-opacity', 1.0)
              .attr('stroke-width', 2.0)
              .attr('fill', 'none');
            // Associate data to path
            path.data([feature.values]);
          }
        });
      // On: feature grroup removal
      fg.exit().remove();
    });
  }

  public updateTraces(): void {
    // Define x, y scale
    const scale = this.initializeService.scale;
    // Retrieve settings
    const settings = this.initializeService.settings;
    // Loop thriugh each trace
    this['group.traces'].each(function (trace) {
      // Select all trace groups
      const tg = d3.select<d3.BaseType, Hierarchy[number]>(this);
      // Select all feature groups
      const fg = tg.selectAll<d3.BaseType, Feature>('g.feature');
      // Loop through each feature group
      fg.each(function (feature) {
        // Get line height, content size
        const mt = scale.y('' + trace.id);
        const lh = feature['line-height'] || trace['line-height'] || settings['line-height'];
        const cs = feature['line-height'] || trace['content-size'] || settings['content-size'];
        // TODO Case feature is loci
        if (feature.type === 'loci') {
          // Define cell width
          const cw = scale.x(1) - scale.x(0);
          // Select all rectangles (and bound data)
          d3.select<d3.BaseType, Loci>(this)
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
          // Difine minimum, maximum value
          const min = feature.min !== undefined ? feature.min : Math.min(...feature.values);
          const max = feature.max !== undefined ? feature.max : Math.max(...feature.values);
          // Initialize horizontal, vertical values
          const xy: [number, number][] = values.map((v, i) => [i + 1, 1 - (v - min) / (max - min)]);
          // Define line function
          const line = d3.line<[number, number]>().curve(d3.curveMonotoneX)
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

  // public updateTraces(): void {
  //   // Define x, y scale
  //   const scale = this.initializeService.scale;
  //   // Retrieve settings
  //   const settings = this.initializeService.settings;
  //   // Select traces .g groups
  //   const tg = this['group.traces'];
  //   // Loop through each trace
  //   tg.each(function (trace) {
  //     // Get features .g groups
  //     const fg = d3.select(this).selectAll<d3.BaseType, Feature>('g.feature');
  //     // Loop through each feature
  //     fg.each(function (feature) {
  //       // Get line height, content size
  //       const mt = scale.y('' + trace.id);
  //       const lh = feature['line-height'] || trace['line-height'] || settings['line-height'];
  //       const cs = feature['line-height'] || trace['content-size'] || settings['content-size'];
  //       // TODO Case feature is loci
  //       if (feature.type === 'loci') {
  //         // Define cell width
  //         const cw = scale.x(1) - scale.x(0);
  //         // Select all rectangles (and bound data)
  //         d3.select<d3.BaseType, Loci>(this)
  //           .selectAll<d3.BaseType, Locus>('rect')
  //           // Set position
  //           .attr('x', (locus) => scale.x(locus.start - 0.5))
  //           .attr('y', mt + lh / 2 - cs / 2)
  //           // Set size
  //           .attr('height', cs)
  //           .attr('width', (locus) => {
  //             // Compute width
  //             return cw * (locus.end - locus.start);
  //           })
  //       }
  //       // Case feature is continuous
  //       if (feature.type === 'continuous') {
  //         // Get values for feature
  //         const values = feature.values;
  //         // Difine minimum, maximum value
  //         const min = feature.min !== undefined ? feature.min : Math.min(...feature.values);
  //         const max = feature.max !== undefined ? feature.max : Math.max(...feature.values);
  //         // Initialize horizontal, vertical values
  //         const xy: [number, number][] = values.map((v, i) => [i + 1, 1 - (v - min) / (max - min)]);
  //         // Define line function
  //         const line = d3.line<[number, number]>().curve(d3.curveMonotoneX)
  //           .x(([x,]) => scale.x(x))
  //           .y(([, y]) => mt + lh / 2 - (cs - 2) / 2 + (cs - 2) * y);
  //         // Update path line
  //         d3.select<d3.BaseType, Continuous>(this)
  //           .select('path')
  //           .attr('d', line(xy));
  //       }
  //     });
  //   });
  // }

  public onLabelClick(trace: Trace): void {
    // Update flag for current trace
    trace.expanded = trace.expanded === false;
    // Get current traces
    const traces = Array.from(this.featuresService.traces.values());
    // Initialize excluded traces
    const excluded: Hierarchy = [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const trace of traces) {
      // Extract identifier, visibility id out of trace
      const {expanded} = {expanded: true, ...trace};
      // Case trace is not visible
      if (!expanded) {
        // Then, get branch for current trace
        const branch = this.featuresService.getBranch(trace).slice(1);
        // Insert branch into excluded list
        excluded.push(...branch);
      }
    }
    // Define included features
    const included = traces.filter((trace) => !excluded.includes(trace));
    // Emit current traces
    this.traces$.next(included);
  }

}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onMouseOver<F extends Feature & {
  index: number
}>(event: MouseEvent, tooltip: d3.Selection<HTMLDivElement, unknown, null, unknown>, trace: Trace, feature: F, index: number, value: F['values'][number]): void {
  // Set tooltip visible
  tooltip.style("display", "block");
  tooltip.style("opacity", 1);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onMouseMove<F extends Feature & {
  index: number
}>(event: MouseEvent, tooltip: d3.Selection<HTMLDivElement, unknown, null, unknown>, trace: Trace, feature: F, index: number, value: F['values'][number]): void {
  // Case feature is loci
  if (feature.type === 'loci') {
    // Set value as locus
    const locus = value as Locus;
    // Update tooltip content
    tooltip.html(
      `Trace: ${trace.id}<br>` +
      `Feature: ${feature.index}<br>` +
      `Index: ${index}<br>` +
      `Value: ${locus.start !== locus.end ? locus.start + '-' + locus.end : locus.start}`
    );
  }
  // Case feature is continuous
  if (feature.type === 'continuous') {
    // Update tooltip content
    tooltip.html(
      `Trace: ${trace.id}<br>` +
      `Feature: ${feature.index}<br>` +
      `Index: ${index}<br>` +
      `Value: ${(value as number)}`
    );
  }
  // Update tooltip position
  tooltip
    .style('left', (event.offsetX + 10) + 'px')
    .style('top', (event.offsetY + 10) + 'px');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onMouseLeave<F extends Feature & {
  index: number
}>(event: MouseEvent, tooltip: d3.Selection<HTMLDivElement, unknown, null, unknown>, trace: Trace, feature: F, index: number, value: F['values'][number]): void {
  // Set tooltip invisible
  tooltip.style("opacity", 0);
  tooltip.style("display", "none");
}
