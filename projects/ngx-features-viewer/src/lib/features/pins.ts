import Feature from "./feature";
import { Locus } from "./loci";

export type Pin = Pick<Locus, 'start' | 'color'>;

export default interface Pins extends Feature<Pin> {
    // Override type
    type: 'pins';
}