import Feature from "./feature";

// NOTE It uses DSSP values { helix: G/H/I, strand: E/B, loop: S/T/C, undefined: - }
export default interface DSSP extends Feature<'G' | 'H' | 'I' | 'E' | 'B' | 'S' | 'T' | 'C' | '-'> {
  // Override type
  type: 'dssp';
}