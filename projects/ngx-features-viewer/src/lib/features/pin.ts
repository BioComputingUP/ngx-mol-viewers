import { BaseFeature } from './feature';

/**
 * A point feature that is represented by a single point in a position (index of the residue).
 * @interface Pin
 * @extends {BaseFeature}
 * @property {number} position The position of the point.
 * @property {boolean} [adjustToWidth] Adjust the size of the point to the width of the residue.
 * @property {number} [radius] The radius of the point.
 * @property {string} ['stroke-color'] The color of the stroke of the point.
 * @property {number} ['stroke-width'] The width of the stroke of the point
 */
export interface Pin extends BaseFeature {
  type: 'pin';
  position: number;
  adjustToWidth?: boolean;
  radius?: number;
  'stroke-color'?: string;
  'stroke-width'?: number;
}

