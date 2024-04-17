import { Component, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { combineLatestWith, map, shareReplay, startWith } from 'rxjs';
import { SelectionService } from './services/selection.service';
import { PositionsService } from './services/positions.service';
import { CommonModule } from '@angular/common';
import * as Colors from './colors';

export interface Locus<T> {
  // Define start position (for both point and range loci)
  start: T;
  // Define end position (for range loci)
  end?: T;
  // Define type of locus
  type: 'range';
  // Background and text color, if defined
  background?: string;
  color?: string;
}

export type Loci<T> = Locus<T>[];

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ngx-sequence-viewer',
  providers: [PositionsService, SelectionService],
  imports: [CommonModule],
  standalone: true,
  templateUrl: './ngx-sequence-viewer.component.html',
  styleUrls: ['./ngx-sequence-viewer.component.scss'],
})
export class NgxSequenceViewerComponent implements OnChanges {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() loci?: Loci<string | number>;

  @Input() index!: Array<string | number>;

  @Input() sequence!: Array<string> | string;

  @Input() colors!: Colors.Schema;

  @Input() description?: string;

  public positions$: typeof this.positionsService.output$;

  protected set positions(positions: Array<Locus<string | number> | undefined>) {
    this.positionsService.positions = positions;
  }

  protected get positions(): Array<Locus<string | number> | undefined> {
    return this.positionsService.positions;
  }

  // eslint-disable-next-line @angular-eslint/no-output-rename
  @Output('selected')
  readonly selected$ = this.selectionService.selected$;

  constructor(
    public positionsService: PositionsService,
    public selectionService: SelectionService,
  ) {
    // Define output pipeline
    this.positions$ = this.selectionService.selected$.pipe(
      // Set color for selected locus
      map((selected) => ({ ...selected, background: '#FFFFFF', color: '#000000' })),
      // This is required to always have a value emitted then
      startWith(undefined),
      // Combine input positions with selected locus
      combineLatestWith(this.positionsService.input$),
      // Override positions with selected loci
      map(([selected, positions]) => {
        // Copy positions array
        positions = [...positions];
        // TODO Define index (any) to position (numeric) map
        const i2p = new Map(this.index.map((v, i) => [v, i]));
        // Extract start, end positions from selected locus
        const start = selected?.start, end = selected?.end;
        // Do only if selected locus has both start, end positions defined
        if (start != undefined && end != undefined) {
          // Get start, end position as numeric
          let i = i2p.get(start) as number;
          let j = i2p.get(end) as number;
          // Sort start, end position
          if (i > j) [i, j] = [j, i];
          // Replace positions in range with selected locus
          positions.splice(i, j - i + 1, ...Array(j - i + 1).fill(selected));
        }
        // Return updated list of positions
        return positions;
      }),
      // Cache result
      shareReplay(1),
    );
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes) {
      // Test changes on sequence(s) and index
      if (changes['sequence'] || changes['index']) {
        // Case sequence is a string, cast it to an array of characters
        if (typeof this.sequence === 'string') {
          // Case description is not set and first line starts with '>', extract first line as description
          if (!this.description && this.sequence[0] === '>') {
            const [description, ...sequence] = this.sequence.split('\n');
            this.description = description;
            this.sequence = sequence.join('\n');
          }
          // Split sequence into an array of characters
          this.sequence = this.sequence.replace(/[\n\r\s\t]+/g, '').split('');
        }
        // Case index is not set, generate one according to the sequence length
        if (!this.index) {
          this.index = Array.from({ length: this.sequence.length }, (_, i) => i + 1);
        }
      }

      // Case color schema is not set, use ClustalX as default
      if (!this.colors) {
        this.colors = Colors.ClustalX;
      }

      // Define (any) index to (numeric) position map
      const i2p = new Map<string | number, number>(this.index.map((v, i) => [v, i]));
      // Initialize positions array with undefined values
      this.positions = new Array(this.index.length).fill(undefined);
      // Cast input loci to numeric positions
      const loci: Loci<number> = (this.loci || []).map(({ start, end, type, background, color }) => {
        // Cast start position to numeric
        const s = i2p.get(start) as number;
        // Cast end position to numeric
        const e = (end !== undefined ? i2p.get(end) : start) as number;
        // Define current locus
        const locus = { start: s, end: e, type, background, color };
        // Update all positions in range between start, end
        for (let i = s; i <= e; i++) {
          // Update locus in current position
          this.positions[i] = locus;
        }
        // Return locus with numeric positions
        return locus;
      });
      // Sort loci by start, end position
      loci.sort((a, b) => a.start - b.start || (a.end || 0) - (b.end || 0));
      // Store loci
      this.loci = loci;
    }
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onMouseUp(event: MouseEvent): void {
    // console.log('Mouse up', event);
  } 

  public onMouseDown(event: MouseEvent, position: string | number): void {
    this.selectionService.onMouseDown(event, position);
  }

  public onMouseEnter(event: MouseEvent, position: string | number) {
    this.selectionService.onMouseEnter(event, position);
  }

}
