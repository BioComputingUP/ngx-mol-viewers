import { Color } from 'molstar/lib/mol-util/color';

export function fromHexString(hex: string): [Color, number] {
  // Declare hue string
  let hue: string;
  // Remove starting hashtag
  hex = hex.replace(/^#/, '');
  // Split string in hex, alpha
  [hue, hex] = [hex.slice(6, 8), hex.slice(0, 6)];
  // Define color
  const color = Color.fromHexStyle('#' + hex);
  // Define alpha component
  const alpha = Number('0x' + (hue || 'ff')) / 255;
  // Define color, alpha
  return [color, 1.0 - alpha];
}