import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal, type OnInit } from '@angular/core';
import { from, map, shareReplay, switchMap, type Observable } from 'rxjs';

type VersionsJson = {
  latest: string;
  versions: LibVersionInfo[];
  current: string;
};

type LibVersionInfo = {
  name: string;
  url: string;
};
@Component({
  selector: 'version-selector',
  imports: [CommonModule],
  templateUrl: './version-selector.component.html',
})
export class VersionSelector implements OnInit {
  private location: Location = inject(Location);
  versionList = signal<LibVersionInfo[]>([]);
  latest = signal<LibVersionInfo | null>(null);
  current = signal<string | null>(null);
  async ngOnInit() {
    const versionsResponse = await fetch(
      this.location.prepareExternalUrl('/versions.json'),
    );
    const versionsData: VersionsJson = await versionsResponse.json();
    this.versionList.set(versionsData.versions);
    this.current.set(versionsData.current);
    const foundLatest = this.versionList().find(
      (x) => x.name == versionsData.latest,
    );
    if (!foundLatest) {
      throw new Error(
        `Cannot find latest version ${versionsData.latest} in the versions array \n ${JSON.stringify(this.versionList, null, 2)}`,
      );
    }
    this.latest.set(foundLatest);
  }
}
