import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Feature } from "../features/feature";
import { InternalTrace, InternalTraces, Trace, Traces } from "../trace";
import { checkContentSettings } from './initialize.service';


@Injectable({providedIn : 'platform'})
export class FeaturesService {
  protected traceMap = new Map<number, InternalTrace>();
  public tracesNoNesting$ = new BehaviorSubject<InternalTraces>([]);

  protected _parent = new Map<InternalTrace, number>();
  protected _children = new Map<InternalTrace, number[]>();

  private globalMinMax(trace: Trace) {
    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;
    for (const feature of trace.features) {
      if (feature.type === 'continuous') {
        min = Math.min(min, feature.min !== undefined ? feature.min : Math.min(...feature.values));
        max = Math.max(max, feature.max !== undefined ? feature.max : Math.max(...feature.values));
      }
      if (trace.options?.['zero-line']) {
        min = Math.min(min, 0);
        max = Math.max(max, 0);
      }
      if (trace.options?.['grid'] && trace.options['grid-y-values']) {
        for (const value of trace.options['grid-y-values']) {
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      }
    }
    // If min and max equal 0 set min to -1 and max to 1
    if (min === 0 && max === 0) {
      min = -1;
      max = 1;
    }

    return {min, max};
  }

  public set traces(traces: Traces) {
    // Initialize the index used as id for an InternalTrace
    let idx = 0;
    // Recursively convert traces to internal traces, setting level as the nesting level in the hierarchy
    const convert = (traces: Traces, level: number): InternalTraces => {
      return traces.map((trace) => {
        // Remove nested from the trace, as it will be processed recursively
        const {nested, ...tmpTrace} = trace;
        // Check and modify options if necessary
        checkContentSettings(tmpTrace.options);
        // Check and modify values if necessary
        this.checkValues(tmpTrace);
        const domain = this.globalMinMax(tmpTrace);
        // Initialize internal trace
        const internalTrace: InternalTrace = {
          ...tmpTrace,
          id : idx++,
          expanded : (trace.expanded || false) && (trace.nested?.length || 0) > 0,
          show : level === 0,
          domain : domain,
          level,
        };

        this.traceMap.set(internalTrace.id, internalTrace);
        // Recursively convert nested traces
        internalTrace.nested = convert(nested || [], level + 1);
        // Sort the features by type, so to have the continuous features first, but keep the order of the other types
        internalTrace.features = internalTrace.features.sort((a, b) => {
          if (a.type === 'continuous' && b.type !== 'continuous') return 1;
          if (a.type !== 'continuous' && b.type === 'continuous') return -1;
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
    convert(traces, 0);

    this.tracesNoNesting$.next(Array.from(this.traceMap.values()));

    for (const trace of this.tracesNoNesting$.value) {
      if (trace.expanded) {
        trace.show = true;

        // Open the parents and make them visible
        const parents = this.getBranchParents(trace);
        for (const parent of parents) {
          parent.show = true;
          parent.expanded = true;
        }

        // Open the children and make them visible
        const children = this.getChildren(trace);
        for (const child of children) {
          child.show = true;
        }
      }
    }
  }

  public get traces(): InternalTraces {
    return this.tracesNoNesting$.value.filter((trace) => trace.show);
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

  public getTrace(id: number): InternalTrace | undefined {
    return this.traceMap.get(id);
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

  public getBranchParents(trace: InternalTrace): InternalTraces {
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
      // Push parent to stack
      const parent = this.getParentTrace(current);
      if (parent) {
        stack.push(parent);
      }
    }
    branch.shift();
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
    return indices.map((index) => this.getTrace(index)!);
  }

  private checkValues(tmpTrace: Trace) {
    for (const feature of tmpTrace.features) {
      if (feature.type === 'locus') {
        if (feature.start < 0) {
          console.warn("Locus start cannot be negative, setting to 0");
          feature.start = 0;
        }
        if (feature.end < 0) {
          console.warn("Locus end cannot be negative, setting to 0");
          feature.end = 0;
        }
        if (feature.height) {
          if (feature.height < 0) {
            console.warn("Locus height cannot be negative, setting to 1");
            feature.height = 1;
          }
          if (tmpTrace.options?.["content-size"] && feature.height > tmpTrace.options["content-size"]) {
            console.warn("Locus height cannot be bigger than content size, setting to content size");
            feature.height = tmpTrace.options["content-size"];
          }
        }
      }
    }
  }
}
