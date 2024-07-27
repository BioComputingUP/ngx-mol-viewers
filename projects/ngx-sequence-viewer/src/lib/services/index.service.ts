import { Locus } from "@ngx-sequence-viewer";
import { Injectable } from "@angular/core";

Injectable()
export class IndexService {

  protected _index!: Record<string, number>;

  public keys!: string[];

  public values!: number[];

  public set index(index: unknown[]) {
    // Define keys, numeric values
    this.keys = index.map((v: unknown) => '' + v);
    this.values = index.map((v: unknown, i: number) => i);
    // Store index mapping external to internal value
    this._index = this.keys.reduce((index: Record<string, number>, v: string, i: number) => {
      // Store association between external and internal values
      index['' + v] = i;
      // Return index
      return index;
    }, {});
  }

  public get index(): Record<string, number> {
    // Just return internal index
    return this._index;
  }

  public map<T, L extends Locus<T>>(locus: L): Omit<L, 'start' | 'end'> & Locus<number> {
    // Map locus to internal index
    const start = this._index['' + locus.start];
    const end = this._index['' + locus.end];
    // Return mapped locus
    return { ...locus, start, end };
  }

}
