import {BaseFeature} from './feature';

/**
 * A point feature that is represented by a single point in a position (index of the residue).
 * @interface Pin
 * @extends {BaseFeature}
 * @property {number} position The position of the point.
 * @property {string} [borderColor] The border color of the point.
 */
export interface Pin extends BaseFeature {
  type: 'pin';
  position: number;
  borderColor?: string;
}

