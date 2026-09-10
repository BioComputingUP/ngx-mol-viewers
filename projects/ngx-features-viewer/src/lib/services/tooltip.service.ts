import { Injectable, TemplateRef } from '@angular/core';
import * as d3 from 'd3';
import { Selection, select } from 'd3';
import { ReplaySubject } from 'rxjs'
import { InitializeService } from './initialize.service';
import { InternalTrace, Trace } from '../trace';
import { Feature, featureIdentity } from '../features/feature';

export interface Context {
  // Trace is available in both trace and feature context
  trace: InternalTrace;
  // Feature, index, and stable featureId are available in feature context, but not in trace context
  feature?: Feature;
  index?: number;
  featureId?: number;
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

  private getTooltipSize(tooltip: Selection<HTMLDivElement, unknown, null, unknown>) {
    // Define tooltip size
    const width = tooltip.node()?.clientWidth || 0;
    const height = tooltip.node()?.clientHeight || 0;
    return { width, height };
  }

  private setTooltipPosition(event: MouseEvent) {
    const tooltip = this._tooltip;

    // Get tooltip size
    const { width, height } = this.getTooltipSize(tooltip);

    // Default position at bottom left
    let offsetX = 10;
    let offsetY = 10;

    // Adjust if the tooltip would go out of bounds
    if (event.clientX + offsetX + width > window.innerWidth) {
      offsetX = -width - 10;
    }

    if (event.clientY + offsetY + height > window.innerHeight) {
      offsetY = -height - 10;
    }

    // Apply the new position using transform
    tooltip.style("transform", `translate(${event.clientX + offsetX}px, ${event.clientY + offsetY}px)`);
  }

  public onMouseEnter(event: MouseEvent, trace: InternalTrace, feature?: Feature, index?: number) {
    // Define tooltip
    const tooltip = this._tooltip;
    // Define coordinates
    const coordinates = this.initializeService.getCoordinates(event, trace.id);
    const featureId = feature ? featureIdentity(feature) : undefined;
    // Emit tooltip context
    this.tooltip$.next({ trace, feature, index, featureId, coordinates });
    // Set tooltip visible
    tooltip.style("opacity", "1");
    tooltip.style("visibility", "visible");

    this.setTooltipPosition(event);
  }

  public onMouseMove(event: MouseEvent, trace: InternalTrace, feature?: Feature, index?: number) {
    // Re-rendering tooltip on move is required only for continuous features
    if (feature && feature.type === 'continuous') {
      // Define coordinates
      const coordinates = this.initializeService.getCoordinates(event, trace.id);
      const featureId = featureIdentity(feature);
      // Emit tooltip context
      this.tooltip$.next({ trace, feature, index, featureId, coordinates });
    }
    this.setTooltipPosition(event);
  }

  public onMouseLeave() {
    // Define tooltip
    const tooltip = this._tooltip;
    // Hide tooltip
    tooltip.style("opacity", "0");
    tooltip.style("visibility", "hidden");
    // Remove tooltip context
    this.tooltip$.next(null);
  }

  public bindFeatureEvents(
    selection: d3.Selection<SVGGElement, Feature, SVGGElement | d3.BaseType, unknown>,
    trace: InternalTrace,
    selectionEmitter$: import('@angular/core').EventEmitter<import('./initialize.service').SelectionContext | undefined>
  ): void {
    const scale = this.initializeService.scale;
    const circle = this.initializeService.hoverCircleMarker;

    const getTrace = (event: MouseEvent): InternalTrace => {
      const parentNode = (event.currentTarget as Element)?.parentElement;
      return (parentNode ? (d3.select(parentNode).datum() as InternalTrace) : undefined) || trace;
    };

    const getFeatureIdx = (currentTrace: InternalTrace, f: Feature): number => {
      let idx = currentTrace.features.indexOf(f);
      if (idx === -1) {
        idx = currentTrace.features.findIndex(item => featureIdentity(item) === featureIdentity(f));
      }
      return idx;
    };

    selection.on('mouseenter', (event: MouseEvent, feature: Feature) => {
      const currentTrace = getTrace(event);
      const featureIdx = getFeatureIdx(currentTrace, feature);
      this.onMouseEnter(event, currentTrace, feature, featureIdx);
    });

    selection.on('mousemove', (event: MouseEvent, feature: Feature) => {
      const currentTrace = getTrace(event);
      const featureIdx = getFeatureIdx(currentTrace, feature);
      this.onMouseMove(event, currentTrace, feature, featureIdx);

      if (feature.type === 'continuous') {
        const coordinates = this.initializeService.getCoordinates(event, currentTrace.id);
        if (coordinates[0] <= 0.5) return;

        const mt = scale.y('' + currentTrace.id) || 0;
        const lh = currentTrace.options?.['line-height'] || this.initializeService.settings['line-height'];
        const cs = currentTrace.options?.['content-size'] || this.initializeService.settings['content-size'];
        const center = mt + lh / 2;
        const bottom = center + cs / 2;
        const top = center - cs / 2;

        const rescaleY = (yValue: number) => (
          bottom +
          ((yValue - currentTrace.domain.min) / (currentTrace.domain.max - currentTrace.domain.min)) * (top - bottom)
        );

        circle
          .attr('cx', scale.x(coordinates[0]))
          .attr('cy', rescaleY((feature as any).values[coordinates[0] - 1]))
          .attr('display', 'block');
      }
    });

    selection.on('mouseleave', () => {
      this.onMouseLeave();
      circle.attr('display', 'none');
    });

    selection.on('click', (event: MouseEvent, feature: Feature) => {
      const currentTrace = getTrace(event);
      this.selectFeature(feature, event, currentTrace, selectionEmitter$);
    });
  }

  private selectFeature(
    feature: Feature,
    event: MouseEvent,
    trace: InternalTrace,
    selectionEmitter$: import('@angular/core').EventEmitter<import('./initialize.service').SelectionContext | undefined>
  ): void {
    let featureStart, featureEnd;
    switch (feature.type) {
      case 'locus':
        featureStart = feature.start - 0.5;
        featureEnd = feature.end;
        break;
      case 'dssp':
        featureStart = feature.start - 0.5;
        featureEnd = feature.end + 0.5;
        break;
      case 'continuous':
        featureStart = 0.5;
        featureEnd = (feature as any).values.length + 0.5;
        break;
      case 'pin':
        featureStart = feature.position - 0.5;
        featureEnd = feature.position + 0.5;
        break;
      case 'poly':
        featureStart = feature.position - 0.5;
        featureEnd = feature.position + 0.5;
        break;
      default:
        featureStart = 0;
        featureEnd = 10;
    }

    const coordinates = this.initializeService.getCoordinates(event, trace.id);
    if (feature.type === 'continuous') {
      featureStart = coordinates[0] - 0.5;
      featureEnd = coordinates[0] + 0.5;
    }
    const selectionContext: import('./initialize.service').SelectionContext = {
      trace,
      feature,
      range: { start: featureStart, end: featureEnd }
    };
    selectionEmitter$.emit(selectionContext);
  }
}
