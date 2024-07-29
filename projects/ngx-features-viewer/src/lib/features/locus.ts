import { BaseFeature } from "./feature";

/**
 * Range is a range of values with a start and an end.
 * @type {Range}
 */
export type Range = {
  start: number;
  end: number;
}

/**
 * Loci feature is a feature that has a range of values
 * @interface Locus
 * @extends {BaseFeature, Range}
 */
export interface Locus extends BaseFeature, Range {
  type: 'locus';
  height?: number;
  'text-color'?: string;
  'stroke-color'?: string;
  'stroke-width'?: number;
}
