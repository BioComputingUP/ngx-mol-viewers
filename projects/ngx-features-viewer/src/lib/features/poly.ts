import { Pin } from "./pin";

/**
 * A point feature that is represented by a single regular polygon in a position (index of the residue).
 * @interface Poly
 * @extends {Pin}
 * @property {number} sides The number of sides of the polygon.
 */
export interface Poly extends Omit<Pin, 'type'> {
  type: 'poly';
  sides: number;
}

