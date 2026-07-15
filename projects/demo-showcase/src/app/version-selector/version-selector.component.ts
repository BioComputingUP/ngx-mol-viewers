import {
  APP_BASE_HREF,
  AsyncPipe,
  JsonPipe,
  Location,
  NgForOf,
  NgIf,
  PlatformLocation,
} from '@angular/common';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { Component, inject, type OnInit } from '@angular/core';
import { map, shareReplay, tap, type Observable } from 'rxjs';

type VersionsJson = {
  latest: string;
  versions: string[];
};
@Component({
  standalone: true,
  selector: 'version-selector',
  imports: [AsyncPipe, JsonPipe, NgIf, NgForOf],
  templateUrl: './version-selector.component.html',
})
export class VersionSelector implements OnInit {
  private http = inject(HttpClient);
  location = inject(Location);
  versions$!: Observable<string[]>;
  latestVersion$!: Observable<string>;
  async ngOnInit() {
    const versionsJson$: Observable<VersionsJson> = this.http
      .get<VersionsJson>('versions.json')
      .pipe(shareReplay());
    this.versions$ = versionsJson$.pipe(map(({ versions }) => versions));
    this.latestVersion$ = versionsJson$.pipe(map(({ latest }) => latest));
  }
}
