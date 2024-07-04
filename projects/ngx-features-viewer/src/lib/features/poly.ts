import { BaseFeature } from './feature';

/**
 * A point feature that is represented by a single regular polygon in a position (index of the residue).
 * @interface Poly
 * @extends {BaseFeature}
 * @property {number} position The position of the polygon.
 * @property {number} sides The number of sides of the polygon.
 * @property {number} [radius] The radius of the circle that circumscribes the polygon.
 * @property {string} [stroke-color] The border color of the polygon.
 * @property {number} [stroke-width] The border width of the polygon.
 */
export interface Poly extends BaseFeature {
  type: 'poly';
  position: number;
  sides: number;
  radius?: number;
  'stroke-color'?: string;
  'stroke-width'?: number;
}

