export interface Settings {
  // Define margins
  'margin-top': number;
  'margin-right': number;
  'margin-bottom': number;
  'margin-left': number;
  // Define colors
  'background-color': string;
  'plot-background-color': string;
  'grid-line-color': string;
  'text-color': string;
  // Define content size (height), line height
  'content-size': number;
  'line-height': number;
}


/**
 * Settings related to a single trace
 * @interface TraceSettings
 * @member {number} margin-top: Margin top of the trace
 * @member {number} margin-bottom: Margin bottom of the trace
 * @member {string} background-color: Background color
 * @member {string} grid-color: Color of the grid for the trace
 * @member {string} text-color: Color of the text in the trace
 * TODO: Explain the following properties
 * @member {number} content-size:
 * @member {number} line-height:
 * @member {boolean} zero-line: Whether to display the zero line
 * @member {string} zero-line-color: Color of the zero line
 * @member {number} zero-line-width: Width of the zero line
 * @member {boolean} grid-line: Whether to display the grid line
 * @member {string} grid-line-color: Color of the grid line
 * @member {number} grid-line-width: Width of the grid line
 * @member {number[]} grid-y-values: Y values for the grid
 */
export interface TraceSettings {
  //'margin-top': number;
  //'margin-bottom': number;

  //'background-color': string;
  //'text-color': string;
  'content-size': number;
  'line-height': number;

  'zero-line': boolean;
  'zero-line-color': string;
  'zero-line-width': number;

  'grid': boolean;
  'grid-line-color': string;
  'grid-line-width': number;
  'grid-y-values': number[];
}
