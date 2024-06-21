import {Continuous} from "./continuous";
import {DSSP} from "./dssp";
import {Pin} from "./pin";
import {Locus} from "./locus";

/**
 * Type that can be associated with a feature in its `type` property.
 * @type FeatureType
 */
export type FeatureType = 'continuous' | 'locus' | 'dssp' | 'pin';

/**
 * Base feature interface
 * @interface {Feature}
 * @property {FeatureType} type The type of the feature.
 * @property {string} [label] The label of the feature.
 * @property {string} [color] The color of the feature.
 */
export interface BaseFeature {
  type: FeatureType;
  label?: string;
  color?: string;
}

/**
 * Any feature that can be displayed in the features viewer.
 */
export type Feature = Continuous | Locus | DSSP | Pin;
