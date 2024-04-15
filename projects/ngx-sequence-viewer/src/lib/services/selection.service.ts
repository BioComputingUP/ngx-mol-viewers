import { Locus } from '../ngx-sequence-viewer.component';
import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'platform' })
export class SelectionService {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly select$!: EventEmitter<number>;

  readonly selected$!: Observable<Locus<string | number>>;

  constructor() { }
}
