import { Feature, Trace } from './features';
import { Settings } from './settings';

type Item = (Feature | Trace<Feature>) & Partial<Settings> & {
  // Feature has always unique identifier
  id?: number;
  // Whether feature is expanded or not
  expanded?: boolean;
  // Define nested features
  nested?: Array<Item>;
};

// Define hierarchy
export type Hierarchy = Array<Item>;
