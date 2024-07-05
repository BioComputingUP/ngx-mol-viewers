import { map, Observable, ReplaySubject, shareReplay, tap } from 'rxjs';
import { ElementRef, Injectable } from '@angular/core';
import { Settings } from '../settings';
import { v4 as UUID } from 'uuid';
import * as d3 from 'd3';
import { Feature } from "../features/feature";
import { Range } from "../features/locus";
import { Sequence } from '../sequence';
import { Trace } from "../trace";
import { NgxFeaturesViewerLabelDirective, NgxFeaturesViewerTooltipDirective } from "../ngx-features-viewer.component";

export interface SelectionContext {
  // Trace is available in both trace and feature context
  trace?: Trace;
  // Feature, index are available in feature context, but not in trace context
  feature?: Feature;
  // Define specific coordinates
  range?: Range;
}

type SVG = d3.Selection<SVGSVGElement, undefined, null, undefined>;

type Group = d3.Selection<SVGGElement, undefined, null, undefined>;

type Rect = d3.Selection<SVGRectElement, undefined, null, undefined>;

type RectShadow = d3.Selection<SVGRectElement, SelectionContext, null, undefined>;

export interface Scale {
  x: d3.ScaleLinear<number, number>,
  y: d3.ScaleOrdinal<string, number>
}

export interface Axes {
  y: Group;
  x: Group;
}

@Injectable({providedIn: 'platform'})
export class InitializeService {

  // Define emitter for root element
  public readonly initialize$ = new ReplaySubject<ElementRef>(1);

  // Define root element reference
  public root!: ElementRef;

  // Define reference to sequence, for late use
  // NOTE This avoids retrieving sequence from ReplaySubject
  public sequence!: Sequence;

  public focusMousedown!: ((this: SVGGElement, event: unknown, d: undefined) => void);

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

  // Get the start x domain position
  get x1() {
    return this.margin.left;
  }

  // Get the end x domain position
  get x2() {
    return this.width - this.margin.right;
  }

  // Get main SVG element
  public svg!: SVG;

  // Define settings
  public settings!: Settings;

  public get margin() {
    // Unpack settings
    const {'margin-top': top, 'margin-right': right, 'margin-bottom': bottom, 'margin-left': left,} = this.settings;
    // Return margins
    return {top, right, bottom, left};
  }

  public tooltip!: NgxFeaturesViewerTooltipDirective;

  public labelLeft!: NgxFeaturesViewerLabelDirective;

  public labelRight!: NgxFeaturesViewerLabelDirective;

  // Define horizontal, vertical scales
  public scale!: Scale;

  // Define horizontal, vertical axis
  public axes!: Axes;

  public draw!: Group;

  public clip!: Rect;

  // Define mask rectangle
  public mask!: Rect;

  // Define rectangle for events binding
  public events!: Rect;

  // Define rectangle for shadow effect
  public shadow!: RectShadow;

  // Define zoom callback
  public zoom!: d3.ZoomBehavior<SVGGElement, undefined>;

  public brush!: d3.BrushBehavior<undefined>;

  public brushRegion!: Group;

  public focus!: Group;

  // Declare initialization pipeline
  public readonly initialized$: Observable<d3.Selection<SVGSVGElement, undefined, null, undefined>>;

  public getCoordinates(mouseEvent: MouseEvent, traceId: unknown): [number, number] {
    // Define coordinates
    const x = Math.floor(this.scale.x.invert(mouseEvent.offsetX) + .5);
    const y = Math.round(this.scale.y('' + traceId));
    // Return coordinates
    return [x, y];
  }

  constructor() {
    // Set default settings
    this.settings = {
      'margin-top': 0,
      'margin-right': 0,
      'margin-bottom': 0,
      'margin-left': 0,
      'background-color': 'transparent',
      'plot-background-color': 'transparent',
      'grid-line-color': 'rgb(213,255,0)',
      'text-color': 'white',
      'content-size': 16,
      'line-height': 32,
    };

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
        // Define unique identifier
        const uuidClip = '' + UUID();
        const uuidMask = '' + UUID();

        const defs = svg.append('defs');

        // Define clip path: everything out of this area won't be drawn
        this.clip = defs.append('clipPath')
          // Set clip identifier, required in <defs>
          .attr('id', uuidClip)
          // Add inner rectangle
          .append('rect')

        // Define the mask element to create a hole where the plot will be
        defs
          .append("mask")
          .attr("id", uuidMask)
          .append("rect")
          .attr("width", "100%")
          .attr("height", "100%")
          .attr("fill", "white");

        // Create the rectangle which position and dimension will be set in the resize, to adapt to the plot dimensions
        this.mask = svg.select("mask")
          .append("rect");

        // Create the outer rectangle and apply the mask, applying the background color set by the user
        svg.append("rect")
          .attr('class', 'background')
          .attr("width", '100%')
          .attr("height", '100%')
          .attr("fill", this.settings["background-color"])
          .attr("mask", `url(#${uuidMask})`);

        // Add a background rectangle to the SVG to show the background color for only the plot
        svg.append('rect')
          .attr('id', 'plot-background')
          .attr('fill', this.settings["plot-background-color"])
          .attr('width', '100%')
          .attr('height', '100%')
          .attr('clip-path', `url(${'#' + uuidClip})`);

        // NOTE Add middle layer, in order to allow both zoom and mouse events to be captured
        // https://stackoverflow.com/questions/58125180/d3-zoom-and-mouseover-tooltip
        this.focus = svg.append('g')
          .attr('class', 'focus');

        // Define features group
        this.draw = this.focus.append('g')
          // Bind features group to clip path
          .attr('class', 'features')
          .attr('clip-path', `url(${'#' + uuidClip})`);
        // Define zoom event
        this.zoom = d3.zoom<SVGGElement, undefined>();
        // Add an invisible rectangle on top of the chart.
        // This, can recover pointer events: it is necessary to understand when the user zoom.
        this.events = this.focus.append('rect')
          // Set style to appear invisible, but catch events
          .attr('class', 'zoom')
          .style('fill', 'none')
          .style('pointer-events', 'all')
          .lower();
        // Set zoom behavior
        this.focus.call(this.zoom)
          .on('dblclick.zoom', () => this.zoom.scaleTo(this.focus, 1))

        // Save the mousedown.zoom event listener
        this.focusMousedown = this.focus.on('mousedown.zoom')!;

        // Remove the mousedown.zoom event listener
        this.focus.on('mousedown.zoom', null);

        this.brush = d3.brushX();

        // Create a rectangle in the draw area to create a "shadow" effect when clicking on a feature
        this.shadow = this.draw
          .append('rect')
          .attr('id', 'shadow')
          .attr('fill', 'black')
          .attr('fill-opacity', 0.15)
          .attr('height', '100%')
          .data([{trace: undefined, feature: undefined, range: undefined} as SelectionContext])
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
        this.axes = {x, y};
      }),
      // Initialize horizontal, vertical scale
      tap(() => this.scale = {x: d3.scaleLinear(), y: d3.scaleOrdinal()}),
      // Avoid re-drawing the graph each time another observable subscribes
      shareReplay(1)
    );
  }
}
