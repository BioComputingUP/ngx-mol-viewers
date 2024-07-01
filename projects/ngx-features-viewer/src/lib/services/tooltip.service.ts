import { Injectable, TemplateRef } from '@angular/core';
import { ReplaySubject } from 'rxjs'
import { select } from 'd3';
import { InitializeService } from './initialize.service';
import { Feature } from '../features/feature';
import { Trace } from '../trace';

export interface Context {
  // Trace is available in both trace and feature context
  trace: Trace;
  // Feature, index are available in feature context, but not in trace context
  feature?: Feature;
  index?: number;
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

  public onMouseEnter(trace: Trace, feature?: Feature, index?: number) {
    // Define tooltip
    const tooltip = select<HTMLDivElement, unknown>(this.tooltip);
    // Emit tooltip context
    this.tooltip$.next({ trace, feature, index });
    // Set tooltip visible
    tooltip.style("display", "block");
    tooltip.style("opacity", 1);
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
