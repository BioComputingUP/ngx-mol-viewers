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
  min?: number;
  max?: number;
  values: Array<number>;
}
