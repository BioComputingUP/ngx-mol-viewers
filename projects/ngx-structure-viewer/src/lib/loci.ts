export interface Locus<T = string> {
    // Define start, end position
    start: T;
    end: T;
    // Define chain
    chain: string;
    // Define color for locus
    color?: string;
}

export type Loci = Array<Locus>;
