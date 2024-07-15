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

export interface Locus {
  // These are the boundaries of the locus
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
export type Logo = { [aa: string]: number }[];

/** Define consensus of aligned sequences
 * 
 * This is just the highest probability in each position of the alignment.
 * NOTE In this case the gap `-` character is not considered.
 */
export type Consensus = [string, number][];

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
  public fasta?: string;

  @Input()
  public sequence?: string;

  public sequences!: string[];

  public get length(): number {
    // Get first sequence
    const sequence = this.sequences[0];
    // Just return length of first sequence
    return sequence.length;
  }

  @Input()
  public colors: Record<string, string> = ZAPPO;

  public chunks!: Locus[];

  public logo!: Logo;

  public consensus!: Consensus;

  public ngOnChanges(changes: SimpleChanges): void {
    // Check for input change
    if (changes) {
      // Handle input sequences
      this.setSequences();
      // Cacluclate chunks
      this.setChunks();
      // Calculate logo
      this.setLogo();
      // Calculate consensus
      this.setConsensus();
      // TODO Remove this
      console.log('Updated!');
    }
  }

  /** Handle input, set sequences
   * 
   * In case `fasta` input is provided, then attempts to parse it.
   * In case `sequence` input is provided, then sets it as the only sequence in sequences list.
   * In both cases, input string can be in fasta format. Hence, the sequence label is extracted from it.
   * However, if `labels` input is provided, then it is used as the sequence label, rather than 
   * extracting it from the input string.
   * `labels` input is expected to be an array of strings, with the same length as `sequences`.
   * Each string in `sequences` is expected to have the same length.
   * If expectations are not met, then an error is thrown.
   */
  public setSequences(): void {
    // Case fasta file is provided
    if (this.fasta) {
      // Attempt to parse fasta file
      const parsed = this.parseFasta(this.fasta);
      // Set sequences and labels
      this.sequences = parsed.map((entry) => entry.sequence);
      this.labels = this.labels || parsed.map((entry) => entry.label);
    }
    // Case sequence is provided
    else if (this.sequence) {
      // Set sequence as the only sequence in sequences list
      this.sequences = [this.sequence];
    }
    // Otherwise, throw an error
    else throw new Error('No single sequence, nor fasta were provided');
    // Check if labels are defined
    if (this.labels) {
      // Get number of sequences
      const count = this.sequences.length;
      // Get length of first sequence
      const length = this.sequences[0].length;
      // Check if number of sequences is greater than 0
      if (count < 1) {
        // Otherwise, throw an error
        throw new Error('No sequences were provided');
      }
      // Check if number of labels is the same as number of sequences
      if (this.labels.length !== count) {
        // Otherwise, throw an error
        throw new Error('Number of labels does not match number of sequences');
      }
      // Check if all sequences have the same length
      if (this.sequences.some((sequence) => sequence.length !== length)) {
        // Otherwise, throw an error
        throw new Error('All sequences must have the same length');
      }
    }
    // Otherwise, throw an error
    else throw new Error('No labels were provided');
  }

  /** Parse fasta file
   * 
   * @param {string} text - Input text, in fasta format.
   * @returns {{ sequence: string, label: string }[]} - Parsed sequences and labels.
   */
  public parseFasta(text: string): { sequence: string, label: string }[] {
    // Split line by newline character
    const lines = text.split(/[\n\r]+/);
    // Define output
    const parsed: { sequence: string, label: string }[] = [];
    // Define current index
    let index = -1;
    // Loop through each line
    for (let line of lines) {
      // Sanitize line
      line = line.trim();
      // In case line starts with '>' character, then define new sequence entry
      if (line.startsWith('>')) {
        // Define new sequence entry
        parsed.push({ sequence: '', label: line.slice(1) });
        // Update index
        index++
      }
      // In case index (0) has been defined beforehand, then current line is sequence
      else if (index > -1) parsed[index].sequence += line;
      // Otherwise, fine is not fasta formatted and an error is thrown
      else throw new Error('Provided text is not in fasta format');
    }
    // Return parsed sequences and labels
    return parsed;
  }

  /** Define chunks
   * 
   * Chunks are defined as ranges of positions in the alignment.
   * Each chunk is a locus, defined by its start and end position.
   */
  public setChunks(): void {
    // Initialize chunks
    this.chunks = [];
    // Get maximum chunk size, length of any (first) seqeunce
    const { split, length } = this;
    // Loop until sequence ends
    for (let start = 0; start < length; start = start + split) {
      // Define start of chunk
      const end = Math.min(length, start + split);
      // Return chunk
      this.chunks.push({ start, end });
    }
  }

  /** Compute alignment logo
   * 
   * In a multiple sequence alignment, a logo is an association between amino acids in a position and their probability.
   * Here, a logo is a map between amino acids and their probability in each position of the alignment.
   * If an amino acid is not present in a position, then it is not included in the logo.
   * Therefore, gaps `-` are also included in the logo.
   * The sum of all probabilities in each position is 1.
   */
  public setLogo(): void {
    // Initialize logo
    this.logo = [];
    // Define number of sequences
    const count = this.sequences.length;
    // Loop through each position in the alignment
    for (let i = 0; i < this.length; i++) {
      // Define a position in the logo
      let position: { [aa: string]: number } = {};
      // Loop through each sequence in the alignment
      for (const sequence of this.sequences) {
        // Get amino acid in current position
        const aa = sequence[i];
        // Update count of amino acid in position
        aa in position ? position[aa]++ : position[aa] = 1;
      }
      // Loop through each amino acid in the position
      for (const aa in position) {
        // Normalize count to probability
        position[aa] /= count;
      }
      // Sort amino acids by probability
      position = Object.fromEntries(Object.entries(position).sort((a, b) => {
        return b[1] - a[1];
      }));
      // Store logo of current position
      this.logo.push(position);
    }
  }

  /** Compute alignment consensus */
  public setConsensus(): void {
    // Re-initialize consensus
    this.consensus = [];
    // Consensus is just the highest probability in each position of the alignment
    for (let i = 0; i < this.length; i++) {
      // Get currrent position in the logo
      const positions = Object.entries(this.logo[i]);
      // Retrieve first entry (as they are already sorted by probability)
      this.consensus.push(positions[0]);
    }
  }

  public asOpacity(opacity: number): string {
    // Just return opacity string, which is CSS compatible
    return `${ Math.round(opacity * 100) }%`;
  }

}
