import * as d3 from 'd3';
import { Feature } from '../../features/feature';
import { InternalTrace } from '../../trace';
import { Scale } from '../initialize.service';
import { Settings } from '../../settings';

export interface FeatureRenderOptions {
  scale: Scale;
  settings: Settings;
  trace: InternalTrace;
  featureIdx: number;
  charWidth: number;
  cw: number;
  top: number;
  bottom: number;
  center: number;
  currentDomainStart: number;
  currentDomainEnd: number;
  coilPoints?: Map<string, number[]>;
}

export interface FeatureStrategy {
  render(
    container: d3.Selection<SVGGElement, Feature, any, any>,
    feature: Feature,
    options: FeatureRenderOptions
  ): void;
}
