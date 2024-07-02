import { Injectable, TemplateRef } from '@angular/core';
import { ReplaySubject } from 'rxjs'
import { select } from 'd3';
import { InitializeService } from './initialize.service';
import { Feature } from '../features/feature';
import { InternalTrace, Trace } from '../trace';

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
  public tooltip!: HTMLDivElement;

  // Define reference to tooltip template
  public templateRef!: TemplateRef<unknown>;

  // Define tooltip (context) emitter
  readonly tooltip$ = new ReplaySubject<Context | null>();

  constructor(public initializeService: InitializeService) { }

  public onMouseEnter(event: MouseEvent, trace: InternalTrace, feature?: Feature, index?: number) {
    // Define tooltip
    const tooltip = select<HTMLDivElement, unknown>(this.tooltip);
    // Define coordinates
    const x = Math.floor(this.initializeService.scale.x.invert(event.offsetX));
    const y = this.initializeService.scale.y('' + trace.id);
    // Emit tooltip context
    this.tooltip$.next({ trace, feature, index, coordinates: [x, y] });
    // Set tooltip visible
    tooltip.style("display", "block");
    tooltip.style("opacity", 1);
  }

  public onMouseMove(event: MouseEvent, trace: InternalTrace, feature?: Feature, index?: number) {
    // Define tooltip
    const tooltip = select<HTMLDivElement, unknown>(this.tooltip);
    // Define coordinates
    const x = Math.floor(this.initializeService.scale.x.invert(event.offsetX));
    const y = this.initializeService.scale.y('' + trace.id);
    // Emit tooltip context
    this.tooltip$.next({ trace, feature, index, coordinates: [x, y] });
    // Set tooltip position
    tooltip.style("left", `${event.offsetX + 10}px`);
    tooltip.style("top", `${event.offsetY + 10}px`);
  }

  public onMouseLeave() {
    // Define tooltip
    const tooltip = select<HTMLDivElement, unknown>(this.tooltip);
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
