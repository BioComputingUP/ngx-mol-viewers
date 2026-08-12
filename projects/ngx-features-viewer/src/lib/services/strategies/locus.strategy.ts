import * as d3 from 'd3';
import { FeatureStrategy, FeatureRenderOptions } from './feature-strategy.interface';
import { Locus } from '../../features/locus';
import { Feature } from '../../features/feature';

export class LocusStrategy implements FeatureStrategy {
  render(
    container: d3.Selection<SVGGElement, any, any, any>,
    featureData: Feature,
    options: FeatureRenderOptions
  ): void {
    const feature = featureData as Locus;
    const { scale, settings, cw, center, trace } = options;
    let { top } = options;

    if (feature.height) {
      const cs = options.trace.options?.['content-size'] || settings['content-size'];
      top = top + (cs - feature.height) / 2;
    }

    const featureWidth = scale.x(feature.end + 0.5) - scale.x(feature.start);

    // D3 Data-Join for the rect
    container
      .selectAll<SVGRectElement, Locus>('rect')
      .data([feature])
      .join('rect')
      .attr('stroke', (f) => f['stroke-color'] || 'none')
      .attr('stroke-opacity', 1.0)
      .attr('stroke-width', (f) => f['stroke-width'] || 0)
      .attr('fill', (f) => f.color || 'white')
      .attr('fill-opacity', (f) => f.opacity || 1)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('x', (f) => scale.x(f.start - 0.5))
      .attr('y', top)
      .attr('height', (f) => (f.height !== undefined ? f.height : options.bottom - options.top))
      .attr('width', (f) => cw * (f.end - f.start + 1));

    // D3 Data-Join for the text label
    if (feature.label) {
      let textColor = feature['text-color'] || settings['text-color'];
      if (!textColor) {
        const featureColor = d3.hsl(d3.color(feature.color || 'black')!);
        textColor = Number.isNaN(featureColor.l) || featureColor.l > 0.5 ? 'black' : 'white';
      }

      const labelWidth = options.charWidth * feature.label.length;
      const opacity = labelWidth + 8 < featureWidth ? 1 : 0;

      container
        .selectAll<SVGTextElement, Locus>('text')
        .data([feature])
        .join('text')
        .attr('dominant-baseline', 'central')
        .style('text-anchor', 'start')
        .attr('x', (f) => scale.x(f.start - 0.5))
        .attr('y', center)
        .attr('dx', 8)
        .attr('opacity', opacity)
        .attr('fill', textColor)
        .text((f) => f.label || '');
    } else {
      container.selectAll('text').remove();
    }
  }
}
