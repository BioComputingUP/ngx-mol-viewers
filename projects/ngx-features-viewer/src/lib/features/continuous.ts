import {BaseFeature} from './feature';

/**
 * A continuous feature is a feature that has a range of values.
 * @interface Continuous
 * @extends {BaseFeature}
 * @property {number} [min] The minimum value of the range.
 * @property {number} [max] The maximum value of the range.
 * @property {Array<number>} values The values of the feature, each value in the array represents a point to be
 * associated to the residue in the corresponding position.
 */
export interface Continuous extends BaseFeature {
  type: 'continuous';
  values: Array<number>;
  min?: number;
  max?: number;
  "stroke-width"?: number;
  "stroke-color"?: string;
  curveType?: 'curveStep' | 'curveBasis' | 'curveLinear';
  showArea?: boolean;
}
