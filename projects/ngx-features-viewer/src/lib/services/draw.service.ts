import { Observable, ReplaySubject, map, shareReplay, switchMap, tap } from 'rxjs';
import { EventEmitter, Injectable } from '@angular/core';
// Custom providers
import { InitializeService } from './initialize.service';
import { ResizeService } from './resize.service';
import { ZoomService } from './zoom.service';
// Custom features
import Continuous from '../features/continuous';
import DSSP from '../features/dssp';
import Pins from '../features/pins';
import Loci from '../features/loci';
// D3 library
import * as d3 from 'd3';
import { Features } from '../ngx-features-viewer.component';

export type Sequence = string[];

export type Feature = Continuous | Loci | DSSP | Pins;

type FeatureObject<F extends Feature> = d3.Selection<d3.BaseType, F['values'][number], null, undefined>;

// type SequenceGroup = d3.Selection<SVGGElement | d3.BaseType, Sequence, null, undefined>;

type ResidueGroup = d3.Selection<SVGGElement | d3.BaseType, string, SVGGElement | d3.BaseType, Sequence>;

type LabelGroup = d3.Selection<SVGForeignObjectElement | d3.BaseType, Feature, SVGGElement | d3.BaseType, Feature[]>;

type FeatureGroup = d3.Selection<SVGGElement | d3.BaseType, Feature, SVGGElement, undefined>;

type ValuesGroup = d3.Selection<d3.BaseType, Feature['values'][number], SVGGElement | d3.BaseType, undefined>;

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

@Injectable({
  providedIn: 'root'
})
export class DrawService {

  public readonly features$ = new ReplaySubject<Feature[]>(1);

  public readonly sequence$ = new ReplaySubject<Sequence>(1);

  public get draw() {
    return this.initService.draw;
  }

  public residues!: ResidueGroup;

  public features!: FeatureGroup;

  public values!: Map<Feature, ValuesGroup>;

  public labels!: LabelGroup;

  /** Draw features
   * 
   * This pipeline initialize features within the drawable aread
   * of the main SVG container, defined by the `draw` property.
   */
  public readonly draw$: Observable<void>;

  public scale = this.zoomService.scaled;

  /** Update features
   * 
   * This pipeline moves previously initialized features within the
   * drawable area, according to given scale (the one produced 
   * after the zoom event took place)
   */
  public readonly drawn$: Observable<void>;

  // public readonly label$ = new EventEmitter<Feature>();

