import { Observable, ReplaySubject, debounceTime, map, shareReplay, startWith, switchMap, tap } from 'rxjs';
import { Injectable } from '@angular/core';
// Custom providers
import { Scale, InitializeService } from './initialize.service';
// D3 library
import * as d3 from 'd3';

@Injectable({
  providedIn: 'root'
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
      // Set debounce time
      debounceTime(10),
      // Transform original scale
      map((event) => {
        // Get current horizontal, vertical scale
        const { x } = this.initService.scale;
        // Get horizontal scale, change its domain
        const _x = event.transform.rescaleX(this._scale.x);
        // Update scaled in place
        x.domain(_x.domain());
        // Return original scale
        return this.initService.scale;
      }),
      // Start with current scale
      startWith(this.initService.scale),
    );
    // Always subscribe to same scale
    this.zoomed$ = scaled$.pipe(
      // Update axes according to scale
      map(() => {
        // Get current axes
        const axes = this.initService.axes;
        // Get initial scale
        const scale = this.initService.scale;
        // Update vertical axis
        axes.y.call(d3.axisLeft(scale.y));
        // Update horizontal axis
        axes.x.call(d3.axisBottom(scale.x));
      }),
      // TODO Remove this
      tap(() => console.log('Zoomed!')),
    );
  }

}
