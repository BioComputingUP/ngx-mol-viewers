import { ChangeDetectionStrategy, Component, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
// import { combineLatestWith, map, shareReplay, startWith } from 'rxjs';
// import { SelectionService } from './services/selection.service';
// import { PositionsService } from './services/positions.service';
import { BehaviorSubject, combineLatestWith, map, shareReplay } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ColorMap, ZAPPO } from './colors';
import { SelectionService } from './services/selection.service';
import { IndexService } from './services/index.service';
import { parseFasta } from './utils';

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

export interface Locus<T=unknown> {
  // These are the boundaries of the locus
  start: T;
  end: T;
}

export type Colored<L extends Locus> = L & Partial<ColorMap[string]>;

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

/** Define settings for sequence viewer
 * 
 */
export interface Settings {
  // Define chunk size, might be negative for single residue chunks
  'chunk-size': number;
  // Define background color, fallback to this color if residue is not locus, nor selected
  'background-color': string;
  // Define selection color, use this color if residue is selected
  'selection-color': string;
  // Define text color, fallback to this color if residue is not locus, nor selected
  'text-color': string;
  // Whether to rotate index, default to false
  'rotate-index': boolean;
  // Thether to add space between chunks, default to false
  'split-chunks': boolean;
  // Define color map for residues
  'color-map': ColorMap;
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ngx-sequence-viewer',
  templateUrl: './ngx-sequence-viewer.component.html',
  styleUrls: ['./ngx-sequence-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SelectionService, IndexService],
  imports: [CommonModule],
  standalone: true,
})
export class NgxSequenceViewerComponent implements OnChanges {

  protected _settings: Settings = {
    'chunk-size': 5,
    'background-color': 'transparent',
    'selection-color': 'greenyellow',
    'text-color': 'black',
    'rotate-index': false,
    'split-chunks': false,
    'color-map': ZAPPO,
  };

  @Input()
  set settings(settings: Partial<Settings> | null) {
    // Initialize settings
    this._settings = { ...this.settings, ...(settings || {}) };
    // Get chunk size, rotate index
    const { 'chunk-size': chunkSize, 'rotate-index': rotateIndex } = this.settings;
    // Update index rotation according to chunk size
    this._settings['rotate-index'] = chunkSize < 0 ? true : rotateIndex;
    // Update chunk split according to chunk size
    this._settings['split-chunks'] = chunkSize < 0 ? false : true;
  }

  get settings(): Settings {
    return this._settings;
  }

  /** Define split of alignment
   * 
   * For values from 0 and greater, the index above is positioned horizontally and
   * gap is set between each chunk.
   * For values less than 0 (tipically -1), the index above is positioned vertically 
   * (rotated 90 degrees), no gap is set between each chunk. Each chunk will contain
   * exactly one position, hence an index is defined for each residue.
   */
  get split(): number {
    return this.settings['chunk-size'];
  }

  get cmap(): ColorMap {
    return this.settings['color-map'];
  }

  @Input()
  public label?: string;

  @Input()
  public labels?: string[];

  @Input()
  public fasta?: string;

  @Input()
  public sequence?: string;

  public sequences!: string[];

  public get first(): string {
    // Just return first sequence
    return this.sequences[0];
  }

  public get length(): number {
    // Just return length of first sequence
    return this.first.length;
  }

  @Input()
  public index? : unknown[];

  public chunks!: Locus<number>[];

  public logo!: Logo;

  public consensus!: Consensus;

  public loci$ = new BehaviorSubject<Record<string, Colored<Locus>>>({});

  @Input()
  public loci: Colored<Locus>[] = [];

  @Input()
  public set select(locus: Locus | null) {
    // Just emit locus or null
    this.selectionService.select = locus;
  }

  @Output()
  public selected$ = this.selectionService.selected$;

