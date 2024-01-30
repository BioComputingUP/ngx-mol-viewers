import { Observable, ReplaySubject, debounceTime, distinctUntilChanged, map, startWith, tap } from 'rxjs';
import { Injectable } from '@angular/core';
import * as d3 from 'd3';

export interface Scale {
  x: d3.ScaleLinear<number, number>,
  y: d3.ScaleOrdinal<string, number>
}

@Injectable({
  providedIn: 'root'
})
export class ZoomService {

  public scale!: Scale;

  public scaled!: Scale

  // Define zoom event
  public readonly zoom$ = new ReplaySubject<d3.D3ZoomEvent<SVGSVGElement, undefined>>(1);

  public readonly zoomed$: Observable<Scale>;

  constructor() {
    // Initialize scale
    const x = d3.scaleLinear<number, number>();
    const y = d3.scaleOrdinal<string, number>();
    // Set original scale
    this.scale = { x, y };
    // Define zoom pipeline
    // NOTE It is run only on horizontal axis
    this.zoomed$ = this.zoom$.pipe(
      // Avoid events flooding
      debounceTime(40),
      distinctUntilChanged((p, c) => p.transform.x === c.transform.x),
      // Use zoom event to rescale original axis
      map((event) => {
        // Get original horiziontal, vertical scale
        const { x, y } = this.scale;
        // Return updated scale
        return { x: event.transform.rescaleX(x), y };
      }),
      // Start with initial scale
      startWith(this.scale),
      // Store updated scale
      tap((scaled) => this.scaled = scaled),
    );
  }

}
