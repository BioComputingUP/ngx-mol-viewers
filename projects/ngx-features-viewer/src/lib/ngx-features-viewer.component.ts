import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  Observable,
  ReplaySubject,
  Subscription,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  mergeWith,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import * as d3 from 'd3';

// TODO Define sequence type
type Sequence = Array<string>;

// TODO Define feature type
export interface Feature<T> {
  // Unique identifier
  id?: number;
  // Define feature name
  name?: string;
  // Feature type
  type: string;
  // Define values
  values: T[];
  // Define parent feature identifier
  parent?: number;
  // Whether feature is active (children are visible) or not (children not visible)
  active?: boolean;
}

export interface Continuous extends Feature<number> {
  // Override type
  type: 'continuous';
}

export type Locus = { start: number; end: number };

export interface Loci extends Feature<Locus> {
  // Override type
  type: 'loci';
}

export interface Pins extends Feature<boolean> {
  // Override type
  type: 'pins';
}

// Define interface for Secondary Structure features
// NOTE It uses DSSP values { helix: G/H/I, strand: E/B, loop: S/T/C, undefined: - }
export interface DSSP
  extends Feature<'G' | 'H' | 'I' | 'E' | 'B' | 'S' | 'T' | 'C' | '-'> {
  // Override type
  type: 'dssp';
}