  constructor(
    private initService: InitializeService,
    private resizeService: ResizeService,
    private zoomService: ZoomService,
  ) {
    // Define draw initialization
    this.draw$ = this.sequence$.pipe(
      // Draw sequence
      map((sequence) => {
        // Color residue according to code
        const color = (d: string) => CINEMA[d as never] || CINEMA.X;
        // Intiialize residues group
        const group = this.draw
          // Select previous residues group
          .selectAll('g.sequence')
          // Bind residues group to sequence
          .data([sequence])
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
        // .text((d) => d);
        // Add residue one-letter-code to each residue group
        this.residues
          .append('foreignObject')
          .attr('class', 'name')
          // Append inner DIV
          .append('xhtml:div')
          .style('display', 'flex')
          .style('align-items', 'center')
          .style('justify-content', 'center')
          .style('height', '100%')
          .style('width', '100%')
          .style('box-sizing', 'border-box')
          .style('color', 'black');
      }),
      // Cache result
      shareReplay(),
      // Switch to features emission
      switchMap(() => this.features$),
      // Filter out inactive features
      map((features) => features.filter((child) => {
        // Case parent identifier is defined
        if (child.parent !== undefined) {
          // Then, get parent feeature
          const parent = features[child.parent];
          // Check whether parent feature is active or not
          return parent.active === true;
        }
        // Otherwise, show feature
        return true;
      })),
      // Draw labels, without setting position but saving references
      tap((features) => {
        // // Get SVG insctance
        // const { svg } = this.initService;
        // // Get horizontal, vertical positioning
        // const x = 0, y = (d: string) => this.margin.top + this.scaled.y(d);
        // // TODO Define height, width
        // const height = (this.height - this.margin.top - this.margin.bottom) / (features.length + 1);
        // const width = this.margin.left;
        // Define labels group
        const group = this.initService.svg
          // Select previous labels group
          .selectAll('g.labels')
          // Bind group to current features
          .data([features])
          // Create current labels group
          .join('g')
          .attr('class', 'labels');
        // Add labels to their group
        this.labels = group
          // Select previous labels (foreignObjects)
          .selectAll('foreignObject.label')
          // Bind label object to associated data
          .data([{ id: 'sequence', active: false }, ...features] as Features)
          // Create current labels (foreignObject)
          .join('foreignObject')
          .attr('id', d => 'label-' + d.id!)
          .attr('class', d => `label ${d.active ? 'active' : ''}`);
        // Append inner div to  each label
        this.labels.append('xhtml:div')
          // Append actual label
          .style('display', 'flex')
          .style('flex-shrink', 0)
          .style('flex-grow', 1)
          .style('justify-content', 'end')
          .style('align-items', 'center')
          .style('margin-right', '.5rem')
          .style('height', '100%')
          .style('box-sizing', 'border-box')
          .style('border', '1px solid black')
          // // Define event on cick
          // .on('click', (e, d) => this.onLabelClick(e, d))
          // Define html with caret
          .html((d) => {
            // Define feature identifier
            const _id = ('' + d.id === 'sequence') ? '' + d.id : 'feature ' + d.id;
            // Return HTML content
            return `<span>${_id} <i class="bi bi-caret-down-fill"></i></span>`;
          });
      }),
      // Draw features, without setting position but saving references
      map((features) => {
        // Initialize values map
        const values = this.values = new Map();
        // Generate and store feature groups
        this.features = this.draw
          // Select previous groups
          .selectAll('g.feature')
          // Bind each feature group (SVG) to a feature instance
          .data(features)
          // Create current groups
          .join('g')
          .attr('id', (d) => `feature-${d.id}`)
          .attr('class', 'feature');
        // // Get zoomable scale
        // const scale = this.scaled, margin = this.margin;
        // // Define feature height, using the height of the sequence feature (as it is the first one)
        // const height = scale.y('sequence');
        // For each feature group, generate feature representation
        this.features.each(function (feature) {
          // Define group
          const group = d3.select(this);
          // // Define feature and its identifier
          // const feature = { ...features[i], id: 'feature-' + i };
          // TODO Handle continuous features
          if (feature.type === 'continuous') {
            // Initialize scatterplot representation
            const scatter = group
              // Find previous path
              .selectAll(`path.continuous`)
              // Bind to feature object
              .data([feature])
              // Generate updated path
              .join('path')
              // Generate path
              .attr('class', 'continuous')
              .attr('fill', 'steelblue')
              .attr('fill-opacity', 0.3)
              .attr('stroke', 'steelblue')
              .attr('stroke-opacity', 1)
              .attr('stroke-width', 1.5)
            // .attr('d', line(xy));
            // Store scatterplot
            values.set(feature, scatter);
            // // Initialize markers representation
            // const markers = group
            //   // Find previous dots
            //   .selectAll(`g.continuous#${feature.id}`)
            //   // Bind to feature object
            //   .data([feature])
            //   // Generate updated group of nodes
            //   .join('g')
            //   .attr('id', 'feature.id)
            //   .attr('class', 'continuous')
            //   // Select all inner dots
            //   .selectAll('circle.marker')
            //   // Bind to values object
            //   .data(values.slice(1, values.length - 1))
            //   // Render circle markers
            //   .join('circle')
            //   .attr('id', (d) => d.index)
            //   .attr('class', 'marker')
            //   .attr('cx', (d) => x(d.index))
            //   .attr('cy', (d) => y(d.value))
            //   .attr('r', 1.75)
            //   .attr('fill', 'steelblue');
          }
          // Handle loci features
          else if (feature.type === 'loci') {
            // // Define loci height
            // const height = 24;
            // // Define x, y scales
            // const x = (d: number) => scale.x(d);
            // const y = margin.top + scale.y(feature.id) - height / 2;
            // Define locus container
            const foreignObject = group
              // Get currently rendered elements
              .selectAll(`foreignObject.locus`)
              // Bind elements to data (loci)
              .data(feature.values)
              // Generate parent foreign object
              .join('foreignObject')
              .attr('class', `locus ${feature.id}`)
            // .attr('x', (d) => x(d.start - 0.5))
            // .attr('y', y)
            // .attr('width', (d) => x(d.end + 1) - x(d.start))
            // .attr('height', height);
            // Define locus content
            foreignObject
              // Generate child HTML div
              .append('xhtml:div')
              .style('display', 'flex')
              .style('align-items', 'center')
              .style('justify-content', 'center')
              .style('height', '100%')
              .style('width', '100%')
              .style('box-sizing', 'border-box')
              .style('border-radius', '.375rem')
              .style('border', '1px solid black');
            // Attach loci representation to SVG
            values.set(feature, foreignObject);
          }
          // Handle pins features
          else if (feature.type === 'pins') {
            // // Define loci height
            // const height = 24;
            // // Define x, y scales
            // const x = (d: number) => scale.x(d);
            // const y = margin.top + scale.y(feature.id) - height;
            // Define pin container
            const foreignObject = group
              // Get currently rendered elements
              .selectAll(`foreignObject.pin`)
              // Bind elements to data (loci)
              .data(feature.values)
              // Generate parent foreign object
              .join('foreignObject')
              .attr('class', `pin ${feature.id}`);
            // Update pin content
            foreignObject
              .append('xhtml:div')
              .style('display', 'flex')
              .style('align-items', 'end')
              .style('justify-content', 'center')
              .style('height', '100%')
              .style('width', '100%')
              .style('box-sizing', 'border-box')
              // .style('border-radius', '.375rem')
              // .style('border', '1px solid black')
              .html((d) => (d ? '<i class="bi bi-pin"></i>' : ''));
            // Store pin container
            values.set(feature, foreignObject);
          }
          // TODO Handle DSSP features
          else if (feature.type === 'dssp') {
            // // Define loci height
            // const height = 24;
            // // Define x, y scales
            // const x = (d: number) => scale.x(d);
            // const y = margin.top + scale.y(feature.id) - height / 2;
            // Define container for feature value (foreign object)
            const foreignObject = group
              // Get currently rendered elements
              .selectAll(`foreignObject.dssp`)
              // Bind elements to data (loci)
              .data(feature.values)
              // Generate parent foreign object
              .join('foreignObject')
              .attr('class', `dssp ${feature.id}`);
            // Update content of feature value
            foreignObject
              .append('xhtml:div')
              .style('display', 'flex')
              .style('align-items', 'center')
              .style('justify-content', 'center')
              .style('height', '100%')
              .style('width', '100%')
              .style('box-sizing', 'border-box')
              .html((d, i) => {
                // Handle helices
                if (d === 'G' || d === 'H' || d === 'I')
                  return '<i class="dssp dssp-helix"></i>';
                // Handle strands
                else if (d === 'E' || d === 'B') {
                  // Get feature values
                  const { values } = feature;
                  // Define function for detecting strand
                  const strand = (d: unknown) => d === 'E' || d === 'B';
                  // Get previous, next DSSP item
                  const p = i > 0 ? values[i - 1] : undefined;
                  const n = i < values.length ? values[i + 1] : undefined;
                  // Case previous is not strand, then current is first
                  if (!strand(p))
                    return '<i class="dssp dssp-strand-start"></i>';
                  // Case next is not strand, then current is last
                  if (!strand(n)) return '<i class="dssp dssp-strand-end"></i>';
                  // Case next is not strand, then
                  return '<i class="dssp dssp-strand"></i>';
                }
                // Handle loops
                else if (d === 'C' || d === 'S' || d === 'T')
                  return '<i class="dssp dssp-loop"></i>';
                // Otherwise, let empty
                return '';
              });
            // Attach loci representation to SVG
            values.set(feature, foreignObject);
          }
        });
      }),
      // Cache result for multiple subscriptions
      shareReplay(1),
    );
    // Define draw update
    this.drawn$ = this.draw$.pipe(
      // Move sequence residues in correct position
      map(() => {
        // Get height, width, margins
        const margin = this.resizeService.margin;
        const height = this.resizeService.height;
        // Get scale (x, y axis)
        const { x, y } = this.zoomService.scaled;
        // Define width, height of each cell
        const width = x(1) - x(0);
        // Update size, position of residue background
        this.residues
          .select('rect.color')
          .attr('x', (_, i) => x(i + 0.5))
          .attr('y', margin.top)
          .attr('width', () => width)
          .attr('height', height - margin.top - margin.bottom);
        // Update size, position of residue names
        this.residues
          // Style outer foreignObject
          .select('foreignObject.name')
          .attr('x', (_, i) => x(i + 0.5))
          .attr('y', y('sequence') + 24 / 2)
          .attr('width', () => width)
          .attr('height', 24)
          // Style inner div
          .select('div')
          // Hide if width is not sufficient
          .text((d) => width > (0.75 * REM) ? d : ' ');
      }),
      // Move labels in correct position
      map(() => {
        // Get scale (x, y axis)
        const { y } = this.zoomService.scaled;
        // Get height, width, margins
        const margin = this.resizeService.margin;
        // Define outer height (SVG)
        const outer = this.resizeService.height;
        // Define inner height (row)
        const inner = (outer - margin.top - margin.bottom) / (y.domain().length - 1)
        // Update each label
        this.labels
          // Update positions
          .attr('y', d => margin.top + y((d.id + '' === 'sequence') ? ('' + d.id) : ('feature-' + d.id)) - inner / 2)
          .attr('x', 0)
          // Update sizes
          .attr('height', inner)
          .attr('width', margin.left)
      }),
      // Move feature values in correct position
      map(() => {
        // Get feature values
        const _values = this.values;
        // Get height, width, margins
        const margin = this.resizeService.margin;
        // Get scale (x, y axis)
        const { x, y } = this.zoomService.scaled;
        // Loop through each feature
        this.features.each((feature) => {
          // Get feature values
          const values = _values.get(feature);
          // Ensure that values are defined
          if (!values) throw new Error(`Values are not defined for feature ${feature.id}`);
          // Then, update feature values according to feature type
          if (feature.type === 'continuous') {
            // Define feature height, using the height of the sequence feature (as it is the first one)
            const height = y('sequence');
            // Get (scatterplot) from feature
            const scatter = values as FeatureObject<Continuous>;
            // Get number of values
            const n = feature.values.length;
            // Compute minimum, maximum values
            const min = feature.min !== undefined ? feature.min : Math.min(...feature.values);
            const max = feature.max !== undefined ? feature.max : Math.max(...feature.values);
            // Define actual values to be represented, scaled between 0 and 1
            // NOTE Must add initial and final zero values
            let xy: [number, number][];
            // Define first value
            xy = [[0.5, 0]];
            // Cast index, value to x, y coordinates
            xy = [...xy, ...feature.values.map((y, x) => [x + 1, (y - min) / (max - min)] as [number, number])];
            // Define last value
            xy = [...xy, [n - 0.5, 0]];
            // Initialize line accoridng to current feature
            const line = d3.line<[number, number]>().curve(d3.curveMonotoneX)
              .x((d) => x(d[0]))
              .y((d) => margin.top + y('feature-' + feature.id) - d[1] * height);
            // Update line in scatterplot
            scatter.attr('d', line(xy))
          }
          else if (feature.type === 'loci') {
            // Define default locus height
            const height = 24;
            // Update foreign object
            (values as FeatureObject<Loci>)
              // Update position
              .attr('x', (d) => x(d.start - 0.5))
              .attr('y', margin.top + y('feature-' + feature.id) - height / 2)
              // Update size
              .attr('width', (d) => x(d.end + 1) - x(d.start))
              .attr('height', height)
              // Update content according to size
              .select('div')
              .text((d) => (x(d.end + 1) - x(d.start)) > (REM * 2.5) ? `[${d.start}, ${d.end}]` : '');
          }
          else if (feature.type === 'pins') {
            // Define default pin height
            const height = 24;
            // Update foreign object
            (values as FeatureObject<Pins>)
              .attr('x', (_, i) => x(i + 0.5))
              .attr('y', () => margin.top + y('feature-' + feature.id) - height)
              .attr('width', (_, i) => x(i) - x(i - 1))
              .attr('height', height)
          }
          else if (feature.type === 'dssp') {
            // Dfeine default height of DSSP value
            const height = 24;
            // Update foreign object
            (values as FeatureObject<DSSP>)
              .attr('x', (_, i) => x(i + 0.5))
              .attr('y', () => margin.top + y('feature-' + feature.id) - height / 2)
              .attr('width', (_, i) => x(i) - x(i - 1))
              .attr('height', height)
          }
        });
      }),
    );
  }

  // // Define label click callback
  // private onLabelClick(event: MouseEvent, feature: Feature) {
  //   // Emit label selection event
  //   this.label$.emit(feature);
  // }
}