  // Merge loci with selection in a single styles emitter
  readonly styles$ = this.loci$.pipe(
    // Combine with latest loci emission
    combineLatestWith(this.selected$),
    // Define a matrix for styles, according to row and column
    map(([loci, selection]) => {
      // Initialize styles matrix
      const styles: Record<string, Array<{ 'background-color'?: string, 'border-color'?: string, 'color'?: string }>> = {};
      // Define sequences: index, consensus, input sequences
      const consensus = this.consensus.map(([aa]) => aa).join('');
      const sequences = [consensus, ...this.sequences];
      // Loop through each row (sequence)
      for (let i = 0; i < sequences.length; i++) {
        // Update index
        const k = (i < 1) ? 'consensus' : (i - 1);
        // Initialize row
        styles[k] = [];
        // Loop through each column (position)
        for (let j = 0; j < this.length; j++) {
          // Define residue name
          const residue = sequences[i][j];
          // Initialize background color
          let backgroundColor = this.settings['background-color'];
          let borderColor = this.settings['background-color'];
          let textColor = this.settings['text-color'];
          // Case residue is defined in color map
          if (residue in this.settings['color-map']) {
            // Define border color here, as it will be overwritten later
            borderColor = this.settings['color-map'][residue]['background-color'];
          }
          // Case residue is within locus
          if (j in loci) {
            // Get current locus
            const locus = loci[j];
            // Update background color
            backgroundColor = locus['background-color'] || backgroundColor;
            borderColor = locus['background-color'] || borderColor;
            textColor = locus['text-color'] || textColor;
          }
          // Case residue is among the selected ones
          if (selection) {
            // Get numeric start, end
            const { start, end } = this.indexService.map(selection);
            // Case residue is within selection
            if (start <= j && j <= end) {
              // Define selection color
              const selectionColor = this.settings['selection-color'];
              // Update background color
              backgroundColor = selectionColor;
              borderColor = selectionColor;
            }
          }
          // Case residue is defined in color map
          if (residue in this.settings['color-map']) {
            // Initialize background color
            backgroundColor = this.settings['color-map'][residue]['background-color'];
            textColor = this.settings['color-map'][residue]['text-color'];
          }
          // Define CSS colpiant styles
          const style = { 'background-color': backgroundColor, 'border-color': borderColor, 'color': textColor };
          // Store style for current position
          styles[k][j] = style;
        }
      }
      // Add style for index
      styles['index'] = [];
      // Loop through each position
      for (let j = 0; j < this.length; j++) {
        // Initialize background color
        let backgroundColor = this.settings['background-color'];
        const textColor = this.settings['text-color'];
        // Case residue is within locus
        if (j in loci) {
          // Get current locus
          const locus = loci[j];
          // Update background color
          backgroundColor = locus['background-color'] || backgroundColor;
        }
        // Case locus is selected
        if (selection) {
          // Get numeric start, end
          const { start, end } = this.indexService.map(selection);
          // Case residue is within selection
          if (start <= j && j <= end) {
            // Define selection color
            const selectionColor = this.settings['selection-color'];
            // Update background color
            backgroundColor = selectionColor;
          }
        }
        // Initialize CSS style for current index position
        styles['index'][j] = { 'background-color': backgroundColor, 'border-color': backgroundColor, 'color': textColor };
      }
      // Return styles matrix
      return styles;
    }),
    // Cache results
    shareReplay(1),
  );

  // Dependency injection
  constructor(
    public selectionService: SelectionService,
    public indexService: IndexService,
  ) {}

  @HostListener('window:mouseup', ['$event'])
  public onMouseUp(event: MouseEvent) {
    this.selectionService.onMouseUp(event);
  }

  public onMouseDown(event:MouseEvent, index: string) {
    // Set selection
    this.selectionService.onMouseDown(event, index);
    // Prevent default behavior
    event.preventDefault();
    // Prevent bubbling
    event.stopPropagation();
  }

  @HostListener('window:mousedown')
  public onMouseDownOut() {
    // Reset selection
    this.selectionService.select$.next(null);
  }

  public onMouseEnter(event: MouseEvent, index: string) {
    this.selectionService.onMouseEnter(event, index);
  }

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
      // Handle input index
      this.setIndex();
      // Update loci
      this.setLoci();
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
      const parsed = parseFasta(this.fasta);
      // Set sequences and labels
      this.sequences = parsed.map((entry) => entry.sequence);
      this.labels = this.labels || parsed.map((entry) => entry.label);
    }
    // Case sequence is provided
    else if (this.sequence) {
      // Set sequence as the only sequence in sequences list
      this.labels = [this.label || '']; 
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

  /** Define chunks
   * 
   * Chunks are defined as ranges of positions in the alignment.
   * Each chunk is a locus, defined by its start and end position.
   */
  public setChunks(): void {
    // Initialize chunks
    this.chunks = [];
    // Get maximum chunk size, length of any (first) seqeunce
    const length = this.length;
    const split = this.split >= 0 ? this.split : 1;
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

  public setIndex(): void {
    // Get initial index
    let index = this.index; 
    // Case input index is not defined
    if (!index) {
      // Then define index as a range from 0 to length of alignment
      index = Array.from({ length: this.length }, (_, i) => i + 1);
    }
    // Define index
    this.indexService.index = index;
  }

  public setLoci(): void {
    // Define residue (index) to color map
    const colors = this.loci.reduce((cmap: Record<string, Colored<Locus>>, locus: Colored<Locus>) => {
      // Cast start, end position to number
      const { start, end } = this.indexService.map(locus);
      // Loop through each position in locus
      for (let i = start; i <= end; i++) {
        // Get current index as string
        const index = this.indexService.keys[i];
        // Update color map
        cmap[index] = locus;
      }
      // Return updated color map
      return cmap;
    }, {});
    // Just emit loci
    this.loci$.next(colors);
  }

  public asOpacity(opacity: number): string {
    // Just return opacity string, which is CSS compatible
    return `${ Math.round(opacity * 100) }%`;
  }

}
