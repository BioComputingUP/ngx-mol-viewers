import { Injectable } from '@angular/core';
import { Hierarchy } from '../hierarchy';

// Define local trace
type Trace = Hierarchy[number] & { type: 'trace' };

@Injectable({ providedIn: 'root' })
export class FeaturesService {

  public set hierarchy(hierarchy: Hierarchy) {
    this.setHierarchy(hierarchy);
  }

  protected _traces = new Map<number, Trace>();

  public get traces() {
    return this._traces;
  }

  protected _parent = new Map<Trace, number>();

  protected _children = new Map<Trace, number[]>();

  // /** Initialize hierarchy
  //  * 
  //  * 1. Extract each feature/trace in the hierarchy
  //  * 2. Wrap each feature in a trace
  //  * 3. Associate an unique identifier (ID) to each trace
  //  * 4. Associate a parent to each trace, if any
  //  * 5. Associate children to each parent trace, if any
  //  */
  // public set hierarchy(hierarchy: Hierarchy) {
  //   // Initialize index
  //   let index = 0;
  //   // Copy input hierarchy
  //   hierarchy = [...hierarchy];
  //   // Initialize traces hashmap
  //   this._traces = new Map<number, Trace<Feature>>();
  //   // Initialize parent hashmap
  //   this._parent = new Map<Trace<Feature>, number>();
  //   // Initialize children hashmap
  //   this._children = new Map<Trace<Feature>, number[]>();
  //   // Loop through each 
  //   while (hierarchy.length > 0) {
  //     // Get first trace / feature
  //     const first = hierarchy.splice(0, 1).at(0) as Hierarchy[number];
  //     // Get nested features
  //     const { nested, ...params } = first;
  //     // Cast trace / feature to trace
  //     const trace = Object.assign(first, asTrace(params)) as Trace<Feature>;
  //     // Initialize children for current parent
  //     this._children.set(trace, []);
  //     // Loop through each nested trace / feature
  //     for (const child of (nested || [])) {
  //       // Associate current child to parent
  //       this._parent.set(child as Trace<Feature>, index);
  //       // Push child traces in hierarchy
  //       hierarchy.push(child);
  //     }
  //     // Get parent, if any
  //     const parent = this.getParent(trace);
  //     // Case parent exists
  //     if (parent) {
  //       // Get children for current parent
  //       const children = this._children.get(parent) as number[];
  //       // Store index of current trace as child
  //       children.push(index);
  //     }
  //     // Store parent
  //     this._traces.set(index, trace);
  //     // Finally, update index
  //     index++;
  //   }
  // }

  public setHierarchy(_hierarchy: Hierarchy) {
    // Initialize index
    let index = 0;
    // Define hierarchy array in order to not mutate input
    let hierarchy = [..._hierarchy];
    // Do until hierarchy is empty
    while (hierarchy.length > 0) {
      // Remove first trace from hierarchy
      const [first] = hierarchy.splice(0, 1);
      const nested = first.nested || [];
      // Initialize parsed traces
      const traces = new Array<Trace>();
      // Loop through first, nested trace
      for (const feature of [first, ...nested]) {
        // Wrap feature in trace, if not already a trace
        const trace = feature.type === 'trace' ? feature : {
          type: 'trace' as const,
          values: [feature],
          label: feature.label,
          id: undefined,
          expanded: undefined
        };
        // Update trace properties
        trace.id = trace.id !== undefined ? trace.id : index++;
        trace.expanded = trace.expanded === false ? false : true;
        // Store identifier to trace
        this._traces.set(trace.id, trace);
        // Store trace in parsed traces
        traces.push(trace);
      }
      // Separate parent, child traces
      const parent = traces[0];
      const children = traces.slice(1);
      // Associate children to parent
      children.forEach((child) => this._parent.set(child, parent.id!));
      // Associate parent to children
      this._children.set(parent, children.map((child) => child.id!));
      // Insert nested traces in hierarchy
      hierarchy = [...traces.slice(1), ...hierarchy];
    }
  }

  // TODO
  public getTrace(id: number): Trace {
    return this.traces.get(id)!;
  }

  public getParent(trace: Trace) {
    // Get parent index
    const index = this._parent.get(trace);
    // Return parent trace
    return index && this._traces.get(index);
  }

  public getBranch(trace: Trace): Hierarchy {
    // Define branch
    const branch: Hierarchy = [];
    // Define leaves
    const leaves: Hierarchy = [trace];
    // Do until leaves are empty
    while (leaves.length > 0) {
      // Get parent trace
      const parent = leaves.pop() as Trace;
      // Update branch
      branch.push(parent);
      // Get children
      const children = this.getChildren(parent);
      // Update leaves
      leaves.push(...children);
    }
    // Return branch
    return branch;
  }

  public getChildren(trace: Trace): Hierarchy {
    // Get indices of child traces
    const indices = this._children.get(trace) || [];
    // Return child traces
    return indices.map((i) => this._traces.get(i)!);
  }

}
