import { Settings, Source, Locus } from '@ngx-structure-viewer';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReplaySubject } from 'rxjs';

type Highlights = Locus | undefined;

@Component({
  selector: 'app-section-highlights',
  templateUrl: './section-highlights.component.html',
  styleUrl: './section-highlights.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHighlightsComponent {

  readonly settings: Settings;

  readonly source: Source;

  public label$ = new ReplaySubject<string>(1);

  constructor() {
    this.settings = {
      'background-color': '#2b3035ff',
      'backbone-color': '#6ea8fecc',
      'interaction-color': '#ff0000ff',
      'interaction-size': 1,
    };

    this.source = {
      type: 'remote',
      format: 'mmcif',
      label: '8VAP',
      binary: false,
      link: 'assets/8vap.cif',
    };
  }

  public onHighlights(highlights: Highlights): void {
    // Cast highlight to string
    const label = highlights ? `Chain: ${highlights.chain}; Start: ${highlights.start}; End: ${highlights.end}.` : '';
    // Emit label
    this.label$.next(label);
  }

}
