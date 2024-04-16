import { Locus } from '../ngx-sequence-viewer.component';
import { SelectionService } from './selection.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable } from '@angular/core';


@Injectable({ providedIn: 'platform' })
export class PositionsService {

  public set positions(positions: Array<Locus<string | number> | undefined>) {
    this.input$.next(positions);
  }

  public get positions(): Array<Locus<string | number> | undefined> {
    return this.input$.value;
  }

  readonly input$ = new BehaviorSubject<Array<Locus<string | number> | undefined>>([]);

  // TODO
  readonly output$!: Observable<Array<Locus<string | number> | undefined>>;

  constructor(public selectionService: SelectionService) {
  }
}
