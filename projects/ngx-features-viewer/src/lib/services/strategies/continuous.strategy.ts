import * as d3 from 'd3';
import { FeatureStrategy, FeatureRenderOptions } from './feature-strategy.interface';
import { Continuous } from '../../features/continuous';
import { Feature } from '../../features/feature';

export class ContinuousStrategy implements FeatureStrategy {
  render(
    container: d3.Selection<SVGGElement, any, any, any>,
    featureData: Feature,
    options: FeatureRenderOptions
  ): void {
    const feature = featureData as Continuous;
    const { scale, bottom, trace, top } = options;

    function rescaleY(yValue: number): number {
      return (
        bottom +
        ((yValue - trace.domain.min) / (trace.domain.max - trace.domain.min)) * (top - bottom)
      );
    }

    const values = feature.values;
    const xy: [number, number][] = values.map((v: number, i: number) => [i + 1, v]);
    xy.unshift([0.5, xy[0][1]]);
    xy.push([values.length + 0.5, xy[xy.length - 1][1]]);

    let curveType: d3.CurveFactory = d3.curveStep;
    if (feature.curveType) {
      curveType = d3[feature.curveType as keyof typeof d3] as d3.CurveFactory;
    }

    let lineGenerator: d3.Line<[number, number]> | d3.Area<[number, number]>;

    if (feature.showArea) {
      lineGenerator = d3.area<[number, number]>()
        .curve(curveType)
        .x(([x]) => scale.x(x))
        .y1(([, y]) => rescaleY(y))
        .y0(bottom);
    } else {
      lineGenerator = d3.line<[number, number]>()
        .curve(curveType)
        .x(([x]) => scale.x(x))
        .y(([, y]) => rescaleY(y));
    }

    container
      .selectAll<SVGPathElement, Continuous>('path')
      .data([feature])
      .join('path')
      .attr('stroke', (f) => f['stroke-color'] || f.color || 'black')
      .attr('stroke-opacity', (f) => f.opacity || 1)
      .attr('stroke-width', (f) => f['stroke-width'] || 1)
      .attr('fill', (f) => (f.showArea ? f.color || 'black' : 'none'))
      .attr('fill-opacity', (f) => f.opacity || 1)
      .style('stroke-dasharray', (f) => f['stroke-dasharray'] || '')
      .attr('d', lineGenerator(xy));
  }
}
