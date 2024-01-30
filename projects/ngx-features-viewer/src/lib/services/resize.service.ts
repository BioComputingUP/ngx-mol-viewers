import { Observable, ReplaySubject, switchMap, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
import { InitializeService } from './initialize.service';
import { Injectable } from '@angular/core';

export interface Size {
  height: number;
  width: number;
}

export interface Margin {
  // Define margins clockwise
  top: number;
  right: number;
  bottom: number;
  left: number;
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

  public margin!: Margin;

  get div() {
    return this.init.div;
  }

  get height() {
    // return (this._root.nativeElement as HTMLDivElement).clientHeight; // Does not include border height
    return this.div.offsetHeight; // Includes border height
  }

  get width() {
    // return (this._root.nativeElement as HTMLDivElement).clientWidth; // Does not include border width
    return this.div.offsetWidth; // Includes border width
  }

  public readonly resize$ = new ReplaySubject<Event>(1);

  public readonly resized$: Observable<void>;

  constructor(public readonly init: InitializeService) {
    // Trigger resize event
    const resize$ = this.resize$.pipe(startWith(void 0));
    // Define resize pipeline
    this.resized$ = this.init.initialized$.pipe(
      // Subscribe to resize event
      switchMap(() => resize$),
      // Get width, height from root HTML div
      map(() => ({ width: this.width, height: this.height })),
      // Add some delay, avoid flooding of resize events
      debounceTime(100),
      // Check that width value actually changed
      distinctUntilChanged((p, c) => p.width === c.width),
      // Resize SVG, return void
      map(() => {
        // Resize SVG element
        this.init.svg.attr('height', this.height).attr('width', this.width);
        // Compute inner size
        const size: Size = {
          height: this.height - this.margin.top - this.margin.bottom,
          width: this.width - this.margin.left - this.margin.right
        };
        // Resize inner clip and events elements
        resize(this.init.clip, size, this.margin);
        resize(this.init.events, size, this.margin);
      }),
    );
  }
}
