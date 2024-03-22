// Import available features
import { Continuous } from './features/continuous';
import { Loci } from './features/loci';
import { Pins } from './features/pins';
import { DSSP } from './features/dssp';
// Import trace to combine features
import { Trace } from './features/trace';

export type Feature = Continuous | Loci | Pins | DSSP;

export type Features = Array<Feature | Trace<Feature>>;