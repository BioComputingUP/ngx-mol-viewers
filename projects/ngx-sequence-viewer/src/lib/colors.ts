export interface ColorMap {
  // Define amino-acid code to color mapping
  [key: string]: { 'background-color': string; 'text-color': string };
}

// Define ClustalX color scheme
export const ClustalX: ColorMap = {
  A: { 'background-color': '#FFBF00', 'text-color': '#000000' },
  R: { 'background-color': '#FF0000', 'text-color': '#FFFFFF' },
  N: { 'background-color': '#00FFFF', 'text-color': '#000000' },
  D: { 'background-color': '#0000FF', 'text-color': '#FFFFFF' },
  C: { 'background-color': '#FFFF00', 'text-color': '#000000' },
  Q: { 'background-color': '#00FF00', 'text-color': '#000000' },
  E: { 'background-color': '#FF00FF', 'text-color': '#FFFFFF' },
  G: { 'background-color': '#808080', 'text-color': '#FFFFFF' },
  H: { 'background-color': '#008000', 'text-color': '#FFFFFF' },
  I: { 'background-color': '#FFA500', 'text-color': '#000000' },
  L: { 'background-color': '#FFA500', 'text-color': '#000000' },
  K: { 'background-color': '#FF0000', 'text-color': '#FFFFFF' },
  M: { 'background-color': '#FFA500', 'text-color': '#000000' },
  F: { 'background-color': '#FFA500', 'text-color': '#000000' },
  P: { 'background-color': '#800080', 'text-color': '#FFFFFF' },
  S: { 'background-color': '#00FF00', 'text-color': '#000000' },
  T: { 'background-color': '#00FF00', 'text-color': '#000000' },
  W: { 'background-color': '#FFA500', 'text-color': '#000000' },
  Y: { 'background-color': '#FFA500', 'text-color': '#000000' },
  V: { 'background-color': '#FFA500', 'text-color': '#000000' },
  B: { 'background-color': '#FFA500', 'text-color': '#000000' },
  Z: { 'background-color': '#FFA500', 'text-color': '#000000' },
  X: { 'background-color': '#FFA500', 'text-color': '#000000' },
  '-': { 'background-color': '#FFFFFF', 'text-color': '#000000' },
};

// Define color scheme based on physical characteristics
export const Physical: ColorMap = {
  // Nonpolar amino acids
  G: { 'background-color': '#808080', 'text-color': '#FFFFFF' }, // Glycine
  A: { 'background-color': '#808080', 'text-color': '#FFFFFF' }, // Alanine
  V: { 'background-color': '#808080', 'text-color': '#FFFFFF' }, // Valine
  L: { 'background-color': '#808080', 'text-color': '#FFFFFF' }, // Leucine
  I: { 'background-color': '#808080', 'text-color': '#FFFFFF' }, // Isoleucine
  M: { 'background-color': '#808080', 'text-color': '#FFFFFF' }, // Methionine
  F: { 'background-color': '#808080', 'text-color': '#FFFFFF' }, // Phenylalanine
  W: { 'background-color': '#808080', 'text-color': '#FFFFFF' }, // Tryptophan
  P: { 'background-color': '#808080', 'text-color': '#FFFFFF' }, // Proline

  // Polar amino acids
  S: { 'background-color': '#00FF00', 'text-color': '#000000' }, // Serine
  T: { 'background-color': '#00FF00', 'text-color': '#000000' }, // Threonine
  C: { 'background-color': '#00FF00', 'text-color': '#000000' }, // Cysteine
  Y: { 'background-color': '#00FF00', 'text-color': '#000000' }, // Tyrosine
  N: { 'background-color': '#00FF00', 'text-color': '#000000' }, // Asparagine
  Q: { 'background-color': '#00FF00', 'text-color': '#000000' }, // Glutamine

  // Acidic amino acids
  D: { 'background-color': '#FF0000', 'text-color': '#FFFFFF' }, // Aspartic Acid
  E: { 'background-color': '#FF0000', 'text-color': '#FFFFFF' }, // Glutamic Acid

  // Basic amino acids
  R: { 'background-color': '#0000FF', 'text-color': '#FFFFFF' }, // Arginine
  H: { 'background-color': '#0000FF', 'text-color': '#FFFFFF' }, // Histidine
  K: { 'background-color': '#0000FF', 'text-color': '#FFFFFF' }, // Lysine

  // Undefined or any other amino acid
  B: { 'background-color': '#FFA500', 'text-color': '#000000' },
  Z: { 'background-color': '#FFA500', 'text-color': '#000000' },
  X: { 'background-color': '#FFA500', 'text-color': '#000000' },
  '-': { 'background-color': '#FFFFFF', 'text-color': '#000000' },
};

// Define custom ZAPPO scheme
// Original ZAPPO scheme: 
// Custom colorblind Wong palette: 
export const ZAPPO: ColorMap = {
  // Aliphatic/hydrophobic
  I: { 'background-color': '#CC79A7', 'text-color': 'black' },
  L: { 'background-color': '#CC79A7', 'text-color': 'black' },
  V: { 'background-color': '#CC79A7', 'text-color': 'black' },
  A: { 'background-color': '#CC79A7', 'text-color': 'black' },
  M: { 'background-color': '#CC79A7', 'text-color': 'black' },
  // Aromatic
  F: { 'background-color': '#E69F00', 'text-color': 'black' },
  W: { 'background-color': '#E69F00', 'text-color': 'black' },
  Y: { 'background-color': '#E69F00', 'text-color': 'black' },
  // Positive charge
  K: { 'background-color': '#0072B2', 'text-color': 'white' },
  R: { 'background-color': '#0072B2', 'text-color': 'white' },
  H: { 'background-color': '#0072B2', 'text-color': 'white' },
  // Negative charge
  D: { 'background-color': '#D55E00', 'text-color': 'black' },
  E: { 'background-color': '#D55E00', 'text-color': 'black' },
  // Hydrophilic
  N: { 'background-color': '#009E73', 'text-color': 'black' },
  Q: { 'background-color': '#009E73', 'text-color': 'black' },
  S: { 'background-color': '#009E73', 'text-color': 'black' },
  T: { 'background-color': '#009E73', 'text-color': 'black' },
  // Conformationally special
  P: { 'background-color': '#56B4E9', 'text-color': 'black' },
  G: { 'background-color': '#56B4E9', 'text-color': 'black' },
  // Cysteine
  C: { 'background-color': '#F0E442', 'text-color': 'black' },
}