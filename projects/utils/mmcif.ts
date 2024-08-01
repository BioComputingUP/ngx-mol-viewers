import { Parser } from './parser';

export interface Residue {
  // Define sequence number
  authSeqId: number;
  // Define residue's insertion code
  pdbInsCode: string;
  // Define residue's name (one letter code)
  authCompId: string;
}

export type Residues = {
  [model: number]: {
    [chain: string]: Residue[]
  }
}

class MMCIFParser extends Parser<Residues> {

  readonly ThreeToOne = {
    'ALA': 'A', 'ARG': 'R', 'ASN': 'N', 'ASP': 'D', 'CYS': 'C',
    'GLN': 'Q', 'GLU': 'E', 'GLY': 'G', 'HIS': 'H', 'ILE': 'I',
    'LEU': 'L', 'LYS': 'K', 'MET': 'M', 'PHE': 'F', 'PRO': 'P',
    'SER': 'S', 'THR': 'T', 'TRP': 'W', 'TYR': 'Y', 'VAL': 'V'
  }

  readonly OneToThree = {
    'A': 'ALA', 'R': 'ARG', 'N': 'ASN', 'D': 'ASP', 'C': 'CYS',
    'Q': 'GLN', 'E': 'GLU', 'G': 'GLY', 'H': 'HIS', 'I': 'ILE',
    'L': 'LEU', 'K': 'LYS', 'M': 'MET', 'F': 'PHE', 'P': 'PRO',
    'S': 'SER', 'T': 'THR', 'W': 'TRP', 'Y': 'TYR', 'V': 'VAL'
  };

  public override parseText(text: string): Residues {
    // Split text in lines
    const lines = text.split('\n');
    // Initialize table, each item is a column
    const table: Record<string, unknown[]> = {};
    // Initialize column to index mapping
    const columns: Record<number, string> = {};
    // Loop through each line
    for (let i = 0; i < lines.length; i++) {
      // Sanitize line
      let line = lines[i] = (lines[i]).trim();
      // Check for lines starting with _atom
      if (line.startsWith('_atom_site.')) {
        // Initialize index for culumns
        let j = 0;
        // Loop through each following line
        for (j; i + j < lines.length; j++) {
          // Sanitize line
          line = lines[i + j] = (lines[i + j]).trim();
          // Loop through each column in table
          if (line.startsWith('_atom_site.')) {
            // Initialize column key
            const column = columns[j] = line;
            // Initialize column values
            table[column] = [];
          }
          // Otherwise, break loop
          else break;
        }
        // Update index
        i = i + j;
      }
      // Otherwise, check if columns are defined
      else if (table['_atom_site.id']) {
        // Loop through each row
        for (let j = 0; i + j < lines.length; j++) {
          // Define current line
          line = lines[i + j] = (lines[i + j]).trim();
          // Case line does not contain stop character
          if (line !== '#') {
            // Split line in columns
            const values = line.split(/\s+/);
            // Loop through each value
            for (const [index, value] of values.entries()) {
              // Get column key
              const column = columns[index];
              // Add value to column
              table[column].push(value.replace(/\?/g, ''));
            }
          }
          // Otherwise, break all loops
          else i = j = lines.length;
        }
      }
    }
    // Initialize residues
    const residues: Residues = {};
    // Define length of table (as number of items in first column)
    const length = table['_atom_site.id'].length;
    // Group each item in table by `author_asym_id`
    for (let i = 0; i < length; i++) {
      // Get chain identifier
      const authAsymId = '' + table['_atom_site.auth_asym_id'][i];
      // Get model number
      const pdbxPDBModelNum = parseInt('' + table['_atom_site.pdbx_PDB_model_num'][i]);
      // Get residue name
      const authCompId = '' + table['_atom_site.label_comp_id'][i];
      // Get residue number
      const authSeqId = parseInt('' + table['_atom_site.auth_seq_id'][i]);
      // Get residue insertion code
      const pdbxPDBInsCode = '' + table['_atom_site.pdbx_PDB_ins_code'][i];
      // Initialize model
      residues[pdbxPDBModelNum] = residues[pdbxPDBModelNum] || {};
      // Initialize chain
      const residueList = residues[pdbxPDBModelNum][authAsymId] = residues[pdbxPDBModelNum][authAsymId] || [];
      // Initialize residue
      const currentResidue = { authSeqId, pdbInsCode: pdbxPDBInsCode, authCompId: authCompId };
      const previousResidue = residueList.length > 0 ? residueList[residueList.length - 1] : undefined;
      // Define previous residue
      if (!previousResidue || previousResidue.authSeqId !== authSeqId || previousResidue.pdbInsCode !== pdbxPDBInsCode) {
        // Add residue to chain
        residueList.push(currentResidue);
      }
    }
    // Return residues
    return residues;
  }
}

export const MMCIF = new MMCIFParser();