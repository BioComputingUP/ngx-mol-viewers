import {Injectable} from '@angular/core';
import {InternalTrace, InternalTraces, Traces} from "../trace";
import {Feature} from "../features/feature";


@Injectable({providedIn: 'root'})
export class FeaturesService {
  protected traceMap = new Map<number, InternalTrace>();
  protected internalTraces!: InternalTraces;

  protected _parent = new Map<InternalTrace, number>();
  protected _children = new Map<InternalTrace, number[]>();

  public set traces(traces: Traces) {
    this.internalTraces = [];
    // Initialize the index used as id for an InternalTrace
    let idx = 0;
    // Recursively convert traces to internal traces, setting level as the nesting level in the hierarchy
    const convert = (traces: Traces, level: number): InternalTraces => {
      return traces.map((trace) => {
        // Remove nested from the trace, as it will be processed recursively
        const {nested, ...tmpTrace} = trace;
        // Initialize internal trace
        const internalTrace: InternalTrace = {
          ...tmpTrace,
          id: idx++,
          expanded: false,
          show: level === 0,
          level
        };
        this.traceMap.set(internalTrace.id, internalTrace);
        // Recursively convert nested traces
        internalTrace.nested = convert(nested || [], level + 1);
        // Sort the features by type, so to have the continuous features first
        internalTrace.features = internalTrace.features.sort((a, b) => {
          // -1 if 'a' is continuous
          if (a.type !== 'continuous') return -1;
          if (b.type !== 'continuous') return 1;
          // Otherwise, return 0
          return 0;
        });
        // Set the parent / children relationship
        internalTrace.nested.forEach((child) => {
          this._parent.set(child, internalTrace.id);
          this._children.set(internalTrace, [...(this._children.get(internalTrace) || []), child.id]);
        });
        // Return internal trace
        return internalTrace;
      });
    }
    // Set internal traces
    this.internalTraces = convert(traces, 0);
  }

  public get traces(): InternalTraces {
    return this.internalTraces;
  }

  public get tracesNoNesting(): InternalTraces {
    return Array.from(this.traceMap.values());
  }

  /**
   * Get all the features in the traces, setting the key as `trace-${trace.id}-feature-${index}`
   * @returns (Map<string, Feature>) - The features map
   */
  public get features() {
    // Get traces
    const traces = this.traces;
    // Initialize features
    const features = new Map<string, Feature>();
    // Loop through each trace
    for (const trace of traces.values()) {
      // Loop through each feature
      for (const [i, feature] of Object.entries(trace.features)) {
        // Store feature
        features.set(`trace-${trace.id}-feature-${i}`, feature);
      }
    }
    // Return features map
    return features;
  }

  public getTrace(id: number): InternalTrace {
    return this.traceMap.get(id)!;
  }

  /**
   * Get the parent trace of the given trace, if any
   * @param trace - The trace for which to get the parent
   * @returns (InternalTrace | undefined) - The parent trace or undefined if the trace has no parent
   */
  public getParentTrace(trace: InternalTrace) {
    const parentIdx = this._parent.get(trace);
    // Return parent trace
    return parentIdx !== undefined ? this.getTrace(parentIdx) : undefined;
  }

  /**
   * Return the ids of all the traces that are children of the given trace
   * @param trace - The trace for which to get the children
   * @returns (Traces) - The ids of the children traces
   */
  public getBranch(trace: InternalTrace): InternalTraces {
    // Initialize branch
    const branch: InternalTraces = [];
    // Initialize stack
    const stack = [trace];
    // Loop through stack
    while (stack.length > 0) {
      // Get current trace
      const current = stack.pop()!;
      // Push current trace to branch
      branch.push(current);
      // Push children to stack
      stack.push(...this.getChildren(current));
    }
    // Return branch
    return branch;
  }

  /**
   * Get the children traces of the given trace
   * @param trace - The trace for which to get the children
   * @returns (InternalTraces) - The children traces, can be empty if the trace has no children
   */
  public getChildren(trace: InternalTrace): InternalTraces {
    // Get indices of child traces
    const indices = this._children.get(trace) || [];
    // Return child traces
    return indices.map((index) => this.getTrace(index));
  }
}
