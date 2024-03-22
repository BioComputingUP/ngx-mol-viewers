import { Feature } from './feature';

export interface Continuous extends Feature<number> {
    // Override type
    type: 'continuous';
    // Define min, max values
    min?: number;
    max?: number;
}
