import { FeatureType } from '../../features/feature';
import { FeatureStrategy } from './feature-strategy.interface';
import { LocusStrategy } from './locus.strategy';
import { ContinuousStrategy } from './continuous.strategy';
import { PinStrategy } from './pin.strategy';
import { PolyStrategy } from './poly.strategy';
import { DSSPStrategy } from './dssp.strategy';

export class StrategyFactory {
  private static strategies: Partial<Record<FeatureType, FeatureStrategy>> = {
    'locus': new LocusStrategy(),
    'continuous': new ContinuousStrategy(),
    'pin': new PinStrategy(),
    'poly': new PolyStrategy(),
    'dssp': new DSSPStrategy()
  };

  public static getStrategy(type: FeatureType): FeatureStrategy | undefined {
    return this.strategies[type];
  }
}
