export interface Residue {
  pdbInsCode: string;  // Insertion code
  authSeqId: number;  // Sequence identifier
  authAsymId: string;  // Chain identifier
  authCompId1: string;  // Residue name
  authCompId3: string;  // Residue name
}

// Define map between amino-acid three-letter code and one-letter code
export const threeToOne = new Map<string, string>([
  ['ALA', 'A'], ['ARG', 'R'], ['ASN', 'N'], ['ASP', 'D'], ['CYS', 'C'], ['GLN', 'Q'], ['GLU', 'E'], ['GLY', 'G'], ['HIS', 'H'], ['ILE', 'I'],
  ['LEU', 'L'], ['LYS', 'K'], ['MET', 'M'], ['PHE', 'F'], ['PRO', 'P'], ['SER', 'S'], ['THR', 'T'], ['TRP', 'W'], ['TYR', 'Y'], ['VAL', 'V'],
]);

// Define map between amino-acid one-letter code and three-letter code
export const oneToThree = new Map<string, string>(Array.from(threeToOne.entries()).map(([k, v]) => [v, k]));
