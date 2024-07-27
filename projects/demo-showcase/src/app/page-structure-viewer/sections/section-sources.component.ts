import { Settings, Source } from '@ngx-structure-viewer';
import { Observable, map, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-section-sources',
  templateUrl: './section-sources.component.html',
  styleUrl: './section-sources.component.scss'
})
export class SectionSourcesComponent {

  readonly local = {
    type: 'local' as const,
    format: 'mmcif' as const,
    label: '8VAP.A',
    binary: false,
    data: '...'
  };

  readonly local$: Observable<Source>;

  readonly remote = {
    type: 'remote' as const,
    format: 'mmcif' as const,
    label: '8VAP',
    binary: false,
    link: '...',
  };

  readonly remote$: Observable<Source>;

  readonly settings: Settings = {
    'background-color': '#2b3035ff',
    'backbone-color': '#6ea8fecc',
    'interaction-color': '#ff0000ff',
    'interaction-size': 1,
  };

  constructor(public http: HttpClient) {

    this.local$ = this.http.get('assets/8vap.A.cif', { responseType: 'text' }).pipe(
      // Cast data to blob
      map((data: string) => new Blob([data], { type: 'text/plain' })),
      // Provide local source
      map((data: Blob) => ({ ...this.local, data })),
      // TODO Remove this
      tap((source) => console.log('Local source:', source)),
    );
    
    this.remote$ = of({ ...this.remote, link: 'https://files.rcsb.org/view/8VAP.cif' });
  }

}
