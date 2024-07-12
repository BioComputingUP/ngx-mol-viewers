import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
// import { combineLatestWith, map, shareReplay, startWith } from 'rxjs';
// import { SelectionService } from './services/selection.service';
// import { PositionsService } from './services/positions.service';
import { CommonModule } from '@angular/common';
// import * as Colors from './colors';

// export interface Locus<T> {
//   // Define start position (for both point and range loci)
//   start: T;
//   // Define end position (for range loci)
//   end?: T;
//   // Define type of locus
//   type: 'range';
//   // Background and text color, if defined
//   background?: string;
//   color?: string;
// }

// export type Loci<T> = Locus<T>[];

export interface Chunk {
  // This is the index shown above the chunk
  index: number[];
  // These are the boundaries of the chunk
  start: number;
  end: number;
}

/** Defines logo of aligned sequences
 * 
 * Logo stores the probability of each character in each position of the alignment.
 * The Logo array stores one value for each position of the alingnment.
 * Each value is a dictionary, mapping key to probability.
 * NOTE It includes gap `-` character. Hence, the sum of all probabilities in each position is 1.
 */
export type Logo = Array<Record<string, number>>;

/** Define consensus of aligned sequences
 * 
 * This is just the highest probability in each position of the alignment.
 * NOTE In this case the gap `-` character is not considered.
 */
export type Consensus = Array<number>;

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ngx-sequence-viewer',
  // providers: [PositionsService, SelectionService],
  imports: [CommonModule],
  standalone: true,
  templateUrl: './ngx-sequence-viewer.component.html',
  styleUrls: ['./ngx-sequence-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxSequenceViewerComponent implements OnChanges {

  @Input()
  public split = 5;

  @Input()
  public labels?: string[];

  @Input()
  public sequences: string;

  public chunks!: Chunk[];

  public logo!: Logo;

  public consensus!: Consensus;

  public ngOnChanges(changes: SimpleChanges): void {
    // Check for input change
    if (changes) {
      // Initialize variables
      const labels = [];
      const sequences = [] as string[];
      // Initialize current key
      let i = -1;
      // Split text by line
      const lines = this.sequences.split('\n');
      // Iterate over lines
      for (const line of lines) {
        // Case line starts with '>' character
        if (line.startsWith('>')) {
          // Set current label
          labels.push(line.slice(1));
          // Initialize sequence
          sequences.push('');
          // Update index
          i++;
        } else {
          // Otherwise, add sequence to alignment (if key is defined)
          sequences[i] += line;
        }
      }
      
    }
  }

}
