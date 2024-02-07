import { Observable, ReplaySubject, map, shareReplay, tap } from 'rxjs';
import { ElementRef, Injectable } from '@angular/core';
import * as d3 from 'd3';

type SVG = d3.Selection<SVGSVGElement, undefined, null, undefined>;

type Group = d3.Selection<SVGGElement, undefined, null, undefined>;

type Rect = d3.Selection<SVGRectElement, undefined, null, undefined>;

type Zoom = d3.ZoomBehavior<SVGSVGElement, unknown>;

export interface Margin {
  // Define margins clockwise
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Scale {
  x: d3.ScaleLinear<number, number>,
  y: d3.ScaleOrdinal<string, number>
}

export interface Axes {
  y: Group;
  x: Group;
}

export interface Grid {
  x: Group;
  y: Group;
}

@Injectable({
  providedIn: 'platform',
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

  // get height() {
  //   // return (this._root.nativeElement as HTMLDivElement).clientHeight; // Does not include border height
  //   return this.div.offsetHeight; // Includes border height
  // }

  get width() {
    // return (this._root.nativeElement as HTMLDivElement).clientWidth; // Does not include border width
    return this.div.offsetWidth; // Includes border width
  }

  // Get main SVG element
  public svg!: SVG;

  // Define margin
  public margin!: Margin;

  // Define map between feature (identifier) and its height
  public height!: Map<string, number>;

  // Define horizontal, vertical scales
  public scale!: Scale;

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
      // Generate SVG container (draw)
      tap((svg) => {
        // Define object storage in <defs> (definitions) tag
        const defs = svg.append('defs');
        // Define clip path: everything out of this area won't be drawn
        this.clip = defs.append('SVG:clipPath')
          // Set clip identifier, required in <defs>
          .attr('id', 'clip')
          // Add inner rectange
          .append('SVG:rect')
        // Define features group
        this.draw = svg.append('g')
          // Bind features group to clip path
          .attr('class', 'features')
          .attr('clip-path', `url(#clip)`);
        // Define zoom event
        this.zoom = d3.zoom<SVGSVGElement, unknown>();
        // Add an invisible rectangle on top of the chart.
        // This, can recover pointer events: it is necessary to understand when the user zoom.
        this.events = svg.append('rect')
          // Set style to appear invisible, but catch events
          .style('fill', 'none')
          .style('pointer-events', 'all')
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
      // Initialize horizontal, vertical scale
      tap(() => this.scale = { x: d3.scaleLinear(), y: d3.scaleOrdinal() }),
      // Avoid re-drawing the graph each time anothe observable subscribes
      shareReplay(1)
    );
  }
}
