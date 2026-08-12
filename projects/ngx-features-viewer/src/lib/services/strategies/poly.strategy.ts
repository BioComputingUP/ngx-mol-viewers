import * as d3 from 'd3';
import { FeatureStrategy, FeatureRenderOptions } from './feature-strategy.interface';
import { Poly } from '../../features/poly';
import { Feature } from '../../features/feature';

export class PolyStrategy implements FeatureStrategy {
  render(
    container: d3.Selection<SVGGElement, any, any, any>,
    featureData: Feature,
    options: FeatureRenderOptions
  ): void {
    const feature = featureData as Poly;
    const { scale, settings, center, trace } = options;

    const sides = feature.sides || 3;
    let radius: number;
    if (feature.adjustToWidth) {
      radius = Math.min(
        trace.options?.['content-size'] || settings['content-size'],
        scale.x(1) - scale.x(0)
      ) / 2;
    } else {
      radius = feature.radius || 8;
    }

    const angle = (2 * Math.PI) / sides;
    const rotationAdjustment = Math.PI / 2 - Math.PI / sides;

    const points = Array.from({ length: sides }, (_, i) => {
      const x = radius * Math.cos(i * angle + rotationAdjustment);
      const y = radius * Math.sin(i * angle + rotationAdjustment);
      return [x + scale.x(feature.position), y + center];
    });

    container
      .selectAll<SVGPolygonElement, Poly>('polygon')
      .data([feature])
      .join('polygon')
      .attr('stroke', (f) => f['stroke-color'] || 'black')
      .attr('stroke-opacity', (f) => f.opacity || 1)
      .attr('stroke-width', (f) => f['stroke-width'] || 1)
      .attr('fill', (f) => f.color || 'black')
      .attr('fill-opacity', (f) => f.opacity || 1)
      .attr('points', points.map((point) => point.join(',')).join(' '));
  }
}
