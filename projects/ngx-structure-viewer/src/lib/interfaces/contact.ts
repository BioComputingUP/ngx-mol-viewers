export type Coordinate = { x: number; y: number; z: number; };

// TODO
export type Index = { residue: string, atom: string; }

export type Atom = Coordinate | Index;

export interface Contact { 
  a: Atom; 
  b: Atom;
}