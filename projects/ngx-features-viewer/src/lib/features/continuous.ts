import Feature from './feature';

export default interface Continuous extends Feature<number> {
    // Override type
    type: 'continuous';
    // Define min, max values
    min?: number;
    max?: number;
}