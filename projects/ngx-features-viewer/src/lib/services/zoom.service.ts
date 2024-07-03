import {
  distinctUntilChanged,
  map,
  Observable,
  ReplaySubject,
  shareReplay,
  startWith,
  Subscription,
  switchMap,
} from 'rxjs';
import { Injectable, OnDestroy } from '@angular/core';
// Custom providers
import { InitializeService, Scale } from './initialize.service';
// D3 library
import * as d3 from 'd3';

type D3ZoomEvent = d3.D3ZoomEvent<SVGSVGElement, undefined>;

@Injectable({
  providedIn: 'platform'
})
export class ZoomService implements OnDestroy {
  /** Zoom handler service
   *
   * 1. Store a copy of the original scale provided during initialization
   * 2. Intercept zoom event, which contains a transformation on the original scale
   * 3. Generate an updated scale, using transformation provided by the intercepted event
   * 4. Store updated scale, so it can be used during drawing
   * N. Update axes by calling updated scale on them
   */

  private _scale!: Scale;

  public readonly zoom$ = new ReplaySubject<D3ZoomEvent>(1);

  public readonly brush$ = new ReplaySubject<[number, number] | undefined>(1);

  public readonly zoomed$: Observable<void>;

  private _brush: Subscription;

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
      switchMap(() => this.zoom$),
      distinctUntilChanged((prev, curr) => {
        const k = prev.transform?.k === curr.transform.k;
        const x = prev.transform?.x === curr.transform.x;
        const y = prev.transform?.y === curr.transform.y;
        return k && x && y;
      }),
      map((zoomEvent) => {
        const {x: initial} = this._scale;
        const {x: current} = this.initService.scale;
        // Modify the zoomEvent transform by applying the current scale
        const updated = zoomEvent.transform.rescaleX(initial);
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

    this._brush = this.initService.initialized$.pipe(
      switchMap(() => this.brush$),
      map((selection) => {
          const {x: initial} = this._scale;
          const {x: current} = this.initService.scale;

          // Create a transition
          const t = d3.transition().duration(300).ease(d3.easeExpOut);

          const focusTransition = this.initService.focus.transition(t);
          const zoomTransform = this.initService.zoom.transform;

          // If no selection, reset zoom
          if (!selection) {
            focusTransition.call(zoomTransform, d3.zoomIdentity);
          } else {
            // Remove the brush region
            this.initService.brushRegion.call(this.initService.brush.move, null);
            // From the selection coordinates get the start and end domain
            const [start, end] = selection.map(current.invert);
            // Calculate the transform to apply to the zoom
            const k = (this.initService.seqLen + 1) / (end - start);
            // Why the margin left is divided by k? Who knows, but without it the zoom is not centered
            const x = -initial(start) + this.initService.margin.left / k;
            // Create the transformation
            const transformation = d3.zoomIdentity.scale(k).translate(x, 0);
            // Apply the transform to the zoom with a transition, this will call the zoom event
            focusTransition.call(zoomTransform, transformation);
          }
        }
      )
    ).subscribe();

    // Always subscribe to same scale
    this.zoomed$ = scaled$.pipe(
      // Update horizontal axis according to scale
      map(() => {
        // Get current axes
        const axes = this.initService.axes;
        // Get initial scale
        const scale = this.initService.scale;
        const x = scale.x;
        const [start, end] = x.domain();

        // These are needed to clamp the zoom when doing a transition
        if (start < 0.5) {
          x.domain([0.5, end]);
        }
        if (end > this.initService.seqLen + .5) {
          x.domain([start, this.initService.seqLen + 0.5]);
        }

        // Define horizontal axis ticks
        const ticks = scale.x
          .ticks()
          // Do not show ticks outside the sequence
          .filter((d) => Number.isInteger(d) && d >= 0.5 && d <= this.initService.seqLen);
        // Define horizontal axis
        const axis = d3.axisBottom(scale.x)
          .tickValues(ticks.concat(1))
          .tickFormat(d3.format('.0f'));
        // Update horizontal axis
        axes.x.call(axis);
      }),
    );
  }

  ngOnDestroy(): void {
    this._brush.unsubscribe();
  }
}
