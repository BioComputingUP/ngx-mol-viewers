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

  private setTooltipPosition(event: MouseEvent) {
    const tooltip = this._tooltip;

    // If we are over the center of the page, we move the tooltip to the left
    if (event.clientX > window.innerWidth / 2) {
      tooltip.style("left", "auto");
      tooltip.style("right", `${window.innerWidth - event.clientX + (event.offsetX - event.clientX) + 10}px`);
    } else {
      tooltip.style("right", "auto");
      tooltip.style("left", `${event.offsetX + 10}px`);
    }

    if (event.clientY > window.innerHeight / 2) {
      console.log(window.innerHeight / 2 - (window.innerHeight - event.clientY) + window.innerHeight / 2);
      tooltip.style("top", "auto");
      tooltip.style("bottom", `${event.offsetY - window.innerHeight / 2 -  + 10}px`);
    } else {
      tooltip.style("bottom", "auto");
      tooltip.style("top", `${event.offsetY + 10}px`);
    }

  }

  public onMouseEnter(event: MouseEvent, trace: InternalTrace, feature?: Feature, index?: number) {
    // Define tooltip
    const tooltip = this._tooltip;
    // Define coordinates
    const coordinates = this.initializeService.getCoordinates(event, trace.id);
    // Emit tooltip context
    this.tooltip$.next({ trace, feature, index, coordinates });
    // Set tooltip visible
    tooltip.style("display", "block");

    this.setTooltipPosition(event);
  }

  public onMouseMove(event: MouseEvent, trace: InternalTrace, feature?: Feature, index?: number) {
    // Re-rendering tooltip on move is required only for continuous features
    if (feature && feature.type === 'continuous') {
      // Define coordinates
      const coordinates = this.initializeService.getCoordinates(event, trace.id);
      // Emit tooltip context
      this.tooltip$.next({ trace, feature, index, coordinates });
    }
    this.setTooltipPosition(event);
  }

  public onMouseLeave() {
    // Define tooltip
    const tooltip = this._tooltip;
    // Hide tooltip
    tooltip.style("display", "none");
    // Remove tooltip context
    this.tooltip$.next(null);
  }

  // public onMouseMove(trace: Trace, feature?: Feature, index?: number) {
  //   throw new Error('Method not implemented.');
  // }
}
