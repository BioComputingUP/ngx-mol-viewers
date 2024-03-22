import { Feature } from './feature';

export interface Trace<F extends Feature<unknown>> extends Feature<F> {
  // Type is undefined
  type: 'trace';
  // Whether to overlap or dodge features
  position?: 'overlap' | 'dodge';
  // Define values (features) for current trace
  values: F[];
}
