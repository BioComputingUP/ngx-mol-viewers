import { Features } from './features';

// Define single feature (might be trace also)
export type Feature = Features[number] & {
  // Define nested features
  nested?: Feature[];
};

// Define hierarchy
export type Hierarchy = Feature[];
