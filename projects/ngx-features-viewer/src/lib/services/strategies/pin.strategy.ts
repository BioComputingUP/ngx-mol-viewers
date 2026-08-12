import * as d3 from 'd3';
import { FeatureStrategy, FeatureRenderOptions } from './feature-strategy.interface';
import { Pin } from '../../features/pin';
import { Feature } from '../../features/feature';

export class PinStrategy implements FeatureStrategy {
  render(
    container: d3.Selection<SVGGElement, any, any, any>,
    featureData: Feature,
    options: FeatureRenderOptions
  ): void {
    const feature = featureData as Pin;
    const { scale, settings, center, trace } = options;

    let radius: number;
    if (feature.adjustToWidth) {
      radius = Math.min(
        trace.options?.['content-size'] || settings['content-size'],
        scale.x(1) - scale.x(0)
      ) / 2;
    } else {
      radius = feature.radius || 8;
    }

    container
      .selectAll<SVGCircleElement, Pin>('circle')
      .data([feature])
      .join('circle')
      .attr('stroke', (f) => f['stroke-color'] || 'none')
      .attr('stroke-width', (f) => f['stroke-width'] || 0)
      .attr('fill', (f) => f.color || 'black')
      .attr('fill-opacity', (f) => f.opacity || 1)
      .attr('cx', (f) => scale.x(f.position))
      .attr('cy', center)
      .attr('r', radius);
  }
}
