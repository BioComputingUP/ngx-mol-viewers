import { Observable, ReplaySubject, map, shareReplay, startWith, switchMap } from 'rxjs';
import { Injectable } from '@angular/core';
// Custom providers
import { Scale, InitializeService } from './initialize.service';
// D3 library
import * as d3 from 'd3';

@Injectable({
  providedIn: 'platform'
})
export class ZoomService {
  /** Zoom handler service
   * 
   * 1. Store a copy of the original scale provided during initialization
   * 2. Intercept zoom event, which contains a transformation on the original scale
   * 3. Generate an updated scale, using transformation provided by the intercepted event
   * 4. Store updated scale, so it can be used during drawing
   * N. Update axes by calling updated scale on them
   */

  private _scale!: Scale;

  // public scaled? = this.initService.scale;

  // private get draw() {
  //   return this.initService.draw;
  // }

  public readonly zoom$ = new ReplaySubject<d3.D3ZoomEvent<SVGSVGElement, undefined>>(1);

  public readonly zoomed$: Observable<void>;

  constructor(private initService: InitializeService) {
    // Define pipeline for scale initialization
    const initialized$: Observable<Scale> = this.initService.initialized$.pipe(
      // Store scale into service
      map(() => this._scale = {
        x: this.initService.scale.x.copy(),
        y: this.initService.scale.y.copy()
      }),
      // Cache results
      shareReplay(1),
    );
    // Define pipeline for intercepting zoom event
    const scaled$: Observable<Scale> = initialized$.pipe(
      // Subscribe to zoom event
      switchMap(() => this.zoom$),
      // Transform original scale
      map((event) => {
        // Get initial horizontal scale
        const { x: initial } = this._scale;
        // Get current horizontal scale (the one to be updated)
        const { x: current } = this.initService.scale;
        // Get updated scale (apply transformations on initial scale)
        const updated = event.transform.rescaleX(initial);
        // Get start, end domain
        const [start, end] = updated.domain();
        // Update current domain, in place
        current.domain([start, end]);
        // Return original scale
        return this.initService.scale;
      }),
      // Start with current scale
      startWith(this.initService.scale),
    );
    // Always subscribe to same scale
    this.zoomed$ = scaled$.pipe(
      // Update horizontal axis according to scale
      map(() => {
        // Get current axes
        const axes = this.initService.axes;
        // Get initial scale
        const scale = this.initService.scale;
        // Define horizontal axis ticks
        const ticks = scale.x
          .ticks()
          .filter((d) => Number.isInteger(d))
          .slice(1, -1);
        // Define orizontal axis
        const axis = d3.axisBottom(scale.x)
          .tickValues(ticks)
          .tickFormat(d3.format('.0f'));
        // Update horizontal axis
        axes.x.call(axis);
      }),
      // // TODO Remove this
      // tap(() => console.log('Zoomed!')),
    );
  }

}
