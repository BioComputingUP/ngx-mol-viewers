import {BaseFeature} from "./feature";
import {Range} from "./locus";

/**
 * The code that represents the secondary structure of the protein.
 * @type {Code}
 */
type Code = 'G' | 'H' | 'I' | 'E' | 'B' | 'S' | 'T' | 'C' | '-'

/**
 * DSSP feature is a feature that has a range of values and a code that represents the secondary structure of the protein.
 * @interface DSSP
 * @extends {BaseFeature, Range}
 * @property {Code} code The code that represents the secondary structure of the protein.
 */
export interface DSSP extends BaseFeature, Range {
  type: 'dssp';
  code: Code;
}
