import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  Observable,
  ReplaySubject,
  Subscription,
  map,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { Margin, ResizeService } from './services/resize.service';
import { InitializeService } from './services/initialize.service';
import { ZoomService } from './services/zoom.service';
import Continuous from './features/continuous';
import Loci from './features/loci';
import Pins from './features/pins';
import DSSP from './features/dssp';
import * as d3 from 'd3';

// TODO Define sequence type
type Sequence = Array<string>;

// Define type for allowed features
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
  template: `<div style="position: relative; display: block; width: 100%; height: 100%;" #root></div>`,
  styleUrl: './ngx-features-viewer.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class NgxFeaturesViewerComponent implements AfterViewInit, OnChanges, OnDestroy {

  @ViewChild('root')
  public _root!: ElementRef;

  // private get root() {
  //   return this._root;
  // }

  // private root$ = new ReplaySubject<ElementRef>(1);

  // private get height() {
  //   // return (this._root.nativeElement as HTMLDivElement).clientHeight; // Does not include border height
  //   return (this.root.nativeElement as HTMLDivElement).offsetHeight; // Includes border height
  // }

  // private get width() {
  //   // return (this._root.nativeElement as HTMLDivElement).clientWidth; // Does not include border width
  //   return (this.root.nativeElement as HTMLDivElement).offsetWidth; // Includes border width
  // }

  // Margins, clockwise [top, right, bottom, left]
  @Input()
  public set margin(margin: Margin) {
    // Just set inner margins
    this.resizeService.margin = margin;
  }

  public get margin() {
    return this.resizeService.margin;
  }

  public get height() {
    return this.resizeService.height;
  }

  public get width() {
    return this.resizeService.width;
  }

  public get axes() {
    return this.initService.axes;
  }

  public get grid() {
    return this.initService.grid;
  }

  // Return zoom behavior
  public get zoom() {
    return this.initService.zoom;
  }

  public get scale() {
    return this.zoomService.scale;
  }

  public get scaled() {
    return this.zoomService.scaled;
  }

  @Input()
  public sequence!: Sequence;

  private readonly sequence$ = new ReplaySubject<Sequence>(1);

  @Input()
  public features!: Features;

  private readonly features$ = new ReplaySubject<Features>(1);

  private update$: Observable<unknown>;

  private _update: Subscription;

  // @Output()
  // public readonly feature = new EventEmitter<Features[number]>();

  // @Output()
  // public readonly region = new EventEmitter<Sequence>();   // TODO Emit selected sequence region

  constructor(
    // Dependency injection
    public initService: InitializeService,
    public resizeService: ResizeService,
    public zoomService: ZoomService,
  ) {
    // TODO Remove this
    this.margin = { top: 24, right: 64, bottom: 24, left: 128 };
    // Handle sequence (x axis) initialization
    const sequence$ = this.sequence$.pipe(
      // Define current horizontal axis
      tap((sequence) => {
        // Compute domain
        const domain = [0, sequence.length + 1];
        // Define horizontal scale
        this.scale.x = this.scale.x.domain(domain);
      }),
      // Cache result
      shareReplay(1),
    );
    // Handle features (y axis) initialization
    const features$ = this.features$.pipe(
      // Define current horizontal axis
      tap((features) => {
        // Initialize domain
        let domain: string[] = [];
        // Valorize domain
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
        domain = ['', 'sequence', ...domain];
        // Update vertical axis
        this.scale.y.domain(domain);
      }),
      // Cache result
      shareReplay(1),
    );
    // Define resize pipeline
    const resized$ = this.resizeService.resized$.pipe(
      // Initialize zoom parameters
      tap(() => {
        // Get width, height
        const { width, height, margin } = this.resizeService;
        // Update extent (in pixel)
        this.zoom
          // .extent([[0, 0], [width - margin.left - margin.right, height - margin.top - margin.bottom]])
          .scaleExtent([1, 20])
          .translateExtent([[0, 0], [width - margin.left - margin.right, height - margin.top - margin.bottom]])
      }),
      // Update vertical axis range
      tap(() => {
        // Get vertical domain
        const domain = this.scale.y.domain();
        // Get height, margins
        const { height: outer, margin } = this.resizeService;
        // Define number of ticks: skip first and last
        const ticks = domain.length - 1;
        // Compute row size
        const inner = (outer - margin.top - margin.bottom) / ticks;
        // Define range
        let range: number[];
        // Set each domain accroging to inner height
        range = domain.map((_, i) => inner * (i + 0.5));
        // Add initial margin on top
        range = [0, ...range, outer - margin.bottom - margin.top];
        // Update range in scale object
        this.scale.y = this.scale.y.range(range);
      }),
      // Update horizontal axis range
      tap(() => {
        // // Get domain
        // const domain = this.scale.x.domain();
        // Get width, margins
        const { width: outer, margin } = this.resizeService;
        // Compute range
        const range = [margin.left, outer - margin.right];
        // Update range in scale object
        this.scale.x = this.scale.x.range(range);
      }),
      // Set vertical grid lines
      tap(() => {
        const { width, margin } = this.resizeService;
        // Get scale
        const scale = this.scale;
        // Update grid
        this.grid.y
          .selectAll('line') // Select grid lines
          .data(scale.y.domain()) // Bind grid lines to ticks
          .join('line') // Render grid lines
          .attr('x1', margin.left)
          .attr('x2', width - margin.right)
          .attr('y1', (d) => margin.top + scale.y(d))
          .attr('y2', (d) => margin.top + scale.y(d));
      }),
    );
    // Define zoom pipeline
    const zoomed$ = this.zoomService.zoomed$.pipe(
      // Get changed horizontal scale, unscaled vertical scale
      map((scaled) => ({ x: scaled.x, y: this.scale.y })),
      // Update vertical, horizontal axes
      tap((scaled) => {
        // Get height, margin out of resize service
        const { height, margin } = this.resizeService;
        // Set axis in correct position
        this.axes.y.attr('transform', `translate(${margin.left}, ${margin.top})`);
        // Update vertical axis
        this.axes.y.call(d3.axisLeft(scaled.y));
        // Set axis in correct position
        this.axes.x.attr('transform', `translate(0, ${height - margin.bottom})`);
        // Update horizontal axis
        this.axes.x.call(d3.axisBottom(scaled.x));
      }),
    );
    // TODO Update SVG according to inputs
    this.update$ = this.initService.initialized$.pipe(
      // Initialize zoom function
      tap(() => this.zoom.on('zoom', (event) => { this.onFeaturesZoom(event) })),
      // Update horizontal domain
      switchMap(() => sequence$),
      // Update vertical domain
      switchMap(() => features$),
      // Subscribe to resize event (set width, height)
      switchMap(() => resized$),
      // Subscribe to zoom event
      switchMap(() => zoomed$),
      // Filter out features whose parent is not active
      map(() => {
        // Filter out features
        const features = this.features.filter((child) => {
          // Case parent identifier is defined
          if (child.parent !== undefined) {
            // Then, get parent feeature
            const parent = this.features[child.parent];
            // Check whether parent feature is active or not
            return parent.active === true;
          }
          // Otherwise, show feature
          return true;
        });
        // Return both features and sequence
        return { sequence: this.sequence, features };
      }),
      // Draw sequence
      tap(({ sequence }) => {
        // Get root (zoomable) element
        const { draw: root } = this.initService;
        // Get horizontal, vertical position
        const x = (d: string, i: number) => this.scaled.x(i);
        const y = this.margin.top + this.scaled.y('sequence');
        // Define width, height of each cell
        const width = x('', 1) - x('', 0), height = 24;
        // // Get range
        // const range = this.scale.y.range();
        // Color residue according to code
        const color = (d: string) => CINEMA[d as never] || CINEMA.X;
        // TODO Apend background rectangles to SVG element
        root
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
        root
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
      // Draw labels
      tap(({ sequence, features }) => {
        // Get SVG insctance
        const { svg } = this.initService;
        // Get horizontal, vertical positioning
        const x = 0, y = (d: string) => this.margin.top + this.scaled.y(d);
        // TODO Define height, width
        const height = (this.height - this.margin.top - this.margin.bottom) / (features.length + 1);
        const width = this.margin.left;
        // Substitute SVG ticks with labels
        svg
          // Select previous ticks
          .selectAll('foreignObject.label')
          // Bind labels to sequence and features
          .data([{ ...sequence, id: 'sequence', active: false }, ...features.map((f) => ({ ...f, id: `feature-${f.id}` }))])
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
      // Draw features
      tap(({ features }) => {
        // Define SVG parent group
        // NOTE This inserts features into the clip path
        const { draw: root } = this.initService;
        // Generate features
        const groups = root
          // For each feature, generate an SVG group
          .selectAll('g.feature')
          .data(features)
          .join('g')
          .attr('id', (d) => `feature-${d.id}`)
          .attr('class', 'feature');
        // Get zoomable scale
        const scale = this.scaled, margin = this.margin;
        // Define feature height, using the height of the sequence feature (as it is the first one)
        const height = scale.y('sequence');
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
            const y = margin.top + scale.y(feature.id) - height / 2;
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
            const y = margin.top + scale.y(feature.id) - height;
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
            const y = margin.top + scale.y(feature.id) - height / 2;
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
            // Extract feature identifier
            const { id: _id } = feature;
            // Compute minimum, maximum values
            const min = Math.min(...feature.values),
              max = Math.max(...feature.values);
            // Define horizontal, vertical scales
            const x = (d: number) => scale.x(d + 1);
            const y = (d: number) => margin.top + scale.y(_id) - (d / (max - min)) * height;
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
              .attr('r', 1.75)
              .attr('fill', 'steelblue');
          }
        });
      })
    );
    // Subscribe to update emission
    this._update = this.update$.subscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Case input sequence changed
    if (changes && changes['sequence']) {
      // Emit sequence
      this.sequence$.next(this.sequence);
    }
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
    this.initService.initialize$.next(this._root);
  }

  ngOnDestroy(): void {
    // Unsubscribe from update emission
    this._update.unsubscribe();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    // Just emit width of container element
    this.resizeService.resize$.next(event);
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
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFeaturesZoom(event: any) {
    // Emit zoom event
    this.zoomService.zoom$.next(event);
  }
}
