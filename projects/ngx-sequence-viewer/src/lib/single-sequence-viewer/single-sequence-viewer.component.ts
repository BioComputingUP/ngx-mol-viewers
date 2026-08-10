import { Component, Input } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  map,
  ReplaySubject,
  type Observable,
} from 'rxjs';
import {
  defaultSingleSeqSettings,
  type Chunk,
  type Chunks,
  type SingleSeqSettings,
} from './util';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ngx-single-sequence-viewer',
  imports: [CommonModule],
  templateUrl: './single-sequence-viewer.component.html',
  styleUrl: './single-sequence-viewer.component.scss',
})
export class NgxSingleSequenceViewerComponent {
  sequence$ = new ReplaySubject<string>();
  settings$ = new BehaviorSubject<SingleSeqSettings>(defaultSingleSeqSettings);
  @Input() set sequence(value: string) {
    this.sequence$.next(value);
  }

  @Input() set settings(value: Partial<SingleSeqSettings>) {
    this.settings$.next(Object.assign({}, defaultSingleSeqSettings, value));
  }

  chunks$: Observable<Chunks> = combineLatest([
    this.settings$,
    this.sequence$,
  ]).pipe(
    map(([settings, sequence]: [SingleSeqSettings, string]) =>
      this.seqToChunks(sequence, settings)
    )
  );

  data$ = combineLatest([this.chunks$, this.sequence$, this.settings$]);

  seqToChunks(sequence: string, settings: SingleSeqSettings): Chunks {
    const chunkSize = settings['chunk-size'];
    if (!sequence) return [];
    if (chunkSize <= 0) {
      // Chunking disabled, return single chunk
      return [
        {
          start: 0,
          end: sequence.length,
          size: sequence.length,
          text: sequence,
        },
      ];
    }
    const chunkCount = Math.ceil(sequence.length / chunkSize);
    const chunks: Chunk[] = new Array(chunkCount);
    for (let i = 0, j = 0; i < sequence.length; i += chunkSize, j++) {
      const text = sequence.slice(i, i + chunkSize);
      chunks[j] = {
        start: i,
        end: i + text.length,
        size: text.length,
        text,
      };
    }
    return chunks;
  }
}
