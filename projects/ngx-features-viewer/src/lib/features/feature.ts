import { Settings } from '../settings';

export interface Feature<T> extends Partial<Settings> {
  // Define label for current feature
  label?: string;
  // Define feature type
  type?: string;
  // Define values for current feature
  values: T[];
}
