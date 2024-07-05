/** Export sequence type
 *
 * Initially, this was an array of strings (amino acids).
 * Now, it allows to decide whether to show sequence or not.
 * The only required property is `length`, as it defined the domain.
 */
//export type Sequence = string | Array<string> | { length: number };

export interface Sequence {
  sequence: string | Array<string> | { length: number };
  show?: boolean;
  'background-color'?: 'clustal';
}

export const sequenceColors = {
  clustal: {
    H: 'blue',
    K: 'blue',
    R: 'blue', // Polar, positive
    D: 'red',
    E: 'red', // Polar, negative
    S: 'green',
    T: 'green',
    N: 'green',
    Q: 'green', // Polar, neutral
    A: 'white',
    V: 'white',
    L: 'white',
    I: 'white',
    M: 'white', // Non polar, aliphatic
    F: 'magenta',
    W: 'magenta',
    Y: 'magenta', // Non polar, aromatic
    P: 'brown',
    G: 'brown',
    C: 'yellow',
    B: 'grey',
    Z: 'grey',
    X: 'grey',
    '-': 'grey', // Special characters
  },
};
