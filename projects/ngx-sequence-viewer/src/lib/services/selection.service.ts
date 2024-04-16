import { Locus } from '../ngx-sequence-viewer.component';
import { EventEmitter, Injectable } from '@angular/core';
import { Observable, map, shareReplay, tap } from 'rxjs';

@Injectable({ providedIn: 'platform' })
export class SelectionService {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly select$ = new EventEmitter<number>();

  // Define currently selected locus
  // It might be undefined if selection has not yet been initialized
  // It might not have end position if selection is ongoing
  protected selected?: Locus<string | number>;

  readonly selected$!: Observable<Locus<string | number>>;

  constructor() {
    this.selected$ = this.select$.pipe(
      // Handle position emission
      map((position) => {
        // When position is emitted, fit into existing locus object or create a new one
        if (this.selected) {
          // Update end position in previous locus object
          return this.selected = { ...this.selected, end: position, type: 'range' };
        }
        // Generate new locus object with start position
        return this.selected = { start: position, end: undefined, type: 'range' };
      }),
      // If locus has both start and end positions, then unset it
      tap(() => this.selected = (this.selected && this.selected.end !== undefined) ? undefined : this.selected),
      // Cache result
      shareReplay(1),
    );
  }

}
