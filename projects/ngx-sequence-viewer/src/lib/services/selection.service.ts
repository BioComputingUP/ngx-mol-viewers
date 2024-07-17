import { Locus } from '../ngx-sequence-viewer.component';
import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'platform' })
export class SelectionService {

  // Define currently selected locus
  // It might be undefined if selection has not yet been initialized
  // It might not have end position if selection is ongoing
  readonly select$ = new BehaviorSubject<Locus | null>(null);

  public set select(locus: Locus | null) {
    // Just emit locus or null
    this.select$.next(locus);
  }

  public get select(): Locus | null {
    // Just get previously emitted locus
    return this.select$.value;
  }

  // TODO
  readonly selected$: Observable<Locus | null> = this.select$;

  // Define flag to state where selection is ongoing
  protected selecting = false;

  /** Handle mouse down event
   * 
   * If curren selection is already defined, then unset it
   * Otherwise, create new selection object with start position
   * 
   * @param event Mouse event
   * @param position Position of mouse event
   */
  public onMouseDown(event: MouseEvent, position: number): void {
    // Set selection flag
    this.selecting = true;
    // Update selection with current residue (column) only
    this.select = { start: position, end: position };
  }

  /** Handle mouse enter event
   * 
   * If primary button is not held down, then do nothing
   * If selection is defined, then update end position
   * 
   * @param event Mouse event
   * @param position Position of mouse event
   */
  public onMouseEnter(event: MouseEvent, position: number): void {
    // In case selection is ongoing
    if (this.selecting) {
      // Get start position
      const start = Math.min(this.select?.start || position, position);
      // Get end position
      const end = Math.max(this.select?.end || position, position, start);
      // Emit new selection
      this.select = { start, end };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onMouseUp(event: MouseEvent): void {
    // Just unset selection flag
    this.selecting = false;
  }

}