export type Features = Array<Continuous | Loci | Pins | DSSP>;

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

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ngx-features-viewer',
  standalone: true,
  imports: [],
  template: `<div
    style="position: relative; display: block; width: 100%; height: 100%;"
    #root
  ></div>`,
  styleUrl: './ngx-features-viewer.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class NgxFeaturesViewerComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @ViewChild('root')
  public _root!: ElementRef;

  private get root() {
    return this._root;
  }

  private root$ = new ReplaySubject<ElementRef>(1);

  private get height() {
    // return (this._root.nativeElement as HTMLDivElement).clientHeight; // Does not include border height
    return (this.root.nativeElement as HTMLDivElement).offsetHeight; // Includes border height
  }

  private get width() {
    // return (this._root.nativeElement as HTMLDivElement).clientWidth; // Does not include border width
    return (this.root.nativeElement as HTMLDivElement).offsetWidth; // Includes border width
  }

  // Margins, clockwise [top, right, bottom, left]
  private readonly margin = { top: 24, right: 32, bottom: 24, left: 128 };

  // Scale (horizontal, vertical)
  private scale!: {
    x: d3.ScaleLinear<number, number>;
    y: d3.ScaleOrdinal<string, number>;
  };

  // Axis (horizontal, vertical)
  private axis!: {
    y: d3.Selection<SVGGElement, undefined, null, undefined>;
    x: d3.Selection<SVGGElement, undefined, null, undefined>;
  };

  // Grid (horizontal, vertical)
  private grid!: {
    x: d3.Selection<SVGGElement, undefined, null, undefined>;
    y: d3.Selection<SVGGElement, undefined, null, undefined>;
  };

  private readonly resize$ = new ReplaySubject<number>(1);

  @Input()
  public set sequence(sequence: Sequence) {
    this.sequence$.next(sequence);
  }

  private readonly sequence$ = new ReplaySubject<Sequence>(1);

  @Input()
  public features!: Features;

  private readonly features$ = new ReplaySubject<Features>(1);

  private update$: Observable<unknown>;

  private _update: Subscription;

  @Output()
  public readonly feature = new EventEmitter<Features[number]>();

  @Output()
  public readonly region = new EventEmitter<Sequence>();   // TODO Emit selected sequence region

  constructor() {
    // Define reference to svg
    let svg: d3.Selection<SVGSVGElement, undefined, null, undefined>;
    // Define initialization observable
    const svg$ = this.root$.pipe(
      // Cast reference to HTML element
      map((root) => root.nativeElement as HTMLDivElement),
      // Attach SVG to HTML element
      map((root) => {
        // Define SVG element
        svg = d3.create('svg');
          // .attr('height', this.height)
          // .attr('width', this.width);
        // Get SVG node
        const node = svg.node();
        // Case node exists
        if (node) {
          // Append node to root element
          root.append(node);
          // Then, return SVG element
          return svg;
        }
        // Otherwise, throw error
        throw new Error('Could not create SVG node');
      }),
      // // Initialize zoom event
      // tap((svg) => {
      //   // Define zoom behavior
      //   const zoom = d3.zoom<SVGSVGElement, unknown>()
      //     // Bind zoom event
      //     .on('zoom', function (event) { 
      //       // Apply transformation
      //       svg.attr('transform', event.transform);
      //     });
      //   // Append zoom behavior to SVG element
      //   svg.call(zoom as never);
      // }),
      // Initialize horizontal, vertical axis
      tap((svg) => {
        // Define horizontal axis
        const x = svg
          .append('g')
          .attr('class', 'x axis')
          .attr(
            'transform',
            `translate(0, ${this.height - this.margin.bottom})`
          );
        // Define vertical axis
        const y = svg
          .append('g')
          .attr('class', 'y axis')
          .attr('transform', `translate(${this.margin.left}, 0)`);
        // Initialize axis
        this.axis = { x, y };
      }),
      // Initialize horizontal, vertical grid
      tap((svg) => {
        // Define vertical grid (horizontal lines)
        const y = svg.append('g').attr('class', 'y axis-grid');
        // Initialize grid
        this.grid = {
          x: undefined as unknown as d3.Selection<
            SVGGElement,
            undefined,
            null,
            undefined
          >,
          y,
        };
      }),
      // Cache result
      shareReplay(1)
    );
    // Handle horizontal resize
    const resize$ = this.root$.pipe(
      // Set initial status
      map(() => this.width),
      // Merge with resize event, wait some time to avoid flooding
      mergeWith(this.resize$.pipe(debounceTime(40))),
      // Avoid emitting same value twice
      distinctUntilChanged(),
      // On resize, changes SVG size
      tap(() => svg.attr('width', this.width).attr('height', this.height)),
    );
    // Handle sequence (x axis) initialization
    const sequence$ = this.sequence$.pipe(
      // Define current horizontal axis
      tap((sequence) => {
        // Compute domain
        const domain = [0, sequence.length + 1];
        // Compute range
        const range = [
          this.margin.left,
          this.width - this.margin.right - this.margin.right,
        ];
        // Return updated horizontal axis
        this.scale = { ...this.scale, x: d3.scaleLinear(domain, range) };
      }),
      // Substitute current horizontal axis
      tap(() => this.axis.x.call(d3.axisBottom(this.scale.x)))
    );
    // Handle features (y axis) initialization
    const features$ = this.features$.pipe(
      // Define current horizontal axis
      tap((features) => {
        // Declare domain, range
        let domain: string[] = [], range: number[] = [];
        // Define domain
        features.forEach((feature) => {
          // Case feature parent feature is active
          if (feature.parent !== undefined) {
            // Then, add current feature to domain iff parent feature is active
            const parent = this.features[feature.parent];
            // Check whether parent feature is active
            if (parent.active === true) {
              // Then add current feature to domain, otherwise skip it
              domain.push(`feature-${feature.id}`);
            }
          }
          // Otherwise, add feature to domain anyway
          else domain.push(`feature-${feature.id}`);
        });
        // Update domain with initial and final values
        domain = ['', 'sequence', ...domain, ''];
        // Compute range
        const n = domain.length - 2;
        const c = (this.height - this.margin.bottom - this.margin.top) / n;
        range = domain.map((_, i) => this.margin.top + c * i + c / 2);
        range = [this.margin.top, ...range, range[n - 1] + c / 2];
        // Update vertical axis
        this.scale = { ...this.scale, y: d3.scaleOrdinal(domain, range) };
      }),
      // Substitute current vertical axis
      tap(() => this.axis.y.call(d3.axisLeft(this.scale.y))),
      // Substitute grid lines
      tap(() =>
        this.grid.y
          .selectAll('line') // Select grid lines
          .data(this.scale.y.domain()) // Bind grid lines to ticks
          .join('line') // Render grid lines
          .attr('x1', this.margin.left)
          .attr('x2', this.width - this.margin.right)
          .attr('y1', (d) => this.scale.y(d))
          .attr('y2', (d) => this.scale.y(d))
      )
    );
    // TODO Update SVG according to inputs
    this.update$ = svg$.pipe(
      // Subscribe to resize event
      switchMap(() => resize$),
      // Subscribe to both sequence and features retrieval
      switchMap(() => combineLatest([sequence$, features$])),
      map(([sequence, features]) => ({ sequence, features })),
      // Handle sequence change
      tap(({ sequence }) => {
        // Get horizontal, vertical position
        const x = (d: string, i: number) => this.scale.x(i);
        const y = this.scale.y('sequence');
        // Define width, height of each cell
        const width = x('', 1) - x('', 0),
          height = 24;
        // // Get range
        // const range = this.scale.y.range();
        // Color residue according to code
        const color = (d: string) => CINEMA[d as never] || CINEMA.X;
        // TODO Apend background rectangles to SVG element
        svg
          .selectAll('rect.residue')
          .data(sequence)
          .join('rect')
          .attr('class', 'residue')
          .attr('x', (d, i) => x(d, i + 0.5))
          .attr('y', this.margin.top)
          .attr('width', () => width)
          .attr('height', this.height - this.margin.top - this.margin.bottom)
          .attr('fill', (d) => color(d))
          .attr('fill-opacity', 0.1);
        // Append residues cells to SVG element
        svg
          // Get currently displayed elements
          .selectAll('foreignObject.residue')
          // Bind elements to data (loci)
          .data(sequence)
          // Generate text element for each residue
          .join('foreignObject')
          .attr('class', 'residue')
          .attr('x', (d, i) => x(d, i + 0.5))
          .attr('y', y - height / 2)
          .attr('width', () => width)
          .attr('height', height)
          .append('xhtml:div')
          .style('display', 'flex')
          .style('align-items', 'center')
          .style('justify-content', 'center')
          .style('height', '100%')
          .style('width', '100%')
          .style('box-sizing', 'border-box')
          // .style('border-radius', '.375rem')
          // .style('border', '1px solid black')
          // .style('background-color', d => color(d))
          // .style('background-opacity', 0.1)
          .style('color', 'black')
          .text((d) => d);
      }),
      // Feature labels
      tap(({ sequence, features }) => {
        // Get horizontal, vertical positioning
        const x = 0, y = this.scale.y;
        // TODO Define height, width
        const height = (this.height - this.margin.top - this.margin.bottom) / (features.length + 1);
        const width = this.margin.left;
        // Substitute SVG ticks with labels
        svg
          // Select previous ticks
          .selectAll('foreignObject.label')
          // Bind labels to sequence and features
          .data([{ ...sequence, id: 'sequence', active: false }, ...features.map((f) => ({ ...f, id: `feature-${f.id}` })) ])
          // Render labels as foreign object
          .join('foreignObject')
          // Set feature identifier
          .attr('id', (f) => f.id.replace('feature', 'label'))
          // TODO Define open/closed class
          .attr('class', d => {
            // Case current feature is actually the sequence
            if (d.id === 'sequence') return 'label sequence';
            // Case current feature is active
            else if (d.active === true) return 'label active';
            // Otherwise, return just label
            else return 'label';
          })
          .attr('y', (d) => y(d.id) - height / 2)
          .attr('x', x)
          .attr('height', height)
          .attr('width', width)
          // Append actual label
          .append('xhtml:div')
          .style('display', 'flex')
          .style('flex-shrink', 0)
          .style('flex-grow', 1)
          .style('justify-content', 'end')
          .style('align-items', 'center')
          .style('margin-right', '.5rem')
          .style('height', '100%')
          .style('box-sizing', 'border-box')
          .style('border', '1px solid black')
          // Define event on cick
          .on('click', (e, d) => this.onLabelClick(e, d))
          // Define html with caret
          .html(
            (d) => `<span>${d.id} <i class="bi bi-caret-down-fill"></i></span>`
          );
      }),
      // Handle features change
      tap(({ features }) => {
        // Generate features
        const groups = svg
          // For each feature, generate an SVG group
          .selectAll('g.feature')
          .data(features)
          .join('g')
          .attr('id', (d) => `feature-${d.id}`)
          .attr('class', 'feature');
        // Define reference to class
        const { scale } = this;
        // For each feature group, generate feature representation
        groups.each(function (_, i) {
          // Define group
          const svg = d3.select(this); 
          // Define feature and its identifier
          const feature = { ...features[i], id: 'feature-' + i };
          // Handle loci features
          if (feature.type === 'loci') {
            // Define loci height
            const height = 24;
            // Define x, y scales
            const x = (d: number) => scale.x(d);
            const y = scale.y(feature.id) - height / 2;
            // Attach loci representation to SVG
            svg
              // Get currently rendered elements
              .selectAll(`foreignObject.locus.${feature.id}`)
              // Bind elements to data (loci)
              .data(feature.values)
              // Generate parent foreign object
              .join('foreignObject')
              .attr('class', `locus ${feature.id}`)
              .attr('x', (d) => x(d.start - 0.5))
              .attr('y', y)
              .attr('width', (d) => x(d.end + 1) - x(d.start))
              .attr('height', height)
              // Generate child HTML div
              .append('xhtml:div')
              .style('display', 'flex')
              .style('align-items', 'center')
              .style('justify-content', 'center')
              .style('height', '100%')
              .style('width', '100%')
              .style('box-sizing', 'border-box')
              .style('border-radius', '.375rem')
              .style('border', '1px solid black')
              .text((d) => `[${d.start}, ${d.end}]`);
          }
          // Handle pins features
          else if (feature.type === 'pins') {
            // Define loci height
            const height = 24;
            // Define x, y scales
            const x = (d: number) => scale.x(d);
            const y = scale.y(feature.id) - height;
            // Attach loci representation to SVG
            svg
              // Get currently rendered elements
              .selectAll(`foreignObject.pin.${feature.id}`)
              // Bind elements to data (loci)
              .data(feature.values)
              // Generate parent foreign object
              .join('foreignObject')
              .attr('class', `pin ${feature.id}`)
              .attr('x', (_, i) => x(i + 0.5))
              .attr('y', y)
              .attr('width', (_, i) => x(i) - x(i - 1))
              .attr('height', height)
              // Generate child HTML div
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
          }
          // TODO Handle DSSP features
          else if (feature.type === 'dssp') {
            // Define loci height
            const height = 24;
            // Define x, y scales
            const x = (d: number) => scale.x(d);
            const y = scale.y(feature.id) - height / 2;
            // Attach loci representation to SVG
            svg
              // Get currently rendered elements
              .selectAll(`foreignObject.dssp.${feature.id}`)
              // Bind elements to data (loci)
              .data(feature.values)
              // Generate parent foreign object
              .join('foreignObject')
              .attr('class', `dssp ${feature.id}`)
              .attr('x', (_, i) => x(i + 0.5))
              .attr('y', y)
              .attr('width', (_, i) => x(i) - x(i - 1))
              .attr('height', height)
              // Generate child HTML div
              .append('xhtml:div')
              .style('display', 'flex')
              .style('align-items', 'center')
              .style('justify-content', 'center')
              .style('height', '100%')
              .style('width', '100%')
              .style('box-sizing', 'border-box')
              // .style('border-radius', '.375rem')
              // .style('border', '1px solid black')
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
          }
          // Handle continuous features
          else if (feature.type === 'continuous') {
            // Define feature heigh
            const height = 128;
            // Extract feature identifier
            const { id: _id } = feature;
            // Compute minimum, maximum values
            const min = Math.min(...feature.values),
              max = Math.max(...feature.values);
            // Define horizontal, vertical scales
            const x = (d: number) => scale.x(d + 1);
            const y = (d: number) => scale.y(_id) - (d / (max - min)) * height;
            // Define actual values to be represented
            // NOTE Must add initial and final zero values
            let values: Array<{ value: number; index: number }>;
            values = feature.values.map((value, index) => ({ value, index }));
            values = [{ value: 0, index: -0.5 }, ...values];
            values = [
              ...values,
              { value: 0, index: feature.values.length - 0.5 },
            ];
            // Generate line accoridng to current feature
            const line = d3
              .line<{ value: number; index: number }>()
              .curve(d3.curveMonotoneX) // Add interpolation
              .x((d) => x(d.index))
              .y((d) => y(d.value));
            // Attach line representation to SVG
            svg
              // Find previous path
              .selectAll(`path.continuous#${feature.id}`)
              // Bind to feature object
              .data([feature])
              // Generate updated path
              .join('path')
              // Generate path
              .attr('id', feature.id)
              .attr('class', 'continuous')
              .attr('fill', 'steelblue')
              .attr('fill-opacity', 0.3)
              .attr('stroke', 'steelblue')
              .attr('stroke-opacity', 1)
              .attr('stroke-width', 1.5)
              .attr('d', line(values));
            // Attach marker representation to SVG
            svg
              // Find previous dots
              .selectAll(`g.continuous#${feature.id}`)
              // Bind to feature object
              .data([feature])
              // Generate updated group of nodes
              .join('g')
              .attr('id', feature.id)
              .attr('class', 'continuous')
              // Select all inner dots
              .selectAll('circle.marker')
              // Bind to values object
              .data(values.slice(1, values.length - 1))
              // Render circle markers
              .join('circle')
              .attr('id', (d) => d.index)
              .attr('class', 'marker')
              .attr('cx', (d) => x(d.index))
              .attr('cy', (d) => y(d.value))
              .attr('r', 4)
              .attr('fill', 'steelblue');
          }
        });
      })
    );
    // Subscribe to update emission
    this._update = this.update$.subscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Case input features changed
    if (changes && changes['features']) {
      // Initialize input features
      this.features.forEach((feature) => {
        // Set feature as active
        feature.active = feature.active === undefined ? true : feature.active;
      });
      // Emit new features
      this.features$.next(this.features);
    }
  }

  ngAfterViewInit(): void {
    // Emit root element
    this.root$.next(this._root);
  }

  ngOnDestroy(): void {
    // Unsubscribe from update emission
    this._update.unsubscribe();
  }

  @HostListener('window:resize')
  onResize() {
    // Just emit width of container element
    this.resize$.next(this.width);
  }

  onLabelClick(event: MouseEvent, parent: { id?: string }) {
    // Get current parent identifier
    const _id = parseInt(parent.id!.replace(/^[^\d]+/, ''));
    // // Get label element
    // const label = event.target as HTMLDivElement;
    // Toggle active flag on current feature
    const feature = this.features[_id];
    // Invert current active sign
    feature.active = !feature.active;
    // Emit updated features
    this.features$.next([...this.features]);
    // Emit selected feature
    this.feature.emit(feature);
  }
}
