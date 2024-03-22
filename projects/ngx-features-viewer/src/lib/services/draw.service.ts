import { Observable, ReplaySubject, map, shareReplay, switchMap, tap } from 'rxjs';
import { Injectable } from '@angular/core';
// Custom providers
import { InitializeService } from './initialize.service';
import { FeaturesService } from './features.service';
import { ResizeService } from './resize.service';
// Custom data types
import { Trace } from '../features/trace';
import { Feature } from '../features';
// D3 library
import * as d3 from 'd3';

export type Traces = (Trace<Feature> & { id: string | number | symbol, visible: boolean })[];

export type Sequence = string[];

// type FeatureObject<F extends Feature> = d3.Selection<d3.BaseType, F['values'][number], null, undefined>;

// type SequenceGroup = d3.Selection<SVGGElement | d3.BaseType, Sequence, null, undefined>;

type ResidueGroup = d3.Selection<SVGGElement | d3.BaseType, string, SVGGElement | d3.BaseType, Sequence>;

type LabelGroup = d3.Selection<SVGGElement | d3.BaseType, Traces[number], SVGGElement | d3.BaseType, Traces>;

type TraceGroup = d3.Selection<SVGGElement | d3.BaseType, Traces[number], SVGGElement, undefined>;

type GridLines = d3.Selection<SVGLineElement | SVGRectElement | d3.BaseType, Traces[number], SVGGElement | d3.BaseType, Traces>;

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

@Injectable({ providedIn: 'platform' })
export class DrawService {

  // public readonly features$ = new ReplaySubject<Feature[]>(1);

  public readonly traces$ = new ReplaySubject<Traces>(1);

  public readonly sequence$ = new ReplaySubject<Sequence>(1);

  // public get draw() {
  //   return this.initService.draw;
  // }

  // public get height() {
  //   return this.initService.height;
  // }

  // public get width() {
  //   return this.initService.width;
  // }

  public residues!: ResidueGroup;

  // public features!: FeatureGroup;

  // public depth!: Map<Feature, number>;

  public children!: Map<Feature, Feature[]>;

  // public values!: Map<Feature, ValuesGroup>;

  public labels!: LabelGroup;

  public traces!: TraceGroup;

  public grid!: GridLines;

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

  // public readonly label$ = new EventEmitter<Feature>();

