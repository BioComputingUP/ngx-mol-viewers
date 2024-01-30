import { Observable, ReplaySubject, map, shareReplay, tap } from 'rxjs';
import { ElementRef, Injectable } from '@angular/core';
import * as d3 from 'd3';

type SVG = d3.Selection<SVGSVGElement, undefined, null, undefined>;

type Group = d3.Selection<SVGGElement, undefined, null, undefined>;

type Rect = d3.Selection<SVGRectElement, undefined, null, undefined>;

type Zoom = d3.ZoomBehavior<SVGSVGElement, unknown>;

export interface Axes {
  y: Group;
  x: Group;
}

export interface Grid {
  x: Group;
  y: Group;
}

@Injectable({
  providedIn: 'root'
})
export class InitializeService {

  // Define emitter for root element
  public readonly initialize$ = new ReplaySubject<ElementRef>(1);

  // Define root element reference
  public root!: ElementRef;

  // Get referenced HTML div
  public get div() {
    return this.root.nativeElement as HTMLDivElement;
  }

  // Get main SVG element
  public svg!: SVG;

  // Define horizontal, vertical axis
  public axes!: Axes;

  // Define horizontal, vertical grid
  public grid!: Grid;

  // TODO Define graph content (everything drawed)
  public draw!: Group;

  // TODO Define clip rectangle
  public clip!: Rect;

  // Define rectangle for events binding
  public events!: Rect;

  // Define zoom callback
  public zoom!: Zoom;

  // Declare initialization pipeline
  public readonly initialized$: Observable<d3.Selection<SVGSVGElement, undefined, null, undefined>>;

  constructor() {
    // Define initialization pipeline
    this.initialized$ = this.initialize$.pipe(
      // Store root element reference
      tap((root) => this.root = root),
      // Generate SVG
      map(() => {
        // Define SVG element
        const svg = d3.create('svg');
        // Get SVG node
        const node = svg.node();
        // Case node exists, then append it to root element
        if (node) this.div.append(node);
        // Otherwise, throw error
        else throw new Error('Could not create SVG node');
        // Finally, return SVG element
        return svg;
      }),
      // Store SVG element
      tap((svg) => this.svg = svg),
      // GenerateSVG container (draw)
      tap((svg) => {
        // Define object storage in <defs> (definitions) tag
        const defs = svg.append('defs');
        // Define clip path: everything out of this area won't be drawn
        this.clip = defs.append('SVG:clipPath')
          // Set clip identifier, required in <defs>
          .attr('id', 'clip')
          // Add inner rectange
          .append('SVG:rect')
          // // Set dimensions
          // .attr('height', this.height - this.margin.top - this.margin.bottom)
          // .attr('width', this.width - this.margin.left - this.margin.right)
          // // Set positioning
          // .attr('x', this.margin.left)
          // .attr('y', this.margin.top);
        // Define features group
        this.draw = svg.append('g')
          // Bind features group to clip path
          .attr('class', 'features')
          .attr('clip-path', `url(#clip)`);
        // // Define zoom event
        this.zoom = d3.zoom<SVGSVGElement, unknown>();
        //   // Define zoom properties
        //   .scaleExtent([10, 1000])
        //   .extent([[0, 0], [this.width, this.height]])
        //   // Define zoom behavior
        //   .on('zoom', (event) => this.onFeaturesZoom(event));
        // Add an invisible rectangle on top of the chart.
        // This, can recover pointer events: it is necessary to understand when the user zoom.
        this.events = svg.append('rect')
          // // NOTE This rectangle must match visible one
          // .attr('height', this.height - this.margin.top - this.margin.bottom)
          // .attr('width', this.width - this.margin.left - this.margin.right)
          // Set style to appear invisible, but catch events
          .style('fill', 'none')
          .style('pointer-events', 'all')
          // // Set correct positioning
          // .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
          // Set zoom behavior
          .call(this.zoom as never);
      }),
      // Initialize horizontal, vertical axis
      tap((svg) => {
        // Define horizontal axis
        const x = svg.append('g').attr('class', 'x axis');
          // .attr(
          //   'transform',
          //   `translate(0, ${this.height - this.margin.bottom})`
          // );
        // Define vertical axis
        const y = svg.append('g').attr('class', 'y axis')
          // .attr('transform', `translate(${this.margin.left}, 0)`);
        // Initialize axis
        this.axes = { x, y };
      }),
      // Initialize horizontal, vertical grid
      tap((svg) => {
        // Define horizontal grid (vertical lines). This is not really defined.
        const x = undefined;
        // Define vertical grid (horizontal lines)
        const y = svg.append('g').attr('class', 'y axis-grid');
        // prettier-ignore
        this.grid = { x: x as never, y };
      }),
      // Avoid re-drawing the graph each time anothe observable subscribes
      shareReplay(1)
    );
  }
}
