/** Export sequence type
 * 
 * Initially, this was an array of strings (amino acids).
 * Now, it allows to decide whether to show sequence or not.
 * The only required property is `length`, as it defined the domain.
 */
export type Sequence = string | Array<string> | { length: number };