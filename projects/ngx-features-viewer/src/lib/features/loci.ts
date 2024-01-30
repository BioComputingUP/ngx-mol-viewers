import Feature from "./feature";

export interface Locus<T = number> { 
    start: T; 
    end: T 
}

export default interface Loci extends Feature<Locus> {
  // Override type
  type: 'loci';
}