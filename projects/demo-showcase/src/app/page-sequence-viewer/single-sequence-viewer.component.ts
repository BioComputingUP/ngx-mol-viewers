import { ChangeDetectionStrategy, Component } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import type { SingleSeqSettings } from '../../../../ngx-sequence-viewer/src/lib/single-sequence-viewer/util';
import { ThemeSelectorService } from '../theme-selector/theme-selector.service';

@Component({
  selector: 'app-single-sequence-viewer',
  templateUrl: './single-sequence-viewer.component.html',
  styleUrl: './single-sequence-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class SingleSequenceViewerComponent {
  // Define initial settings
  readonly settings: Partial<SingleSeqSettings> = {
    // Set background, text color
    'chunk-size': 10,
  };

  // Define test sequence
  readonly sequence =
    'MPRRAENWDEAEVGAEEAGVEEYGPEEDGGEESGAEESGPEESGPEELGAEEEMEAGRPRPVLRSVNSREPSQVIFCNRSPRVVLPVWLNFDGEPQPYPTLPPGTGRRIHSYRGHLWLFRDAGTHDGLLVNQTELFVPSLNVDGQPIFANITLPVYTLKERCLQVVRSLVKPENYRRLDIVRSLYEDLEDHPNVQKDLERLTQERIAHQRMGD';

  // Define the sequence viewer configuration
  public settings$: Observable<Partial<SingleSeqSettings>>;

  // Dependency injection
  constructor(public themeSelectorService: ThemeSelectorService) {
    // Define theme retrieval pipeline
    const theme$ = this.themeSelectorService.theme$;
    // Define the settings observable
    this.settings$ = theme$.pipe(
      // Get theme from document
      map(() => this.settings),
      // document.documentElement.getAttribute('data-bs-theme') as
      //   | 'dark'
      //   | 'light'
      // Map theme to settings
      // map((theme) => {
      //   // Case theme is dark
      //   if (theme === 'dark') {
      //     // Then return dark parameters
      //     return {
      //       ...this.settings,
      //       'background-color': '#212529',
      //       'text-color': 'white',
      //     };
      //   }
      //   // Otherwise, return light parameters
      //   return this.settings;
      // }),
      // Cache results
      shareReplay(1)
    );
  }
}
