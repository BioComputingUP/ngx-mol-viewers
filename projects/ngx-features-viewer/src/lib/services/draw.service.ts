import { Observable, ReplaySubject, map, shareReplay, switchMap, tap } from 'rxjs';
import { Injectable } from '@angular/core';
// TODO Remove from there
import { Features } from '../ngx-features-viewer.component';
// Custom providers
import { InitializeService } from './initialize.service';
import { ResizeService } from './resize.service';
// Custom features
import Continuous from '../features/continuous';
import DSSP from '../features/dssp';
import Pins from '../features/pins';
import Loci from '../features/loci';
// D3 library
import * as d3 from 'd3';


export type Sequence = string[];

export type Feature = Continuous | Loci | DSSP | Pins;

type FeatureObject<F extends Feature> = d3.Selection<d3.BaseType, F['values'][number], null, undefined>;

// type SequenceGroup = d3.Selection<SVGGElement | d3.BaseType, Sequence, null, undefined>;

type ResidueGroup = d3.Selection<SVGGElement | d3.BaseType, string, SVGGElement | d3.BaseType, Sequence>;

type LabelGroup = d3.Selection<SVGGElement | d3.BaseType, Feature, SVGGElement | d3.BaseType, Feature[]>;

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

// Define function for extracting identifier out of unknown object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const identity = (f: unknown) => (f as { id: any }).id;

// Define function for extracting index out of unknown object
export const index = (f: unknown, i: number) => i;

function createLoci(group: d3.Selection<d3.BaseType | SVGGElement, unknown, null, undefined>, feature: Omit<Loci, 'type'> & Pick<Loci | Pins | DSSP, 'type'>) {
  // Generate foreign object(s)
  const foreignObject = group
    // Get currently rendered elements
    .selectAll(`foreignObject.${feature.type}`)
    // Bind elements to data (loci)
    .data(feature.values, index)
    // Generate parent foreign object
    .join('foreignObject')
    .attr('class', `${feature.type} ${feature.id}`);
  // Define foreground (border) color
  const color = feature.color || 'black';
  // Define background color, fall back to transparent eventually
  const background = feature.color || 'transparent';
  // Add background HTML div
  // NOTE This element has decrease opacity, just shows the background color.
  // NOTE It must be created before the foreground in ordeer to behave correctly
  foreignObject
    .selectAll('div.background')
    .data(d => [d], index)
    .join('xhtml:div')
    .attr('class', 'background')
    .style('background-color', background);
  // Add foreground HTML div
  // NOTE This element shows both border and text, hence has full opacity
  foreignObject
    .selectAll('div.foreground')
    .data(d => [d], index)
    .join('xhtml:div')
    .attr('class', 'foreground')
    .style('border-color', color);
  // .style('color', color);
  // Return foreign object
  return foreignObject;
}

// function updateLoci(group: d3.Selection<d3.BaseType | SVGGElement, unknown, null, undefined>, feature: Loci) {
//   // Generate foreign object(s)
//   const foreignObject = group
//     // Get currently rendered elements
//     .selectAll(`foreignObject.locus`)
//     // Bind elements to data (loci)
//     .data(feature.values, index)
//     // Generate parent foreign object
//     .join('foreignObject')
//     .attr('class', `locus ${feature.id}`);
//   // Define foreground (border) color
//   const color = feature.color || 'black';
//   // Define background color, fall back to transparent eventually
//   const background = feature.color || 'transparent';
//   // Define border radius
//   const radius = '.375rem';
//   // Update foreign object
//   foreignObject
//     // Add background HTML div
//     // NOTE This element has decrease opacity, just shows the background color.
//     // NOTE It must be created before the foreground in ordeer to behave correctly
//     .append('xhtml:div')
//     .attr('class', 'background')
//     .style('display', 'block')
//     .style('height', '100%')
//     .style('width', '100%')
//     .style('box-sizing', 'border-box')
//     .style('background-color', background)
//     .style('border-radius', radius)
//     .style('opacity', 0.3)
//     // Add foreground HTML div
//     // NOTE This element shows both border and text, hence has full opacity
//     .append('xhtml:div')
//     .attr('class', 'foreground')
//     .style('display', 'flex')
//     .style('align-items', 'center')
//     .style('justify-content', 'center')
//     .style('height', '100%')
//     .style('width', '100%')
//     .style('box-sizing', 'border-box')
//     .style('border-style', 'solid')
//     .style('border-radius', '.375rem')
//     .style('border-color', color)
//     .style('border-width', 2)
//     .style('background-color', 'transparent')
//     .style('opacity', 1);
//   // Return foreign object
//   return foreignObject;
// }

