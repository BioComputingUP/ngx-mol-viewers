import {distinctUntilChanged, map, merge, Observable, ReplaySubject, shareReplay, startWith, switchMap,} from 'rxjs';
import {Injectable} from '@angular/core';
// Custom providers
import {InitializeService, Scale} from './initialize.service';
// D3 library
import * as d3 from 'd3';

type D3ZoomEvent = d3.D3ZoomEvent<SVGSVGElement, undefined>;

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

  public readonly zoom$ = new ReplaySubject<D3ZoomEvent>(1);

  public readonly brush$ = new ReplaySubject<[number, number] | undefined>(1);

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
      switchMap(() => merge(this.zoom$, this.brush$).pipe(
        distinctUntilChanged((prev, curr) => {
          if (prev && curr && "type" in curr && curr.type === 'zoom') {
            prev = prev as d3.D3ZoomEvent<SVGSVGElement, undefined>;
            curr = curr as d3.D3ZoomEvent<SVGSVGElement, undefined>;
            const k = prev.transform?.k === curr.transform.k;
            const x = prev.transform?.x === curr.transform.x;
            const y = prev.transform?.y === curr.transform.y;
            return k && x && y;
          } else {
            return prev === curr;
          }
        }),
        map((event) => {
          const {x: initial} = this._scale;
          const {x: current} = this.initService.scale;

          // Zoom wheel event
          if (event && "type" in event) {
            // Handle zoom event
            const zoomEvent = event as d3.D3ZoomEvent<SVGSVGElement, undefined>;
            // Modify the zoomEvent transform by applying the current scale
            const updated = zoomEvent.transform.rescaleX(initial);
            // Get start, end domain
            const [start, end] = updated.domain();
            // Update current domain, in place
            current.domain([start, end]);
            // Return original scale
            return this.initService.scale;
          } else {
            event = event as [number, number] | undefined;
            if (!event) {
              current.domain(initial.domain());
            } else {
              const [start, end] = event.map(current.invert);
              this.initService.brushRegion.call(this.initService.brush.move, null);

              // Calculate the transform to apply to the zoom
              const k = (this.initService.seqLen + 1) / (end - start);
              const x = -initial(start) + this.initService.margin.left * (1 / k);

              this.initService.focus.call(this.initService.zoom.transform, d3.zoomIdentity.scale(k).translate(x, 0));
            }
          }
          return this.initService.scale;
        }),
        startWith(this.initService.scale)
      ))
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
          .filter((d) => Number.isInteger(d));
        // Define horizontal axis
        const axis = d3.axisBottom(scale.x)
          .tickValues(ticks)
          .tickFormat(d3.format('.0f'));
        // Update horizontal axis
        axes.x.call(axis);
      }),
      //tap(() => console.log('Zoomed!')),
    );
  }

}
