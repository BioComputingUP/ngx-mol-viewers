import { Observable, ReplaySubject, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
import { Injectable } from '@angular/core';
// Custom providers
import { InitializeService, Margin } from './initialize.service';


export interface Size {
  height: number;
  width: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resize<E extends d3.Selection<any, undefined, null, undefined>,>(element: E, size: Size, margin: Margin) {
  // Return element
  element
    // After resizing
    .attr('height', size.height)
    .attr('width', size.width)
    // After repositioning
    .attr('y', margin.top)
    .attr('x', margin.left);
}

@Injectable({
  providedIn: 'root'
})
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
    return this.initService.svg;
  }

  get div() {
    return this.initService.div;
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
    return this.initService.margin;
  }

  get scale() {
    return this.initService.scale;
  }

  get axes() {
    return this.initService.axes;
  }

  public readonly resize$ = new ReplaySubject<Event>(1);

  public readonly resized$: Observable<void>;

  constructor(
    public readonly initService: InitializeService,
  ) {
    // Trigger resize event
    const resize$: Observable<void> = this.resize$.pipe(
      // Map to void
      map(() => void 0),
      // Emit initially
      startWith(void 0)
    );
    // Define SVG size from size of parent HTML DIV
    const size$ = resize$.pipe(
      // Get width, height from root HTML div
      map(() => ({ width: this.width, height: this.height })),
      // Add some delay, avoid flooding of resize events
      debounceTime(100),
      // Check that width value actually changed
      distinctUntilChanged((p: Size, c: Size) => p.width === c.width),
    );
    // Define resize pipeline
    this.resized$ = size$.pipe(
      // 1. Resize root SVG element
      map(() => {
        this.svg
          .attr('height', this.height)
          .attr('width', this.width);
      }),
      // 2. Resize inner SVG containers
      map(() => {
        // Initialize horizontal, vertical size
        const size = { width: 0, height: 0 };
        // Update horizontal, vertical size
        size.height = this.height - this.margin.top - this.margin.bottom;
        size.width = this.width - this.margin.left - this.margin.right;
        // Resize inner clip container
        resize(this.initService.clip, size, this.margin);
        resize(this.initService.events, size, this.margin);
      }),
      // 3. Update horizontal, vertical axes positions
      map(() => {
        // Unpack horizontal, vertical axis
        const { x, y } = this.axes;
        // Translate horizontal axis
        x.attr('transform', `translate(0, ${this.height - this.margin.bottom - this.margin.top})`);
        // Translate vertical axis
        y.attr('transform', `translate(${this.margin.left}, 0)`);
      }),
      // 4.1 Update horizontal range
      map(() => {
        // Get horizontal scale
        const x = this.scale.x;
        // Get width of root SVG element
        const width = this.width;
        // Get left, right margin of root SVG element
        const { left, right } = this.margin;
        // Update range in scale according to horizontal margins
        x.range([left, width - right]);
      }),
      // 4.2 Update vertical range
      map(() => {
        // Get vertical scale
        const y = this.scale.y;
        // Get domain, as previously defined in draw pipeline
        // NOTE It includes start, end empty positions
        const domain = y.domain();
        // Get top, bottom positions
        const top = this.margin.top;
        const bottom = this.height - this.margin.bottom - this.margin.top;
        // Define row height
        const height = bottom / (domain.length - 1);
        // Define range by looping into domain
        const range = domain.map((id, i) => {
          // Handle first tick
          if (id === 'first') return top; 
          // Hanlde last tick
          if (id === 'last') return bottom;
          // Handle any other tick
          return (i * height);
        });
        // Update vertical axis range
        y.range(range);
      }),
    );
  }
}