function createPins(group: d3.Selection<d3.BaseType | SVGGElement, unknown, null, undefined>, feature: Pins) {
  // Map pins to loci
  const loci = feature.values.map((pin) => ({ ...pin, end: pin.start }));
  // Generate loci
  const foreignObject = createLoci(group, { ...feature, values: loci });
  // Remove background
  foreignObject
    .select('div.background')
    .remove();
  // Substitute text with pin
  foreignObject
    .select('div.foreground')
    .html((d) => (d ? '<i class="bi bi-pin"></i>' : ''));
  // Return generated foreign object
  return foreignObject;
}

function createDSSP(group: d3.Selection<d3.BaseType | SVGGElement, unknown, null, undefined>, feature: DSSP) {
  // Generate loci
  const foreignObject = createLoci(group, { ...feature });
  // Remove background
  foreignObject
    .select('div.background')
    .remove();
  // Substitute text with pin
  foreignObject
    .select('div.foreground')
    .html((d: unknown) => {
      // Get DSSP locus
      const locus = d as DSSP['values'][number];
      // Get background color
      const background = locus.color || feature.color || 'black';
      // Handle helices
      if (locus.code === 'G' || locus.code === 'H' || locus.code === 'I') {
        return `<i class="dssp dssp-helix" style="background-color: ${background}"></i>`;
      }
      // Handle strands
      else if (locus.code === 'E' || locus.code === 'B') {
        return `<i class="dssp dssp-strand" style="background-color: ${background}"></i>`;
      }
      // Handle loops
      else if (locus.code === 'C' || locus.code === 'S' || locus.code === 'T') {
        return `<i class="dssp dssp-loop" style="background-color: ${background}"></i>`;
      }
      // Otherwise, let empty
      return '';
    });
  // Return generated foreign object
  return foreignObject;
}

// // TODO Define function for creating labels
// function createLabel() {}

@Injectable({
  providedIn: 'platform'
})
export class DrawService {

  public readonly features$ = new ReplaySubject<Feature[]>(1);

  public readonly sequence$ = new ReplaySubject<Sequence>(1);

  public get draw() {
    return this.initService.draw;
  }

  public get scale() {
    return this.initService.scale;
  }

  public get height() {
    return this.initService.height;
  }

  public get width() {
    return this.initService.width;
  }

  public get margin() {
    return this.initService.margin;
  }

  public residues!: ResidueGroup;

  public features!: FeatureGroup;

  public depth!: Map<Feature, number>;

  public children!: Map<Feature, Feature[]>;

  public values!: Map<Feature, ValuesGroup>;

