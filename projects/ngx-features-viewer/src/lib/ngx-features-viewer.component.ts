import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
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
interface Feature<T> {
  // Unique identifier
  id?: number;
  // Define feature name
  name?: string;
  // Feature type
  type: string;
  // Define values
  values: T[];
}

interface Continuous extends Feature<number> {
  // Override type
  type: 'continuous';
}

type Locus = { start: number; end: number };

interface Loci extends Feature<Locus> {
  // Override type
  type: 'loci';
}

type Features = Array<Continuous | Loci>;

// TODO This should not be there
export const CINEMA = {
  'H': 'blue', 'K': 'blue', 'R': 'blue',  // Polar, positive
  'D': 'red', 'E': 'red',  // Polar, negative
  'S': 'green', 'T': 'green', 'N': 'green', 'Q': 'green',  // Polar, neutral
  'A': 'white', 'V': 'white', 'L': 'white', 'I': 'white', 'M': 'white',  // Non polar, aliphatic
  'F': 'magenta', 'W': 'magenta', 'Y': 'magenta',  // Non polar, aromatic
  'P': 'brown', 'G': 'brown',
  'C': 'yellow',
  'B': 'grey', 'Z': 'grey', 'X': 'grey', '-': 'grey',  // Special characters
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ngx-features-viewer',
  standalone: true,
  imports: [],
  template: `<div
    style="position: relative; width: 100%; height: 100%;"
    #root
  ></div>`,
  styleUrl: './ngx-features-viewer.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class NgxFeaturesViewerComponent implements AfterViewInit, OnDestroy {
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
  private readonly margin = { top: 24, right: 32, bottom: 24, left: 64 };

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
  public set features(features: Features) {
    this.features$.next(features);
  }

  private readonly features$ = new ReplaySubject<Features>(1);

  private update$: Observable<unknown>;

  private _update: Subscription;

  constructor() {
    // Define reference to svg
    let svg: d3.Selection<SVGSVGElement, undefined, null, undefined>;
    // Define initialization observable
    const svg$ = this.root$.pipe(
      // TODO Cast reference to HTML element
      map((root) => root.nativeElement as HTMLDivElement),
      // Attach SVG to HTML element
      map((root) => {
        // Define SVG element
        svg = d3
          .create('svg')
          .attr('height', this.height)
          .attr('width', this.width);
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
      // TODO Initialize horizontal, vertical axis
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
      // TODO Remove this
      tap((width) => console.log('Current width', width)),
    );
    // Handle sequence (x axis) initialization
    const sequence$ = this.sequence$.pipe(
      // Define current horizontal axis
      tap((sequence) => {
        // Compute domain
        const domain = [0, sequence.length + 1];
        // Compute range
        const range = [this.margin.left, this.width - this.margin.right -this.margin.right];
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
        let domain: string[], range: number[];
        // Define domain
        domain = features.map((_, i) => 'feature-' + i);
        domain = ['', 'sequence', ...domain, ''];
        // Compute range
        const n = features.length + 1;
        const c = (this.height - this.margin.bottom - this.margin.top) / n;
        range = domain.map((_, i) => this.margin.top + c * i + c / 2);
        range = [0, ...range, range[n - 1] + c / 2];
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
      ),
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
        const x = (d: string, i: number) =>  this.scale.x(i);
        const y = this.scale.y('sequence');
        // Define width, height of each cell
        const width = x('', 1) - x('', 0), height = 24;
        // Get range
        const range = this.scale.y.range();
        // Color residue according to code
        const color = (d: string) => CINEMA[d as never] || CINEMA.X;
        // TODO Apend background rectangles to SVG element
        svg
          .selectAll('rect.residue')
          .data(sequence)
          .join('rect')
          .attr('class', 'residue')
          .attr('x', (d, i) => x(d, i + 0.5))
          .attr('y', 0)
          .attr('width', () => width)
          .attr('height', range[range.length - 1])
          .attr('fill', d => color(d))
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
              .text(d => d);
      }),
      // Handle features change
      tap(({ features }) => {
        // Loop through each feature index
        for (let i = 0; i < features.length; i++) {
          // Define feature and its identifier
          const feature = { ...features[i], id: 'feature-' + i };
          // Handle loci features
          if (feature.type === 'loci') {
            // Define loci height
            const height = 24;
            // Define x, y scales
            const x = (d: number) => this.scale.x(d);
            const y = this.scale.y(feature.id) - height / 2;
            // Attach loci representation to SVG
            svg
              // Get currently rendered elements
              .selectAll(`foreignObject.locus.${feature.id}`)
              // Bind elements to data (loci)
              .data(feature.values)
              // generate div with given class and identifier
              // .join('rect')
              //   .attr('class', `locus ${feature.id}`)
              //   .attr('x', d => x(d.start - 0.5))
              //   .attr('y', y())
              //   .attr('width', d => x(d.end - d.start + 1.0 - 0.5))
              //   .attr('height', height)
              //   .attr('fill', 'teal');
              // Generate parent foreign object
              .join('foreignObject')
                .attr('class', `locus ${feature.id}`)
                .attr('x', d => x(d.start - 0.5))
                .attr('y', y)
                .attr('width', d => x(d.end + 1) - x(d.start))
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
                .text(d => `[${d.start}, ${d.end}]`);                  
          }
          // Handle continuous features
          if (feature.type === 'continuous') {
            // Define feature heigh
            const height = 128;
            // Extract feature identifier
            const { id: _id } = feature;
            // Compute minimum, maximum values
            const min = Math.min(...feature.values), max = Math.max(...feature.values);
            // Define horizontal, vertical scales
            const x = (d: number) => this.scale.x(d + 1);
            const y = (d: number) => this.scale.y(_id) - (d / (max - min) * height)
            // Define actual values to be represented
            // NOTE Must add initial and final zero values
            let values: Array<{ value: number, index: number }>;
            values = feature.values.map((value, index) => ({ value, index }));
            values = [{ value: 0, index: -0.5 }, ...values];
            values = [...values, { value: 0, index: feature.values.length - 0.5}]
            // Attach line representation to SVG
            svg
              // Generate path
              .append('path')
                .attr('id', feature.id)
              // Bind data
              .datum(values)
                .attr('fill', 'steelblue')
                .attr('fill-opacity', 0.3)
                .attr('stroke', 'steelblue')
                .attr('stroke-opacity', 1)
                .attr('stroke-width', 1.5)
                .attr('d', d3.line<{ value: number, index: number}>()
                  .curve(d3.curveMonotoneX) // Add interpolation
                  .x(d => x(d.index))
                  .y(d => y(d.value))
                );
            // // Attach marker representation to SVG
            // svg
            //   .append('g')
            //   .selectAll('dot')
            //   .data(values.slice(1, values.length - 1))
            //   .join('circle')
            //     .attr('cx', d => x(d.index))
            //     .attr('cy', d => y(d.value))
            //     .attr('r', 4)
            //     .attr('fill', 'steelblue');
          }
        }
      })
    );
    // Subscribe to update emission
    this._update = this.update$.subscribe();
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
}
