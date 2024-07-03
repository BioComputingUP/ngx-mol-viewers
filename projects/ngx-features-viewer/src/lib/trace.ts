import { TraceSettings } from "./settings";
import { Feature } from "./features/feature";

/**
 * Represents a trace in the features viewer (a single row), it can contain multiple features and has its own settings.
 * This is the type used for the **input** of the features viewer.
 * @type {Trace}
 * @extends {Partial<TraceSettings>}
 * @property {string} [label] - Label for the trace that will be displayed on the left side when no label template is passed or on SVG save
 * @property {Feature[]} features - Array of features to be displayed in the trace
 * @property {'overlap' | 'dodge'} position - Whether to overlap or dodge features
 * */
export type Trace = {
  features: Feature[];
  label?: string;
  position?: 'overlap' | 'dodge';
  options?: Partial<TraceSettings>;
  nested?: Traces;
}

export type Traces = Array<Trace>;

/**
 * Represents a trace in the features viewer (a single row), it can contain multiple features and has its own settings.
 * This is the type used for the **internal representation** of the features viewer.
 * @type {InternalTrace}
 * @extends {Trace}
 * @property {number} id - Unique identifier for the trace, assigned by the features viewer
 * @property {boolean} expanded - Whether the trace is expanded or not
 * @property {number} level - Level of the trace in the hierarchy, the number of parents it has (0 for top level)
 */
export interface InternalTrace extends Trace {
  id: number;
  expanded: boolean;
  show: boolean;
  level: number;
  domain: { min: number, max: number };
  nested?: InternalTraces;
}

export type InternalTraces = Array<InternalTrace>;
