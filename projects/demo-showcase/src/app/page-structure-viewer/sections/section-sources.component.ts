import { BehaviorSubject, combineLatestWith, map, of, shareReplay, startWith, switchMap } from 'rxjs';
import { ThemeSelectorService } from '../../theme-selector/theme-selector.service';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Locus, Settings, Source } from '@ngx-structure-viewer';
import { HttpClient } from '@angular/common/http';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './section-sources.component.html',
  styleUrl: './section-sources.component.scss',
  selector: 'app-section-sources',
})
export class SectionSourcesComponent {

  // Define variable type of sources
  readonly SOURCES: Array<Source & { type: 'remote' }> = [
    // Remote sources
    {
      type: 'remote',
      link: 'https://files.rcsb.org/download/8VAP.cif',
      format: 'mmcif',
      label: '8VAP',
      binary: false,
    },
    {
      type: 'remote',
      link: 'https://files.rcsb.org/download/8WB3.cif',
      format: 'mmcif',
      label: '8WB3',
      binary: false,
    },
    {
      type: 'remote',
      link: 'https://files.rcsb.org/download/1TSR.cif',
      format: 'mmcif',
      label: '1TSR',
      binary: false,
    },
  ];

  // Define source emitter
  readonly source$ = new BehaviorSubject<Source>(this.SOURCES[0]);

  // Whether to download sources locally
  readonly type$ = new BehaviorSubject<Source['type']>('remote');

  // Define source input
  readonly input$ = this.source$.pipe(
    // Combine source and type
    combineLatestWith(this.type$),
    // Eventually, download source locally
    switchMap(([source, type]) => {
      // Otherwise, download it
      if (type === 'local' && source.type === 'remote') {
        // Fetch source content
        return this.http.get(source.link, { responseType: 'text' }).pipe(
          // Fit data into source
          map((data) => ({ ...source, type: 'local' as const, data: new Blob([data]) })),
          // NOTE This is useful to clear the input when the source changes
          startWith(null),
        );
      }
      // Otherwise, return source
      return of({ link: '', ...source, type: 'remote' as const });
    }),
    // Cache result
    shareReplay(1),
  );

  // Define initial loci list
  readonly LOCI: Locus[] = [
    { start: '1',   end: '10',  chain: 'A',   color: '#599a97' },
    { start: '11',  end: '20',  chain: 'A',   color: '#28b525' },
    { start: '21',  end: '30',  chain: 'A',   color: '#008a7c' },
    { start: '31',  end: '40',  chain: 'A',   color: '#0faa05' },
    { start: '41',  end: '50',  chain: 'A',   color: '#f8cb31' },
    { start: '51',  end: '60',  chain: 'A',   color: '#77cb1c' },
    { start: '61',  end: '70',  chain: 'A',   color: '#36ec09' },
    { start: '71',  end: '80',  chain: 'A',   color: '#cbf17b' },
    { start: '81',  end: '90',  chain: 'A',   color: '#5cb185' },
    { start: '91',  end: '100', chain: 'A',   color: '#fee954' },
  ];

  // Define different loci to display
  readonly loci$ = new BehaviorSubject<Locus[]>(this.shuffleLoci());

  // Define light settings
  readonly LIGHT: Partial<Settings> = {
    'background-color' : '#dee2e6',
    'backbone-color' : '#ffffff',
  };

  // Define dark settings
  readonly DARK: Partial<Settings> = {
    'background-color' : '#1a1d20',
    'backbone-color' : '#ffffff',
  };

  // Define fixed settings
  readonly settings$ = this.themeSelectorService.theme$.pipe(
    // Map theme to settings
    map((theme) => theme === 'light' ? this.LIGHT : this.DARK),
    // Cache results
    shareReplay(1),
  );

  constructor(
    public themeSelectorService: ThemeSelectorService,
    public http: HttpClient,
  ) {
  }

  // Define function to select and swap loci at random
  protected shuffleLoci(): Locus[] {
    // Take initial loci list
    let loci = this.LOCI.slice();
    // Randomly decide whether to keep locus or not
    loci = loci.filter(() => Math.random() > 0.5);
    // // Shuffle loci list
    // loci = loci.sort(() => Math.random() - 0.5);
    // Return shuffled loci list
    return loci;
  }

  // Handle source selection
  public onSourceChange(source: Source): void {
    this.source$.next(source);
  }

  // Handle source type change
  public onTypeChange(type: Source['type']): void {
    this.type$.next(type);
  }

  // On loci swap
  public onLociShuffle(): void {
    // Generate shuffled list of loci
    const loci = this.shuffleLoci();
    // Emit shuffled loci list
    this.loci$.next(loci);
  }

}
