export interface Settings {
  // Define margins
  'margin-top': number;
  'margin-right': number;
  'margin-bottom': number;
  'margin-left': number;
  // Define trace color, CSS compliant
  'trace-color': string;
  // Define background color, CSS compliant
  'background-color': string;
  // Define content size (height), without taking padding into account
  'content-size': number;
  // Define line height, defined as content size, plus padding
  'line-height': number;
}