  public labels!: LabelGroup;

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
    private initService: InitializeService,
    private resizeService: ResizeService,
  ) {
    // Define draw initialization
    this.draw$ = this.sequence$.pipe(
      // Update horizontal scale domain
      tap((sequence) => {
        // Get horizontal scale
        const { x } = this.scale;
        // Generate horizontal domain for sequence
        const domain = [0, sequence.length + 0.5];
        // Update horizontal scale
        x.domain(domain);
      }),
      // Draw sequence
      map((sequence) => {
        // Color residue according to code
        const color = (d: string) => CINEMA[d as never] || CINEMA.X;
        // Intiialize residues group
        const group = this.draw
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
      shareReplay(1),
      // Switch to features emission
      switchMap(() => this.features$),
      // Compute number of child features fore each parent feature
      tap((features) => {
        // Initialize children
        this.children = new Map();
        // Loop through each feature, define number of children
        features.forEach((feature) => {
          // Set children for current feature
          this.children.set(feature, this.children.get(feature) || []);
          // Get parent feature, if any
          if (feature.parent !== undefined) {
            // Get parent feature
            const parent = features[feature.parent];
            // Get children of current feature
            const children = this.children.get(parent) || [];
            // Update list of children
            children.push(feature);
            // Update childrens' map
            this.children.set(parent, children);
          }
        });
      }),
      // Compute depth of each feature
      tap((features) => {
        // Initialize empty map
        this.depth = new Map();
        // Execute until depth has been computed for all features
        while (this.depth.size < features.length) {
          // Loop through each feature
          features.forEach((feature) => {
            // Get depth for current feature
            let depth = this.depth.get(feature);
            // Skip feature if depth is already available
            if (depth === undefined) {
              // Case parent feature does not exist
              if (feature.parent === undefined) {
                // Then, set depth to 0
                this.depth.set(feature, 0);
              }
              // Otherwise, parent feature exists
              else {
                // Then, get parent feature
                const parent = features[feature.parent!];
                // Get depth fro parent feature
                depth = this.depth.get(parent);
                // Case depth for parent is available
                if (depth !== undefined) {
                  // Then, set updated depth according to parent's one
                  this.depth.set(feature, depth + 1);
                }
              }
            }
          });
        }
      }),
      // Cache result
      shareReplay(1),
      // Filter out inactive features
      map((features) => features.filter((feature) => {
        // Case parent identifier is defined
        if (feature.parent !== undefined) {
          // Then, get parent feeature
          const parent = features[feature.parent];
          // Check whether parent feature is active or not
          return parent.active === true;
        }
        // Otherwise, show feature
        return true;
      })),
      // Update vertical scale domain
      tap((features) => this.updateDomainY(features)),
      // Update vertical scale range
      tap((features) => this.updateRangeY(features)),
      // Draw labels, without setting position but saving references
      tap((features) => {
        // Define labels group
        const group = this.initService.svg
          // Select previous labels group
          .selectAll('g.labels')
          // Bind group to current features
          .data([features], index)
          // Create current labels group
          .join('g')
          .attr('class', 'labels');
        // Add labels to their group
        this.labels = group
          // Select previous labels (foreignObjects)
          .selectAll('g.label')
          // Bind label object to associated data
          .data<Feature>([{ id: 'sequence', active: false, parent: undefined }, ...features] as Features, identity)
          // Create current labels (foreignObject)
          .join('g')
          .attr('id', (d: Feature) => 'label-' + d.id!)
          .attr('class', (d: Feature) => `label ${d.active ? 'active' : ''}`);
        // Add parent foreignObject
        const parent = this.labels
          // Bind parent to foreign object
          .selectAll('foreignObject.parent')
          .data(d => [d], index)
          .join('foreignObject')
          .attr('class', 'parent');
        // Add content to parent foreign object
        parent
          .selectAll('div')
          .data(d => [d], index)
          .join('xhtml:div')
          // Add depth, children classes
          // NOTE This is required to make css aware of those properties 
          .attr('class', (d: Feature) => {
            // Get feature depth
            const depth = this.depth.get(d) || 0;
            // Get number of children
            const children = (this.children.get(d) || []).length;
            // Return classes string
            return `depth-${depth} children-${children}`;
          })
          // Add label HTML content
          .html((d: Feature) => {
            // Define feature identifier
            const _id = ('' + d.id === 'sequence') ? '' + d.id : 'feature ' + d.id;
            // Return HTML content
            return `<span>${_id} </span><i class="bi bi-caret-down-fill"></i>`;
          });
        // Add children group
        this.labels
          // Bind children to group
          .selectAll('g.children')
          .data(d => [d], index)
          .join('g')
          .attr('class', 'children');
        // Map labels to their feature identifier
        this.labels.each(function (feature) {
          // Get current label element
          const label = d3.select(this);
          // // TODO Remove this
          // console.log('Label', label);
          // Case current feature does have parent feature 
          if (feature.parent !== undefined) {
            // // Then detach label, as it needs to be appended to its parent group
            // label = label.remove();
            // Select parent node
            const parent = group.selectAll(`g.label#label-${feature.parent}`)!;
            // Get childreb container
            const children = parent.selectAll('g.children').node() as SVGGElement;
            // Select child node
            const child = label.node() as SVGForeignObjectElement;
            // Append child node to parent node
            children.appendChild(child);
          }
        });
      }),
      // Draw features, without setting position but saving references
      map((features: Features) => {
        // Initialize values map
        const values = this.values = new Map();
        // TODO Select parent according to 
        // Generate and store feature groups
        this.features = this.draw
          // Select previous groups
          .selectAll('g.feature')
          // Bind each feature group (SVG) to a feature instance
          .data(features, identity)
          // Create current groups
          .join('g')
          .attr('id', (d) => `feature-${d.id}`)
          .attr('class', 'feature');
        // For each feature group, generate feature representation
        this.features.each(function (feature) {
          // Define group
          const group = d3.select(this);
          // TODO Remove feature from 
          // TODO Handle continuous features
          if (feature.type === 'continuous') {
            // Initialize scatterplot representation
            const scatter = group
              // Find previous path
              .selectAll(`path.continuous`)
              // Bind to feature object
              .data([feature], identity)
              // Generate updated path
              .join('path')
              // Generate path
              .attr('class', 'continuous')
              .attr('fill', 'steelblue')
              .attr('fill-opacity', 0.3)
              .attr('stroke', 'steelblue')
              .attr('stroke-opacity', 1)
              .attr('stroke-width', 1.5);
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
            // Define locus container
            const foreignObject = createLoci(group, feature);
            // .style('background-color', color)
            // .style('opacity', 0.3);
            // Attach loci representation to SVG
            values.set(feature, foreignObject);
          }
          // Handle pins features
          else if (feature.type === 'pins') {
            // Store pin container
            values.set(feature, createPins(group, feature));
          }
          // TODO Handle DSSP features
          else if (feature.type === 'dssp') {
            // Define container for feature value (foreign object)
            const foreignObject = createDSSP(group, feature);
            // Attach loci representation to SVG
            values.set(feature, foreignObject);
          }
        });
      }),
      // Cache results
      // NOTE This is required to avoid re-drawing everything on each resize/zoom event
      shareReplay(1),
    );
    // Define draw update
    this.drawn$ = this.draw$.pipe(
      // Move sequence residues in correct position
      map(() => {
        // Get height, width, margins
        const margin = this.initService.margin;
        // const height = this.initService.height;
        // Get scale (x, y axis)
        const { x, y } = this.initService.scale!;
        // Define width, height of each cell
        const width = x(1) - x(0);
        // const height = y.range().at(-1)! - y.range().at(0)!;
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
          .select('foreignObject.name')
          .attr('x', (_, i) => x(i + 0.5))
          .attr('y', y('sequence') - (24 / 2))
          .attr('width', () => width)
          .attr('height', 24)
          // Style inner div
          .select('div')
          .style('display', 'flex')
          .style('justify-content', 'center')
          .style('align-content', 'center')
          .style('width', '100%')
          .style('height', '100%')
          // Hide if width is not sufficient
          .text((d) => width > (0.75 * REM) ? d : ' ');
      }),
      // Move grid in correct position
      map(() => {
        // Get vertical scale
        const y = this.scale.y;
        // Draw a line for each feature
        this.initService.grid.y
          .selectAll('line')
          .data(y.domain(), index)
          .join('line')
          // Set start, end positions
          .attr('x1', this.margin.left)
          .attr('x2', this.width - this.margin.right)
          .attr('y1', (d) => y(d))
          .attr('y2', (d) => y(d));
      }),
      // Move labels in correct position
      map(() => {
        // Get scale (x, y axis)
        const { y } = this.scale;
        // Get height, width, margins
        const margin = this.margin;
        // Define inner height (row)
        const inner = (y('sequence') - margin.top) * 2;
        // Update each label
        this.labels
          // Select all inner foreign objects
          .select('foreignObject.parent')
          // Update positions
          .attr('y', d => y((d.id + '' === 'sequence') ? ('' + d.id) : ('feature-' + d.id)) - inner / 2)
          .attr('x', 0)
          // Update sizes
          .attr('height', inner)
          .attr('width', margin.left);
      }),
      // Move feature values in correct position
      map(() => {
        // Get feature values
        const _values = this.values;
        // Get height map
        const _height = this.initService.height;
        // Get scale (x, y axis) and margin (top, bottom, left, right)
        const { x, y } = this.scale!;
        // Loop through each feature
        this.features.each(function (feature) {
          // Get feature values
          const values = _values.get(feature);
          // Ensure that values are defined
          if (!values) throw new Error(`Values are not defined for feature ${feature.id}`);
          // Then, update feature values according to feature type
          if (feature.type === 'continuous') {
            // Define feature height, using the height of the sequence feature (as it is the first one)
            const height = _height.get(`feature-${feature.id}`)! / 2;
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
            xy = [...xy, [n + 0.5, 0]];
            // Initialize line accoridng to current feature
            const line = d3.line<[number, number]>().curve(d3.curveMonotoneX)
              .x((d) => x(d[0]))
              .y((d) => y('feature-' + feature.id) - d[1] * height);
            // Update line in scatterplot
            scatter.attr('d', line(xy))
          }
          else if (feature.type === 'loci' || feature.type === 'dssp' || feature.type === 'pins') {
            // Define default locus height
            const height = 24;
            // Define vertical position
            const vertical = y('feature-' + feature.id) - height / 2;
            // Update foreign object
            const foreignObject = (values as FeatureObject<Loci>)
              // Update position
              .attr('x', (d) => x(d.start - 0.5))
              .attr('y', vertical)
              // Update size
              .attr('width', (d) => x(d.end + 1) - x(d.start))
              .attr('height', height);
            // Case feature is loci
            if (feature.type === 'loci') {
              // Then, check content size
              foreignObject
                // Update content according to size
                .select('div.foreground')
                .text((d) => (x(d.end + 1) - x(d.start)) > (REM * 2.5) ? `[${d.start}, ${d.end}]` : '');
            }
            // Case feature is pins
            else if (feature.type === 'pins') {
              // Update vertical positioning
              foreignObject
                .attr('y', vertical - height / 2);
            }
          }
        });
      }),
      // TODO Remove this
      tap(() => console.log('Re-drawn!')),
    );
  }

  public updateDomainY(features: Features): void {
    // Get vertical scale
    const { y } = this.scale;
    // // Get current axes
    // const axes = this.initService.axes;
    // Generate vertical domain for features
    const domain = features.map(({ id }) => 'feature-' + id);
    // Update vertical scale according to features and sequence
    y.domain(['sequence', ...domain]);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public updateRangeY(_features: Features): void {
    // Just call the same event called by resize event
    this.resizeService.updateRangeY();
  }
}
