import { Injectable, OnDestroy } from '@angular/core';
// D3 library
import * as d3 from 'd3';
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
// Custom providers
import { InitializeService, Scale } from './initialize.service';
import { DrawService } from './draw.service';
import { ResizeService } from './resize.service';

type D3ZoomEvent = d3.D3ZoomEvent<SVGSVGElement, undefined>;

@Injectable({
  providedIn : 'platform',
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

  constructor(
    private initService: InitializeService, 
    private drawService: DrawService,
    private resizeService: ResizeService
  ) {
    // Define pipeline for scale initialization
    const initialized$: Observable<Scale> = this.initService.initialized$.pipe(
      // Store scale into service
      map(() => this._scale = {
        x : this.initService.scale.x.copy(),
        y : this.initService.scale.y.copy(),
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
        const {x : initial} = this._scale;
        const {x : current} = this.initService.scale;
        // Modify the zoomEvent transform by applying the current scale
        const updated = zoomEvent.transform.rescaleX(initial);
        // Get start, end domain
        const [start, end] = updated.domain();
        // Update current domain, in place
        current.domain([start, end]);
        // Return original scale
        return this.initService.scale;
        // return void 0;
      }),
      // Start with current scale
      startWith(this.initService.scale),
    );

    this._brush = this.initService.initialized$.pipe(
      switchMap(() => this.brush$),
      map((selection) => {
          const {x : initial} = this._scale;
          const {x : current} = this.initService.scale;

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
            const k = (this.initService.sequence.length) / (end - start);
            // Why the margin left is divided by k? Who knows, but without it the zoom is not centered
            const x = -initial(start) + this.initService.margin.left / k;
            // Create the transformation
            const transformation = d3.zoomIdentity.scale(k).translate(x, 0);
            // Apply the transform to the zoom with a transition, this will call the zoom event
            focusTransition.call(zoomTransform, transformation);
          }
        },
      ),
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
        let newStart = start;
        let newEnd = end;
        if (start < 0.5) {
          newStart = 0.5;
        }
        if (end > this.initService.sequence.length + 0.5) {
          newEnd = this.initService.sequence.length + 0.5;
        }
        if (newStart !== start || newEnd !== end) {
          x.domain([newStart, newEnd]);
        }

        // Define horizontal axis ticks
        const ticks = scale.x
          .ticks()
          // Do not show ticks outside the sequence
          .filter((d) => Number.isInteger(d) && d >= 0.5 && d <= this.initService.sequence.length);

        // If the 1 tick can be shown, add it
        if (scale.x.domain()[0] < 1) {
          ticks.unshift(1);
        }

        // Define horizontal axis
        const axis = d3.axisBottom(scale.x)
          .tickValues(ticks)
          .tickFormat(d3.format('.0f'));
        // Update horizontal axis
        axes.x.call(axis);
      }),
    );

    // // Ensure initialization completed
    // this._brushed = timer(1000).pipe(withLatestFrom(initialized$)).subscribe(() => {
    //   console.log('Current scale:', this.initService.scale);
    // });
  }

  ngOnDestroy(): void {
    this._brush.unsubscribe();
  }

  public adjustBrushToCells(event: d3.D3BrushEvent<unknown>) {
    if (!event.sourceEvent) return;

    if ((event.sourceEvent as MouseEvent).shiftKey) {
      // Do a pan
      this.initService.brushRegion
        .select('.overlay')
        .style('cursor', 'grabbing');
    }

    const x = this.initService.scale.x;
    let [x0, x1] = (event.selection as [number, number]).map(x.invert);
    x0 = Math.max(1, Math.round(x0));
    x1 = Math.min(this.initService.sequence.length, Math.round(x1));
    const d1 = [x0 - 0.5, x1 + 0.5] as [number, number];
    this.initService.brushRegion.call(
      this.initService.brush.move,
      d1.map(x) as [number, number],
    );
  }

  public brushRegion(event: d3.D3BrushEvent<unknown>) {
    if (!event.sourceEvent) return;
    if (!event.selection && event.sourceEvent.detail === 1) {
      // if selection is empty it means that we clicked on the canvas, so we should deselect the feature if any is selected
      this.drawService.selectedFeatureEmit$.next(undefined);
      return;
    }

    // Ensure that if a selection is made, at least 5 residues are selected
    if (event.selection) {
      let selection: [number, number] | undefined;

      const x = this.initService.scale.x;
      let [x0, x1] = (event.selection as [number, number]).map(x.invert);
      let cont = Math.round(x1 - x0);
      let toSx = false;

      // If the number of residues is less than 5, add residues to the left and right evenly and respecting the limits
      while (cont < 5) {
        // Add a position to sx if possible
        if (x0 > 1 && toSx) {
          x0 -= 1;
          cont += 1;
        }
        // Add a position to dx if possible
        if (x1 <= this.initService.sequence.length && !toSx) {
          x1 += 1;
          cont += 1;
        }
        toSx = !toSx;
      }
      selection = [x0, x1];
      selection = selection!.map(x) as [number, number];
      this.brush$.next(selection);
    }
  }

  public setupZoomAndBrushBounds(sequenceLength: number): void {
    const {
      top: mt,
      left: ms,
      right: me,
      bottom: mb,
    } = this.resizeService.margin;
    const h = this.resizeService.height;
    const w = this.resizeService.width;
    // Define number of residues in sequence
    const n = sequenceLength + 1;
    // Apply scale limit to 5 residues
    this.initService.zoom
      .translateExtent([
        [ms, 0],
        [w - me, h - mb],
      ])
      .scaleExtent([1, n / 5])
      .extent([
        [ms, 0],
        [w - me, h - mb],
      ])
      .on('zoom', (event) => {
        this.zoom$.next(event);
      });

    this.initService.brush
      .extent([
        [ms, mt],
        [w - me, h - mb],
      ])
      .on('brush', (event) => this.adjustBrushToCells(event))
      .on('end', (event) => this.brushRegion(event));

    // Initialize brush on the brush region
    this.initService.brushRegion.call(this.initService.brush);

    const focus = this.initService.focus;
    const brushRegion = this.initService.brushRegion;
    const focusMousedown = this.initService.focusMousedown.bind(
      this.initService.focus.node()!,
    );

    // Function to handle key events
    const handleKeyEvent = (event: KeyboardEvent) => {
      const isShiftOrCmd = event.metaKey || event.shiftKey;
      const isKeyDown = event.type === 'keydown' && isShiftOrCmd;

      // Set cursor and mousedown event based on key press/release
      focus
        .style('cursor', isKeyDown ? 'grabbing' : 'auto')
        .on('mousedown.zoom', isKeyDown ? focusMousedown : () => null);

      // Toggle pointer events on the brush region
      brushRegion
        .select('.overlay')
        .style('pointer-events', isKeyDown ? 'none' : 'all');
    };

    // Bind the key event handler to both keydown and keyup events
    d3.select('body').on('keydown keyup', handleKeyEvent);
  }
}
