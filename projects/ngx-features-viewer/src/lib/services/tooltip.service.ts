import { Injectable, TemplateRef } from '@angular/core';
import { Selection, select } from 'd3';
import { ReplaySubject } from 'rxjs'
import { InitializeService } from './initialize.service';
import { InternalTrace, Trace } from '../trace';
import { Feature } from '../features/feature';

export interface Context {
  // Trace is available in both trace and feature context
  trace: Trace;
  // Feature, index are available in feature context, but not in trace context
  feature?: Feature;
  index?: number;
  // Define specific coordinates
  coordinates: [number, number];
}

@Injectable({ providedIn: 'platform' })
export class TooltipService {

  // Define HTML div element containing template
  public _tooltip!: Selection<HTMLDivElement, unknown, null, unknown>;

  public set tooltip(tooltip: HTMLDivElement) {
    // Wrap tooltip in d3 selection
    this._tooltip = select(tooltip);
  }

  public get tooltip() {
    return this._tooltip.node() as HTMLDivElement;
  }

  // Define reference to tooltip template
  public templateRef!: TemplateRef<unknown>;

  // Define tooltip (context) emitter
  readonly tooltip$ = new ReplaySubject<Context | null>();

  constructor(public initializeService: InitializeService) { }

  public getCoordinates(mouseEvent: MouseEvent, traceId: unknown): [number, number] {
    // Define coordinates
    const x = Math.floor(this.initializeService.scale.x.invert(mouseEvent.offsetX));
    const y = Math.floor(this.initializeService.scale.y('' + traceId));
    // Return coordinates
    return [x, y];
  }

  public onMouseEnter(event: MouseEvent, trace: InternalTrace, feature?: Feature, index?: number) {
    // Define tooltip
    const tooltip = this._tooltip;
    // Define coordinates
    const coordinates = this.getCoordinates(event, trace.id);
    // Emit tooltip context
    this.tooltip$.next({ trace, feature, index, coordinates });
    // Set tooltip visible
    tooltip.style("display", "block");
    tooltip.style("opacity", 1);
  }

  public onMouseMove(event: MouseEvent, trace: InternalTrace, feature?: Feature, index?: number) {
    // Define tooltip
    const tooltip = this._tooltip;
    // Re-rendering tooltip on move is required only for continuouse features
    if (feature && feature.type === 'continuous') {
      // Define coordinates
      const coordinates = this.getCoordinates(event, trace.id);
      // Emit tooltip context
      this.tooltip$.next({ trace, feature, index, coordinates });
    }
    // Define left, top position
    const left = event.offsetX + 10;
    const top = event.offsetY + 10;
    // Set tooltip position
    tooltip.style("left", `${left}px`);
    tooltip.style("top", `${top}px`);
  }

  public onMouseLeave() {
    // Define tooltip
    const tooltip = this._tooltip;
    // Hide tooltip
    tooltip.style("display", "none");
    tooltip.style("opacity", 0);
    // Remove tooltip context
    this.tooltip$.next(null);
  }

  // public onMouseMove(trace: Trace, feature?: Feature, index?: number) {
  //   throw new Error('Method not implemented.');
  // }
}
