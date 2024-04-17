import { Locus } from '../ngx-sequence-viewer.component';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'platform' })
export class SelectionService {

  // Define currently selected locus
  // It might be undefined if selection has not yet been initialized
  // It might not have end position if selection is ongoing
  readonly selected$ = new BehaviorSubject<Locus<string | number> | undefined>(undefined);

  public set selected(value: Locus<string | number> | undefined) {
    this.selected$.next(value);
  }

  public get selected(): Locus<string | number> | undefined {
    return this.selected$.value;
  }

  // constructor() {
  //   // this.selected$ = this.select$.pipe(
  //   //   // Handle position emission
  //   //   map((position) => {
  //   //     // When position is emitted, fit into existing locus object or create a new one
  //   //     if (this.selected) {
  //   //       // Update end position in previous locus object
  //   //       return this.selected = { ...this.selected, end: position, type: 'range' };
  //   //     }
  //   //     // Generate new locus object with start position
  //   //     return this.selected = { start: position, end: undefined, type: 'range' };
  //   //   }),
  //   //   // If locus has both start and end positions, then unset it
  //   //   tap(() => this.selected = (this.selected && this.selected.end !== undefined) ? undefined : this.selected),
  //   //   // Cache result
  //   //   shareReplay(1),
  //   // );
  // }

  /** Handle mouse down event
   * 
   * If curren selection is already defined, then unset it
   * Otherwise, create new selection object with start position
   * 
   * @param event Mouse event
   * @param position Position of mouse event
   */
  public onMouseDown(event: MouseEvent, position: string | number): void {
    // Case selection is already defined
    this.selected = this.selected ? undefined : { start: position, end: position, type: 'range' };
  }

  /** Handle mouse enter event
   * 
   * If primary button is not held down, then do nothing
   * If selection is defined, then update end position
   * 
   * @param event Mouse event
   * @param position Position of mouse event
   */
  public onMouseEnter(event: MouseEvent, position: string | number): void {
    // Case selection is defined
    if (event.buttons === 1 && this.selected) {
      this.selected = { ...this.selected, end: position };
    }
  }

}
