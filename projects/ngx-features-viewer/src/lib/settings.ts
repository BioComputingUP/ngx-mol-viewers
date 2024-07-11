export interface ContentSettings {
  'content-size': number;
  'line-height': number;
  'margin-top': number;
  'margin-bottom': number;
}

export interface Settings extends ContentSettings {
  'sequence-show'?: boolean;
  'sequence-background-color'?: 'clustalx' | 'nucleotide';
  'sequence-background-opacity'?: number;
  'sequence-background-height'?: '100%' | 'content-size' | 'line-height';

  'x-axis-show'?: boolean;
  // Define margins
  'margin-right': number;
  'margin-left': number;
  // Define colors
  'background-color': string;
  'plot-background-color': string;
  'grid-line-color': string;
  'text-color': string;
}


/**
 * Settings related to a single trace
 * @interface TraceSettings
 * @member {string} text-color: Color of the text in the trace
 * TODO: Explain the following properties
 * @member {boolean} zero-line: Whether to display the zero line
 * @member {string} zero-line-color: Color of the zero line
 * @member {number} zero-line-width: Width of the zero line
 *
 * @member {boolean} grid: Whether to display the grid
 * @member {string} grid-line-color: Color of the grid line
 * @member {number} grid-line-width: Width of the grid line
 * @member {number[]} grid-y-values: Y values for the grid
 */
export interface TraceSettings extends ContentSettings {
  'zero-line': boolean;
  'zero-line-color': string;
  'zero-line-width': number;

  'grid': boolean;
  'grid-line-color': string;
  'grid-line-width': number;
  'grid-y-values': number[];
}
