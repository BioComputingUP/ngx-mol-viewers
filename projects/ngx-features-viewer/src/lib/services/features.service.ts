import { Trace } from '../features/trace';
import { Hierarchy } from '../hierarchy';
import { Feature } from '../features';
// Common dependencies
import { Injectable } from '@angular/core';

export function asTrace(feature: Hierarchy[number]): Trace<Feature> {
  // Case feature type is not trace
  if (feature.type !== 'trace') {
    // Unpack trace porperties from feature
    return { type: 'trace', values: [feature], label: feature.label }; 
  }
  // Otherwise, just return input trace
  return { ...feature, type: 'trace' };
}

@Injectable({ providedIn: 'root' })
export class FeaturesService {

  protected _traces!: Map<number, Trace<Feature>>;

  protected _parent!: Map<Trace<Feature>, number>;

  protected _children!: Map<Trace<Feature>, number[]>;

  /** Initialize hierarchy
   * 
   * 1. Extract each feature/trace in the hierarchy
   * 2. Wrap each feature in a trace
   * 3. Associate an unique identifier (ID) to each trace
   * 4. Associate a parent to each trace, if any
   * 5. Associate children to each parent trace, if any
   */
  public set hierarchy(hierarchy: Hierarchy) {
    // Initialize index
    let index = 0;
    // Copy input hierarchy
    hierarchy = [...hierarchy];
    // Initialize traces hashmap
    this._traces = new Map<number, Trace<Feature>>();
    // Initialize parent hashmap
    this._parent = new Map<Trace<Feature>, number>();
    // Initialize children hashmap
    this._children = new Map<Trace<Feature>, number[]>();
    // Loop through each 
    while (hierarchy.length > 0) {
      // Get first trace / feature
      const first = hierarchy.splice(0, 1).at(0) as Hierarchy[number];
      // Get nested features
      const { nested, ...params } = first;
      // Cast trace / feature to trace
      const trace = Object.assign(first, asTrace(params)) as Trace<Feature>;
      // Initialize children for current parent
      this._children.set(trace, []);
      // Loop through each nested trace / feature
      for (const child of (nested || [])) {
        // Associate current child to parent
        this._parent.set(child as Trace<Feature>, index);
        // Push child traces in hierarchy
        hierarchy.push(child);
      }
      // Get parent, if any
      const parent = this.getParent(trace);
      // Case parent exists
      if (parent) {
        // Get children for current parent
        const children = this._children.get(parent) as number[];
        // Store index of current trace as child
        children.push(index);
      }
      // Store parent
      this._traces.set(index, trace);
      // Finally, update index
      index++;
    }
  }

  public get traces() {
    return this._traces;
  }

  public getTrace(id: number) {
    return this.traces.get(id);
  }

  public getParent(trace: Trace<Feature>) {
    // Get parent index
    const index = this._parent.get(trace);
    // Return parent trace
    return index && this._traces.get(index);
  }

  public getBranch(trace: Trace<Feature>): Trace<Feature>[] {
    // Define branch
    const branch: Trace<Feature>[] = [];
    // Define leaves
    const leaves: Trace<Feature>[] = [trace];
    // Do until leaves are empty
    while(leaves.length > 0) {
      // Get parent trace
      const parent = leaves.pop() as Trace<Feature>;
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

  public getChildren(trace: Trace<Feature>): Trace<Feature>[] {
    // Get indices of child traces
    const indices = this._children.get(trace) as number[];
    // Return child traces
    return indices.map((i) => this._traces.get(i) as Trace<Feature>);
  }

}
