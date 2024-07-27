import { Locus } from '../ngx-sequence-viewer.component';
import { IndexService } from './index.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
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
  // readonly selected$: Observable<Locus | null> = this.select$.pipe(
  //   // // Case selected locus is null
  //   // map((locus) => locus ? locus : { start: -1, end: -1 }),
  //   // Cache result
  //   shareReplay(1),
  // );
  readonly selected$ = this.select$;

  // Define flag to state where selection is ongoing
  protected selecting = false;

  // Dependency injection
  constructor(public indexService: IndexService) {}

  /** Handle mouse down event
   * 
   * If curren selection is already defined, then unset it
   * Otherwise, create new selection object with start position
   * 
   * @param event Mouse event
   * @param position Position of mouse event
   */
  public onMouseDown(event: MouseEvent, position: string): void {
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
  public onMouseEnter(event: MouseEvent, position: string): void {
    // In case selection is ongoing
    if (this.selecting) {
      // Cast current position to numeric
      const current = this.indexService.index[position];
      // In case selection is defined
      if (this.select) {
        // Get numeric start, end values
        const { start, end } = this.indexService.map(this.select);
        // Case current position is before start
        if (current < start) {
          // Update start position
          this.select = { ...this.select, start: position };
        } 
        // Case current position is after end
        else if (current > end) {
          // Update end position
          this.select = { ...this.select, end: position };
        }
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onMouseUp(event: MouseEvent): void {
    // Just unset selection flag
    this.selecting = false;
  }

}
