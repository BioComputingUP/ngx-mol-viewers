import { Feature } from './feature';
import { Locus } from './loci';

export interface Pins extends Feature<Pick<Locus, 'start' | 'color'>> {
    // Override type
    type: 'pins';
}