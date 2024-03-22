import { Feature } from './feature';

export interface Locus<T = number> { 
  // Define start, end position  
  start: T; 
  end: T;
  // Define color of loci
  color?: string; 
}

export interface Loci extends Feature<Locus> {
  // Override type
  type: 'loci';
}