  constructor(
    private initializeService: InitializeService,
    private featuresService: FeaturesService,
    private resizeService: ResizeService,
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
      // Cache result
      shareReplay(1),
      // Switch to traces emission
      switchMap(() => this.traces$),
      // Update vertical scale
      tap((traces) => this.updateScale(traces)),
      // Draw labels, without setting position but saving references
      // tap((traces) => {
      //   // Define labels group
      //   const group = this.initializeService.svg
      //     // Select previous labels group
      //     .selectAll('g.labels')
      //     // Bind group to current traces
      //     .data([traces], index)
      //     // Create current labels group
      //     .join('g')
      //     .attr('class', 'labels');
      //   // Add labels to their group
      //   this.labels = group
      //     // Select previous labels (foreignObjects)
      //     .selectAll('g.label')
      //     // Bind label object to associated data
      //     .data([{ ...this.initializeService.settings, id: 'sequence', visible: true }, ...traces] as Traces, identity)
      //     // Create current labels (foreignObject)
      //     .join('g')
      //     .attr('id', (d) => 'label-' + String(d.id))
      //     .attr('class', (d) => `label ${d.visible ? 'visible' : ''}`);
      //   // Add parent foreignObject
      //   const parent = this.labels
      //     // Bind parent to foreign object
      //     .selectAll('foreignObject.parent')
      //     .data(d => [d], index)
      //     .join('foreignObject')
      //     .attr('class', 'parent');
      //   // Add content to parent foreign object
      //   parent
      //     .selectAll('div')
      //     .data(d => [d], index)
      //     .join('xhtml:div')
      //     // Add depth, children classes
      //     // NOTE This is required to make css aware of those properties 
      //     .attr('class', (d: Feature) => {
      //       // Get feature depth
      //       const depth = this.depth.get(d) || 0;
      //       // Get number of children
      //       const children = (this.children.get(d) || []).length;
      //       // Return classes string
      //       return `depth-${depth} children-${children}`;
      //     })
      //     // Add label HTML content
      //     .html((d: Feature) => {
      //       // Define feature identifier
      //       const _id = ('' + d.id === 'sequence') ? 'Sequence' : 'feature ' + d.id;
      //       // Define label
      //       const label = d.label !== undefined ? d.label : _id; 
      //       // Return HTML content
      //       return `<span>${label} </span><i class="bi bi-caret-down-fill"></i>`;
      //     });
      //   // Add children group
      //   this.labels
      //     // Bind children to group
      //     .selectAll('g.children')
      //     .data(d => [d], index)
      //     .join('g')
      //     .attr('class', 'children');
      //   // Map labels to their feature identifier
      //   this.labels.each(function (feature) {
      //     // Get current label element
      //     const label = d3.select(this);
      //     // // TODO Remove this
      //     // console.log('Label', label);
      //     // Case current feature does have parent feature 
      //     if (feature.parent !== undefined) {
      //       // // Then detach label, as it needs to be appended to its parent group
      //       // label = label.remove();
      //       // Select parent node
      //       const parent = group.selectAll(`g.label#label-${feature.parent}`)!;
      //       // Get childreb container
      //       const children = parent.selectAll('g.children').node() as SVGGElement;
      //       // Select child node
      //       const child = label.node() as SVGForeignObjectElement;
      //       // Append child node to parent node
      //       children.appendChild(child);
      //     }
      //   });
      // }),
      tap((traces) => this.createLabels(traces)),
      // Draw grid, without setting position but saving references
      tap((traces) => this.createGrid(traces)),
      // Draw features, without setting position but saving references
      tap((traces) => this.createTraces(traces)),
      // map((features: Features) => {
      //   // Initialize values map
      //   const values = this.values = new Map();
      //   // TODO Select parent according to 
      //   // Generate and store feature groups
      //   this.features = this.draw
      //     // Select previous groups
      //     .selectAll('g.feature')
      //     // Bind each feature group (SVG) to a feature instance
      //     .data(features, identity)
      //     // Create current groups
      //     .join('g')
      //     .attr('id', (d) => `feature-${d.id}`)
      //     .attr('class', 'feature');
      //   // For each feature group, generate feature representation
      //   this.features.each(function (feature) {
      //     // Define group
      //     const group = d3.select(this);
      //     // TODO Remove feature from 
      //     // TODO Handle continuous features
      //     if (feature.type === 'continuous') {
      //       // Initialize scatterplot representation
      //       const scatter = group
      //         // Find previous path
      //         .selectAll(`path.continuous`)
      //         // Bind to feature object
      //         .data([feature], identity)
      //         // Generate updated path
      //         .join('path')
      //         // Generate path
      //         .attr('class', 'continuous')
      //         .attr('fill', 'steelblue')
      //         .attr('fill-opacity', 0.3)
      //         .attr('stroke', 'steelblue')
      //         .attr('stroke-opacity', 1)
      //         .attr('stroke-width', 1.5);
      //       // Store scatterplot
      //       values.set(feature, scatter);
      //     }
      //     // Handle loci features
      //     else if (feature.type === 'loci') {
      //       // Define locus container
      //       const foreignObject = createLoci(group, feature);
      //       // .style('background-color', color)
      //       // .style('opacity', 0.3);
      //       // Attach loci representation to SVG
      //       values.set(feature, foreignObject);
      //     }
      //     // Handle pins features
      //     else if (feature.type === 'pins') {
      //       // Store pin container
      //       values.set(feature, createPins(group, feature));
      //     }
      //     // TODO Handle DSSP features
      //     else if (feature.type === 'dssp') {
      //       // Define container for feature value (foreign object)
      //       const foreignObject = createDSSP(group, feature);
      //       // Attach loci representation to SVG
      //       values.set(feature, foreignObject);
      //     }
      //   });
      // }),
      // Cache results
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
      map(() => this.updateLabels()),
      // Move traces in correct position
      map(() => this.updateTraces()),
      // map(() => {
      //   // Get scale (x, y axis)
      //   const { y } = this.initializeService.scale;
      //   // Get height, width, margins
      //   const margin = this.initializeService.margin;
      //   // Define inner height (row)
      //   const inner = (y('sequence') - margin.top) * 2;
      //   // Update each label
      //   this.labels
      //     // Select all inner foreign objects
      //     .select('foreignObject.parent')
      //     // Update positions
      //     .attr('y', d => y((d.id + '' === 'sequence') ? ('' + d.id) : ('feature-' + d.id)) - inner / 2)
      //     .attr('x', 0)
      //     // Update sizes
      //     .attr('height', inner)
      //     .attr('width', margin.left);
      // }),
      // // Move feature values in correct position
      // map(() => {
      //   // Get feature values
      //   const _values = this.values;
      //   // Get height map
      //   const _height = this.initService.height;
      //   // Get scale (x, y axis) and margin (top, bottom, left, right)
      //   const { x, y } = this.scale!;
      //   // Loop through each feature
      //   this.features.each(function (feature) {
      //     // Get feature values
      //     const values = _values.get(feature);
      //     // Ensure that values are defined
      //     if (!values) throw new Error(`Values are not defined for feature ${feature.id}`);
      //     // Then, update feature values according to feature type
      //     if (feature.type === 'continuous') {
      //       // Define feature height, using the height of the sequence feature (as it is the first one)
      //       const height = _height.get(`feature-${feature.id}`)! / 2;
      //       // Get (scatterplot) from feature
      //       const scatter = values as FeatureObject<Continuous>;
      //       // Get number of values
      //       const n = feature.values.length;
      //       // Compute minimum, maximum values
      //       const min = feature.min !== undefined ? feature.min : Math.min(...feature.values);
      //       const max = feature.max !== undefined ? feature.max : Math.max(...feature.values);
      //       // Define actual values to be represented, scaled between 0 and 1
      //       // NOTE Must add initial and final zero values
      //       let xy: [number, number][];
      //       // Define first value
      //       xy = [[0.5, 0]];
      //       // Cast index, value to x, y coordinates
      //       xy = [...xy, ...feature.values.map((y, x) => [x + 1, (y - min) / (max - min)] as [number, number])];
      //       // Define last value
      //       xy = [...xy, [n + 0.5, 0]];
      //       // Initialize line accoridng to current feature
      //       const line = d3.line<[number, number]>().curve(d3.curveMonotoneX)
      //         .x((d) => x(d[0]))
      //         .y((d) => y('feature-' + feature.id) - d[1] * height);
      //       // Update line in scatterplot
      //       scatter.attr('d', line(xy))
      //     }
      //     else if (feature.type === 'loci' || feature.type === 'dssp' || feature.type === 'pins') {
      //       // Define default locus height
      //       const height = 24;
      //       // Define vertical position
      //       const vertical = y('feature-' + feature.id) - height / 2;
      //       // Update foreign object
      //       const foreignObject = (values as FeatureObject<Loci>)
      //         // Update position
      //         .attr('x', (d) => x(d.start - 0.5))
      //         .attr('y', vertical)
      //         // Update size
      //         .attr('width', (d) => x(d.end + 1) - x(d.start))
      //         .attr('height', height);
      //       // Case feature is loci
      //       if (feature.type === 'loci') {
      //         // Then, check content size
      //         foreignObject
      //           // Update content according to size
      //           .select('div.foreground')
      //           .text((d) => (x(d.end + 1) - x(d.start)) > (REM * 2.5) ? `[${d.start}, ${d.end}]` : '');
      //       }
      //       // Case feature is pins
      //       else if (feature.type === 'pins') {
      //         // Update vertical positioning
      //         foreignObject
      //           .attr('y', vertical - height / 2);
      //       }
      //     }
      //   });
      // }),
      // TODO Remove this
      tap(() => console.log('Re-drawn!')),
    );
  }

  // Update vertical scale
  public updateScale(traces: Traces): void {
    // Get current vertical scale
    const y = this.initializeService.scale.y;
    // Update domain
    const domain = ['sequence', ...traces.map(({ id }) => String(id))];
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
    this.residues = group
      // Select previous residue groups
      .selectAll('g.residue')
      // Bind residue one-letter-code to each group
      .data(sequence)
      // Generate group
      .join('g')
      .attr('id', (_, i) => `residue-${i + 1}`)
      .attr('class', 'residue');
    // Add background rectangle to each resdiue group
    this.residues
      .append('rect')
      .attr('class', 'color')
      .attr('fill', (d) => color(d))
      .attr('fill-opacity', 0.1);
    // Add text to each residue group
    this.residues
      .append('text')
      .attr('class', 'name')
      .text((d) => '' + d);
  }

  public updateSequence() {
    // Get line height
    const lh = this.initializeService.settings['line-height'];
    // Get height, width, margins
    const margin = this.initializeService.margin;
    // Get scale (x, y axis)
    const { x, y } = this.initializeService.scale;
    // Define width, height of each cell
    const width = x(1) - x(0);
    // Update size, position of residue background
    this.residues
      .select('rect.color')
      .attr('x', (_, i) => x(i + 0.5))
      .attr('y', margin.top)
      .attr('width', () => width)
      .attr('height', '100%');
    // Update size, position of residue names
    this.residues
      // Style outer foreignObject
      .select('text.name')
      .attr('x', (_, i) => x(i + 1))
      .attr('y', y('sequence') + lh / 2)
      .attr('width', () => width)
      .attr('height', lh)
      // Style positioning
      .attr('dominant-baseline', 'central')
      .style('text-anchor', 'middle')
    // // TODO Hide if width is not sufficient
    // .text((d) => width > (1 * REM) ? d : ' ');
  }

  public createLabels(traces: Traces): void {
    const settings = this.initializeService.settings;
    const { left: ml } = this.initializeService.margin;
    // Initialize labels SVG group
    const group = this.initializeService.svg
      // Select previous labels group
      .selectAll('g.labels')
      // Bind group to current traces
      .data([traces], index)
      // Create current labels group
      .join('g')
      .attr('class', 'labels');
    // Add labels to their group
    this.labels = group
      .selectAll('g.label')
      .data([{ id: 'sequence', label: 'Sequence', visible: true }, ...traces] as Traces, identity)
      .join('g')
      .attr('id', (d) => 'label-' + String(d.id))
      .attr('class', 'label');
    // Remove this
    this.labels
      .selectAll('rect')
      .data(d => [d], index)
      .join('rect')
      .attr('height', (d) => d['line-height'] || settings['line-height'])
      .attr('width', () => ml)
      .attr('fill', 'none')
      .attr('stroke', '#D3D3D380');
    // Add text to labels
    this.labels
      .selectAll('text')
      .data(d => [d], index)
      .join('text')
      .text((d) => (d.label || '') + ' ' + (d.visible ? '(visible)' : '(hidden)'))
      .attr('height', (d) => d['line-height'] || settings['line-height'])
      .attr('width', () => ml)
      // Filter out sequence
      .filter((trace) => trace.id !== 'sequence')
      // TODO Set click event
      .on('click', (_, trace) => {
        // Update flag for current trace
        trace.visible = trace.visible === false;
        // Get current traces
        const traces = Array.from(this.featuresService.traces.values());
        // Initialize excluded traces
        const excluded = new Array<Trace<Feature>>();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const trace of traces) {
          // Extract identifier, visibility id out of trace
          const { visible } = { visible: true, ...trace };
          // Case trace is not visible
          if (visible !== true) {
            // Then, get branch for current trace
            const branch = this.featuresService.getBranch(trace).slice(1);
            // Insert branch into excluded list
            excluded.push(...branch);
          }
        }
        // Filter out excluded features
        this.traces$.next(traces.filter((trace) => !excluded.includes(trace)) as Traces);

        // // Re-insert traces according to original list
        // const traces = Array.from(this.featuresService.traces.values());
        // Emit updated traces
        
      });
    // .attr('alignment-baseline', 'middle');
  }

  public updateLabels(): void {
    // Get vertical scale
    const y = this.initializeService.scale.y;
    const settings = this.initializeService.settings;
    // TODO Remove this
    this.labels
      // Select all inner foreign objects
      .select('rect')
      // Update positions
      .attr('y', trace => y(String(trace.id)))
      .attr('x', 0);
    // Update each label
    this.labels
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
      // .attr('y', d => y(String(d.id)))
      .attr('x', 0)
      // Set text alignment
      .attr('dominant-baseline', 'central');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createGrid(traces: Traces): void {
    // Define labels group
    const group = this.initializeService.svg
      // Create parent grid element
      .selectAll('g.grid')
      .data([traces], index)
      .join('g')
      .attr('class', 'grid');
    // Add labels to their group
    this.grid = group
      .selectAll('rect.grid-line')
      .data(traces, identity)
      .join('rect')
      .attr('id', (d) => 'grid-' + String(d.id))
      .attr('class', 'grid-line');
  }

  public updateGrid(): void {
    const y = this.initializeService.scale.y;
    const width = this.initializeService.width;
    const margin = this.initializeService.margin;
    const settings = this.initializeService.settings;
    // Draw a line for each feature
    this.grid
      // Set start, end positions
      .attr('x', margin.left)
      .attr('y', (trace) => {
        // Get first feature
        const feature = trace.values[0];
        // Compute offsets
        const mt = y(String(trace.id));
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
        const feature = trace.values[0];
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
      .attr('fill', '#D3D3D380');
  }

  public createTraces(traces: Traces): void {
    // // Generate and store traces groups
    this.traces = this.initializeService.draw
      .selectAll('g.trace')
      .data(traces, identity)
      .join('g')
      .attr('id', (t) => 'trace-' + String(t.id))
      .attr('class', 'trace');
    // For each feature group, generate feature representation
    this.traces.each(function (trace) {
      // Define features elements
      const groups = d3.select(this)
        .selectAll('g.feature')
        .data(trace.values, index)
        .join('g')
        .attr('class', 'feature');
      // Loop through each feature
      groups.each(function (feature) {
        // Get current feature element
        const group = d3.select(this);
        // Handle continuous features
        if (feature.type === 'continuous') {
          // Bind scatterplot
          group
            .selectAll('path.continuous')
            .data([feature], index)
            .join('path')
            // Generate path
            .attr('class', 'continuous')
            .attr('fill', 'pink')
            .attr('fill-opacity', 0)
            .attr('stroke', '#ff1493')
            .attr('stroke-opacity', 1)
            .attr('stroke-width', 2);
        }
        // Handle discrete features
        else {
          // Generate rectangles
          group
            .selectAll('rect.locus')
            .data(feature.values, index)
            // Generate rectangle
            .join('rect')
            .attr('class', 'locus')
            .attr('fill', 'steelblue')
            .attr('fill-opacity', 0.3)
            .attr('stroke', 'steelblue')
            .attr('stroke-opacity', 1)
            .attr('stroke-width', 1.5);
        }
      });
      // // TODO Remove feature from 
      // // TODO Handle continuous features
      // if (feature.type === 'continuous') {
      //   // Initialize scatterplot representation
      //   const scatter = group
      //     // Find previous path
      //     .selectAll(`path.continuous`)
      //     // Bind to feature object
      //     .data([feature], identity)
      //     // Generate updated path
      //     .join('path')
      //     // Generate path
      //     .attr('class', 'continuous')
      //     .attr('fill', 'steelblue')
      //     .attr('fill-opacity', 0.3)
      //     .attr('stroke', 'steelblue')
      //     .attr('stroke-opacity', 1)
      //     .attr('stroke-width', 1.5);
      //   // Store scatterplot
      //   values.set(feature, scatter);
      // }
      // // Handle loci features
      // else if (feature.type === 'loci') {
      //   // Define locus container
      //   const foreignObject = createLoci(group, feature);
      //   // .style('background-color', color)
      //   // .style('opacity', 0.3);
      //   // Attach loci representation to SVG
      //   values.set(feature, foreignObject);
      // }
      // // Handle pins features
      // else if (feature.type === 'pins') {
      //   // Store pin container
      //   values.set(feature, createPins(group, feature));
      // }
      // // TODO Handle DSSP features
      // else if (feature.type === 'dssp') {
      //   // Define container for feature value (foreign object)
      //   const foreignObject = createDSSP(group, feature);
      //   // Attach loci representation to SVG
      //   values.set(feature, foreignObject);
      // }
    });
  }

  public updateTraces(): void {
    const scale = this.initializeService.scale;
    const settings = this.initializeService.settings;
    // Loop through each trace
    this.traces.each(function (trace) {
      // Define features for current trace
      const features = trace.values;
      // Get feature groups
      const groups = d3.select(this).selectAll('g.feature');
      // Loop through each group
      groups.each(function (_, i) {
        // Get feature group
        const group = d3.select(this);
        // Get data bound to group (through index)
        const feature = features[i];
        // Get line height, content size
        const mt = scale.y(String(trace.id));
        const lh = feature['line-height'] || trace['line-height'] || settings['line-height'];
        const cs = feature['content-size'] || trace['content-size'] || settings['content-size'];
        // Handle continuous feature
        if (feature.type === 'continuous') {
          // Get values for feature
          const values = feature.values;
          // const n = values.length;
          // Difine minimum, maximum value
          const min = feature.min !== undefined ? feature.min : Math.min(...feature.values);
          const max = feature.max !== undefined ? feature.max : Math.max(...feature.values);
          // Initialize horizontal, vertical values
          const xy: [number, number][] = values.map((v, i) => [i + 1, 1 - (v - min) / (max - min)]);
          // // Add initial, final values
          // xy = [[0.5, 1.0], ...xy, [n + 1.0, 0]];
          // Get path
          const path = group.select('path.continuous');
          // Define line function
          const line = d3.line<[number, number]>().curve(d3.curveMonotoneX)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .x(([x, y]) => scale.x(x))
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .y(([x, y]) => mt + lh / 2 - cs / 2 + cs * y);
          // Update path
          path.attr('d', line(xy));
        }
        // Handle discrete feature
        else {
          // Define cell width
          const cw = scale.x(1) - scale.x(0);
          // Get rectangles
          group
            .selectAll('rect.locus')
            .data(feature.values, index)
            // Set position
            .attr('x', (locus) => scale.x(locus.start - 0.5))
            .attr('y', mt + lh / 2 - cs / 2)
            // Set size
            .attr('height', cs)
            .attr('width', (locus) => {
              // Define start, end position
              const { start, end } = { end: locus.start + 1, ...locus };
              // Compute width
              return cw * (end - start);
            });
        }
      });
    });
  }
}
