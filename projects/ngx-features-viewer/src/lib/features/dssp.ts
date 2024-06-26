import {BaseFeature} from "./feature";
import {Range} from "./locus";

/**
 * The code that represents the secondary structure of the protein.
 * @type {DSSPCode}
 */
export type DSSPCode = 'G' | 'H' | 'I' | 'E' | 'B' | 'S' | 'T' | 'C' | '-'

/**
 * DSSP feature is a feature that has a range of values and a code that represents the secondary structure of the protein.
 * @interface DSSP
 * @extends {BaseFeature, Range}
 * @property {DSSPCode} code The code that represents the secondary structure of the protein.
 */
export interface DSSP extends BaseFeature, Range {
  type: 'dssp';
  code: DSSPCode;
}

export type DSSPShapes = "helix" | "sheet" | "coil" | "turn";

export function dsspShape(code: DSSPCode): DSSPShapes {
  switch (code) {
    case 'G':
    case 'H':
    case 'I':
      return "helix";
    case 'E':
    case 'B':
      return "sheet";
    case 'T':
      return "turn";
    case 'C':
    case 'S':
    case "-":
      return "coil";
  }
}

export const DSSPPaths = {
  'helix': "M 1.2754258,8.4557039 C 1.6450449,8.4539683 2.0146596,6.4441581 2.3842743,4.23333 2.753889,2.0225118 3.123508,0.01270245 3.4931228,0.01096606 l 1.4784638,-3.35e-6 C 4.6019718,0.0126991 4.2323528,2.0225085 3.8627383,4.2333266 3.4931236,6.4441547 3.1235087,8.453965 2.7538898,8.4557004 Z",
  'turn': "m 5 4 q 5 -4 4 -14 q 0 -7 7.9 -8.6 q 3.1 -0.4 7.2 0 q 6.9 1.6 6.9 8.6 q 0 10 3 14 c 2 2 -1 6 -4 3 q -4 -7 -4 -17 c 0 -5 -12 -5 -12 0 q 0 10 -5 17 c -3 3 -6 -1 -4 -3 z m 9 -9 c 2.2 -6 11.2 7 12 0 c -2.1 -6 -10.1 7 -12 0 z",
  // The sheet path is calculated at runtime
  'sheet': "",
  // The coil path is calculated at runtime
  'coil': ""
}
