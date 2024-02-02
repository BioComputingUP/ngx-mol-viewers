import Feature from "./feature";
import * as I from "./loci";

// Define DSSP locus
interface Locus extends I.Locus {
  // Define available DSSP codes
  code: 'G' | 'H' | 'I' | 'E' | 'B' | 'S' | 'T' | 'C' | '-';
}

// NOTE It uses DSSP values { helix: G/H/I, strand: E/B, loop: S/T/C, undefined: - }
export default interface DSSP extends Feature<Locus> {
  // Override type
  type: 'dssp';
}