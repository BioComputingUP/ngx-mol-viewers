import { from, shareReplay, tap } from 'rxjs';
import { Injectable } from '@angular/core';
import * as Molstar from '../molstar';

@Injectable({ providedIn: 'root' })
export class MolstarService {

  protected _molstar!: typeof Molstar;

  public get molstar() {
    return this._molstar;
  }

  readonly molstar$ = from(import('../molstar')).pipe(
    // Store lazily loaded module
    tap((module) => this._molstar = module),
    // Cache result
    shareReplay(1),
  );

}
