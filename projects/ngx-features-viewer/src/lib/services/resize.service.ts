import { distinctUntilChanged, map, Observable, ReplaySubject, startWith } from 'rxjs';
import { Injectable } from '@angular/core';
// Custom providers
import { InitializeService } from './initialize.service';
// D3 library
import * as d3 from 'd3';


export interface Size {
  height: number;
  width: number;
}

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resize<E extends d3.Selection<any, undefined, null, undefined>, >(element: E, size: Size, margin: Margin) {
  // Return element
  element
    // After resizing
    .attr('height', size.height)
    .attr('width', size.width)
    // After repositioning
    .attr('y', margin.top)
    .attr('x', margin.left);
}

@Injectable({providedIn: 'platform'})
export class ResizeService {
  /** Resize handler for SVG container
   *
   * 1. Resizes the root SVG element according to the width of its parent DIV element.
   * 2. Resizes the inner containers to match the root SVG element size.
   * 3. Update horizontal, vertical axes positions, to meet SVG margin. This, requires to have
   * access to previously initialized margins.
   * 4. Updates horizontal, vertical scale ranges to meet SVG size and margin. This, requires
   * to have access to previously drawn sequence and features.
   */

  get svg() {
    return this.initializeService.svg;
  }

  get div() {
    return this.initializeService.div;
  }

  get height() {
    // return (this._root.nativeElement as HTMLDivElement).clientHeight; // Does not include border height
    return this.div.offsetHeight; // Includes border height
  }

  get width() {
    // return (this._root.nativeElement as HTMLDivElement).clientWidth; // Does not include border width
    return this.div.offsetWidth; // Includes border width
  }

  get margin() {
    return this.initializeService.margin;
  }

  get scale() {
    return this.initializeService.scale;
  }

  get axes() {
    return this.initializeService.axes;
  }

  public readonly resize$ = new ReplaySubject<Event>(1);

  public readonly resized$: Observable<void>;

  constructor(
    public readonly initializeService: InitializeService
  ) {
    // Trigger resize event
    const resize$: Observable<void> = this.resize$.pipe(
      // Get width, height from root HTML div
      map(() => ({width: this.width, height: this.height})),
      // Check that width value actually changed
      distinctUntilChanged((p: Size, c: Size) => p.width === c.width),
      // Map to void
      map(() => void 0),
      // Emit initially
      startWith(void 0),
    );

    // Define resize pipeline
    this.resized$ = resize$.pipe(
      // 1. Resize root SVG element
      map(() => this.updateRoot()),
      // 2. Resize inner SVG containers
      map(() => this.updateDraw()),
      // 3. Update horizontal, vertical axes positions
      map(() => this.updateAxes()),
      // 4.1 Update horizontal range
      map(() => this.updateRangeX()),
      // 4.2 Update vertical range
      map(() => this.updateRangeY()),
    );
  }

  public updateRoot(): void {
    // Get vertical scale
    const {y} = this.scale;
    // Get vertical range
    const range = y.range();
    // Compute height as the difference between the first and the last value in range
    const height = range.at(-1)! + this.margin.bottom;
    // Get current width
    const width = this.width;
    // Set updated height and width
    this.svg
      .attr('height', height)
      .attr('width', width);
  }

  public updateDraw(): void {
    // Initialize horizontal, vertical size
    const size = {width: 0, height: 0};
    // Update horizontal, vertical size
    size.height = this.height - this.margin.top - this.margin.bottom;
    size.width = this.width - this.margin.left - this.margin.right;
    // Resize inner clip container
    resize(this.initializeService.clip, size, this.margin);
    resize(this.initializeService.mask, size, this.margin);
    resize(this.initializeService.events, size, this.margin);
  }

  public updateAxes(): void {
    // // Unpack horizontal, vertical axis
    // const {x, y} = this.axes;
    // // Translate horizontal axis
    // x.attr('transform', `translate(0, ${this.height - this.margin.top})`);
    // Translate vertical axis
    this.axes.y.attr('transform', `translate(${this.margin.left}, 0)`);
  }

  public updateRangeX(): void {
    // Get horizontal scale
    const x = this.scale.x;
    // Get width of root SVG element
    const width = this.width;
    // Get left, right margin of root SVG element
    const {left, right} = this.margin;
    // Update range in scale according to horizontal margins
    x.range([left, width - right]);
  }

  public updateRangeY(): void {
    // Do nothing
  }
}
