import { Feature } from './feature';
import { Locus } from './loci';

// Define DSSP code
export type Code = 'G' | 'H' | 'I' | 'E' | 'B' | 'S' | 'T' | 'C' | '-'

// NOTE It uses DSSP values { helix: G/H/I, strand: E/B, loop: S/T/C, undefined: - }
export interface DSSP extends Feature<Locus & { code: Code }> {
  // Override type
  type: 'dssp';
}