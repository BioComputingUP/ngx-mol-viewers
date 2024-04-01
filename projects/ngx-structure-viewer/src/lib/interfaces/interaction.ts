import { Vec3 } from "molstar/lib/mol-math/linear-algebra";

export interface Interactor {
  'atom.id'?: number; // Unique atom identifier
  'residue.id'?: string, // Residue identifier (sequence number, insertion code)
  'chain.id'?: string; // Chain identifier
  'atom.name'?: string; // Atom name
  // Define coordinate
  coordinates?: Vec3;
}

export interface Interaction { 
  // Define start, end atoms
  from: Interactor; 
  to: Interactor;
  // Define interaction label
  label?: string;
  // Define interaction color
  color?: string;
  // Define interaction size
  size?: number;
}
