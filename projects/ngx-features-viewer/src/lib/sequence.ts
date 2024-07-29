/** Export sequence type
 *
 * Initially, this was an array of strings (amino acids).
 * Now, it allows to decide whether to show sequence or not.
 * The only required property is `length`, as it defined the domain.
 */
//export type Sequence = string | Array<string> | { length: number };

export type Sequence = string | Array<string> | { length: number };


export const sequenceColors = {
  clustalx : {
    A : '#7aa0ed',
    I : '#7aa0ed',
    L : '#7aa0ed',
    M : '#7aa0ed',
    F : '#7aa0ed',
    W : '#7aa0ed',
    V : '#7aa0ed',
    K : '#fa161d',
    R : '#fa161d',
    E : '#c649bd',
    D : '#c649bd',
    N : '#00c02e',
    Q : '#00c02e',
    S : '#00c02e',
    T : '#00c02e',
    C : '#f88082',
    G : '#f89051',
    P : '#c1c02d',
    H : '#00a4a3',
    Y : '#00a4a3',
    B : '#fff', // Unknown
    X : '#fff', // Unknown
    Z : '#fff', // Unknown
    '-' : '#fff', // Special characters
  },

  nucleotide : {
    A : '#45f752',
    C : '#ffb34f',
    G : '#f54142',
    T : '#2188ea',
    U : '#2188ea',
    X : '#fff', // Unknown
  },
};
