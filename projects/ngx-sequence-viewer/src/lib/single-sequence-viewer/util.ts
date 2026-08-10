export type SingleSeqSettings = {
  /**
   * The number of residues in a defined chunk, defaults to 10
   */
  'chunk-size': number;

  /**
   * The amount of spacing between chunks in rem;
   */
  'chunk-gap': number;
};

export type Chunk = {
  start: number;
  end: number;
  size: number;
  text: string;
};
export type Chunks = Chunk[];

export const defaultSingleSeqSettings: SingleSeqSettings = {
  'chunk-size': 10,
  "chunk-gap": 1
};
