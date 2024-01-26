import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { Observable, ReplaySubject, Subscription, map, shareReplay, switchMap, tap } from 'rxjs';
import * as d3 from 'd3';

// TODO Define sequence type
type Sequence = Array<string>;

// TODO Define feature type
interface Feature<T>{
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

type Locus = { start: number, end: number };

interface Loci extends Feature<Locus> {
  // Override type
  type: 'loci';
}

// TODO Define features type
type Features = Array<Continuous | Loci>;

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ngx-features-viewer',
  standalone: true,
  imports: [],
  template: `<div style="position: relative; width: 100%; height: 100%;" #root></div>`,
  styleUrl: './ngx-features-viewer.component.scss',
  encapsulation: ViewEncapsulation.None
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
    x: d3.ScaleLinear<number, number>,
    y: d3.ScaleOrdinal<string, number>,
  }

  // Axis (horizontal, vertical)
  private axis!: { 
    y: d3.Selection<SVGGElement, undefined, null, undefined>, 
    x: d3.Selection<SVGGElement, undefined, null, undefined>,
  };

  // Grid (horizontal, vertical)
  private grid!: {
    x: d3.Selection<SVGGElement, undefined, null, undefined>,
    y: d3.Selection<SVGGElement, undefined, null, undefined>,
  }

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
        svg = d3.create('svg')
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
        const x = svg.append('g')
          .attr('class', 'x axis')
          .attr('transform', `translate(0, ${this.height - this.margin.bottom})`);
        // Define vertical axis
        const y = svg.append('g')
          .attr('class', 'y axis')
          .attr('transform', `translate(${this.margin.left}, 0)`)
        // Initialize axis
        this.axis = { x, y };
      }),
      // Initialize horizontal, vertical grid
      tap((svg) => {
        // Define vertical grid (horizontal lines)
        const y = svg.append('g').attr('class', 'y axis-grid');
        // Initialize grid
        this.grid = {x: undefined as unknown as d3.Selection<SVGGElement, undefined, null, undefined>, y };
      }),
      // Cache result
      shareReplay(1),
    );
    // TODO Update SVG according to inputs
    this.update$ = svg$.pipe(
      // TODO Handle sequence change
      switchMap(() => this.sequence$.pipe(
        // Define current horizontal axis
        tap((sequence) => {
          // Compute domain
          const domain = [0.5, sequence.length + 1.5];
          // Compute range
          const range = [ this.margin.left, this.width - this.margin.right]
          // Return updated horizontal axis
          this.scale = { ...this.scale, x: d3.scaleLinear(domain, range) }
        }),
        // Generate axis
        map(() => d3.axisBottom(this.scale.x)),
        // Substitute current horizontal axis
        tap((axis) => this.axis.x.call(axis)),
      )),
      // TODO Handle features change
      switchMap(() => this.features$.pipe(
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
          range = domain.map((_, i) => this.margin.top + c * i + (c / 2));
          range = [0, ...range, range[n - 1] + (c / 2)];
          // range = [range[0] - (c / 2), ...range, range[n - 1] + (c / 2)];
          // Return updated vertical axis
          this.scale = { ...this.scale, y: d3.scaleOrdinal(domain, range) };
            // .domain([0, features.length])
            // .range([this.height - this.margin.bottom, this.margin.top]);
        }),
        // Substitute current vertical axis
        tap(() => this.axis.y.call(d3.axisLeft(this.scale.y))),
        // Substitute grid lines
        tap(() => this.grid.y
          .selectAll('line')  // Select grid lines
          .data(this.scale.y.domain())  // Bind grid lines to ticks
          .join('line')  // Render grid lines
          .attr('x1', this.margin.left)
          .attr('x2', this.width - this.margin.right)
          .attr('y1', d => this.scale.y(d))
          .attr('y2', d => this.scale.y(d))
        ),
        // Handle features
        tap((features) => {
          // Loop through each feature index
          for (let i = 0; i < features.length; i++) {
            // Define feature and its identifier
            const feature = { ...features[i], id: 'feature-' + i };
            // TODO Handle loci features
            if (feature.type === 'loci') {
              // Define loci height
              const height = 10;
              // Define x, y scales
              const x = (d: number) => this.scale.x(d);
              const y = () => this.scale.y(feature.id) - (height / 2);
              // Attach loci representation to SVG
              svg
                // Get currently displayed elements
                .selectAll(`rect.locus.${feature.id}`)
                // Bind elements to data (loci)
                .data(feature.values)
                // generate div with given class and identifier
                .join('rect')
                  .attr('class', `locus ${feature.id}`)
                  .attr('x', d => x(d.start - 0.5))
                  .attr('y', y())
                  .attr('width', d => x(d.end - d.start + 1.0 - 0.5))
                  .attr('height', height)
                  .attr('fill', 'teal');
            }
            // TODO Handle continuous features
          }
        }),
      )),
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
}
