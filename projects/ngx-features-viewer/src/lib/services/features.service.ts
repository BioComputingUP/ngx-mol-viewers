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
    // Loop through each 
    while (hierarchy.length > 0) {
      // Extract first element
      const { nested, ...first } = { nested: [], type: undefined, ...hierarchy.pop() };
      // Case first element exists
      if (first.type) {
        // Eventually, wrap current feature in trace
        const parent = asTrace(first);
        // Store parent trace
        this._traces.set(index, parent);
        // Eventually, wrap nested features in traces
        nested.forEach((feature) => {
          // Check nested feature type
          const child = asTrace(feature);
          // Associate child to parent trace
          this._parent.set(child, index);
          // Push child traces in hierarchy
          hierarchy.push(child);
        });
        // Update index
        index++;
      }
    }

    // Initialize children hashmap
    this._children = new Map<Trace<Feature>, number[]>();
    // Loop through each child (to parent) 
    this._traces.forEach((child, index) => {
      // Get parent index
      const parent = this.getParent(child);
      // Get children
      const children = this._children.get(parent) || [];
      // Update children list
      children.push(index);
      // Update children map
      this._children.set(parent, children);
    });
  }

  public get traces() {
    return this._traces;
  }

  public getTrace(id: number) {
    return this.traces.get(id);
  }

  public getParent(trace: Trace<Feature>): Trace<Feature> {
    // Get parent index
    const index = this._parent.get(trace) as number;
    // Return parent trace
    return this._traces.get(index) as Trace<Feature>;
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
