import { Features } from './features';

// Define single feature (might be trace also)
export type Feature = Features[number] & {
  // Define nested features
  nested?: Feature[];
};

// Define hierarchy
export type Hierarchy = Feature[];

// export const hierarchy: Hierarchy = [
//   { 
//     label: 'Feature #1', 
//     type: 'loci',        
//     values: [
//       {start: 1, end: 2}, 
//       {start: 4, end: 7}
//     ],
//   },
//   { 
//     label: 'Feature #2', 
//     type: 'continuous',  
//     values: [1, 2, 3],
//   },
//   { 
//     label: 'Feature #3', 
//     type: 'trace',       
//     values: [
//       {
//         type: 'loci', 
//         values: [{ start: 1, end: 2 }]
//       },
//       {
//         type: 'continuous',
//         values: [1, 2, 3, 4]
//       },
//     ]
//   },
//   { 
//     label: 'Feature #4', 
//     type: 'trace',
//     // Define values for current trace 
//     values: [],
//     // Define nested traces
//     nested: [

//     ]
//   }
// ]