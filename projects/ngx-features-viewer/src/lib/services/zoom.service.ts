import { Observable, ReplaySubject, map, shareReplay, startWith, switchMap, tap } from 'rxjs';
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

  private get draw() {
    return this.initService.draw;
  }

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
      // // Set debounce time
      // debounceTime(10),
      // // Filter wheel evente
      // filter((event) => event.sourceEvent.type === 'wheel'),
      // Transform original scale
      map((event) => {
        // Get initial horizontal scale
        const { x: initial } = this._scale;
        // Get current horizontal scale (the one to be updated)
        const { x: current } = this.initService.scale;
        // Get updated scale (apply transformations on initial scale)
        const updated = event.transform.rescaleX(initial);
        // Add transformation to drawed elements
        this.draw.attr('transform', event.transform.toString());
        // // // const { x: translate, k: scale } = event.transform;
        // // Get minimum, maximum value for domain
        // const [min, max] = initial.domain();
        // Get start, end domain
        const [start, end] = updated.domain();

        // // TODO Remove this
        // console.log('Transform', event.transform.toString());
        // const new_transform = event.transform.translate(Math.max(0, event.transform.x), Infinity);

        // // Get updated domain start, end
        // let [start, end] = updated.domain();
        // console.log('Transform { x: ' + event.transform.x + ', k: ' + event.transform.k + '}');
        // console.log('Before [start: ' + start + ', end: ' + end + ']');
        // // Compute width, bounded to maximum, initial width
        // const width = end - start;
        // // Update start position according to initial start position and actual width
        // start = Math.min(max - width, Math.max(min, start));
        // // Update end position according to updated start positiona and actual width
        // end = start + width;
        // console.log('After [start: ' + start + ', end: ' + end + ']');
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
        // // Update vertical axis
        // axes.y.call(d3.axisLeft(scale.y));
        // Update horizontal axis
        axes.x.call(d3.axisBottom(scale.x));
      }),
      // TODO Remove this
      tap(() => console.log('Zoomed!')),
    );
  }

}
