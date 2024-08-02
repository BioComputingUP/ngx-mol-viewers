import { TraceSettings } from "./settings";
import { Feature } from "./features/feature";

/**
 * Represents a trace in the features viewer (a single row), it can contain multiple features and has its own settings.
 * This is the type used for the **input** of the features viewer.
 * @type {Trace}
 * @property {Feature[]} features - Array of features to be displayed in the trace
 * @property {string} [label] - Label for the trace that will be displayed on the left side when no label template is passed or on SVG save
 * @property {Partial<TraceSettings>} [options] - Options for the trace, will override the default settings
 * @property {Traces} [nested] - Nested traces, used for hierarchical traces
 * @property {unknown} [data] - Additional data that can be associated with the trace
 * */
export type Trace = {
  features: Feature[];
  label?: string;
  // position?: 'overlap' | 'dodge';
  options?: Partial<TraceSettings>;
  nested?: Traces;
  expanded?: boolean;
  // Add reference to data in the trace
  // NOTE type `any` is deprecated in TypeScript, so we use `unknown` instead.
  data?: unknown;
}

export type Traces = Array<Trace>;

export type Domain = { min: number, max: number };

/**
 * Represents a trace in the features viewer (a single row), it can contain multiple features and has its own settings.
 * This is the type used for the **internal representation** of the features viewer.
 * @type {InternalTrace}
 * @extends {Trace}
 * @property {number} id - Unique identifier for the trace, assigned by the features viewer
 * @property {boolean} expanded - Whether the trace is expanded or not
 * @property {number} level - Level of the trace in the hierarchy, the number of parents it has (0 for top level)
 * @property {min: number, max: number} domain - Domain of the trace, calculated based on the features
 * @property {InternalTraces} [nested] - Nested traces, used for hierarchical traces
 */
export interface InternalTrace extends Trace {
  id: number;
  expanded: boolean;
  show: boolean;
  level: number;
  domain: Domain; // TODO Might be useful to use the same as { Range } in ./locus
  nested?: InternalTraces;
}

export type InternalTraces = Array<InternalTrace>;
