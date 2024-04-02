import { Observable, ReplaySubject, combineLatestWith, from, map, shareReplay, switchMap, tap } from 'rxjs';
// import { PluginBehaviors } from 'molstar/lib/mol-plugin/behavior';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { ElementRef, Injectable } from '@angular/core';
import { SettingsService } from './settings.service';
import { fromHexString } from '../colors';
import { PluginBehavior } from 'molstar/lib/mol-plugin/behavior/behavior';

@Injectable({ providedIn: 'platform' })
export class PluginService {

  readonly container$ = new ReplaySubject<ElementRef>(1);

  set container(container: ElementRef) {
    this.container$.next(container);
  }

  readonly plugin!: PluginContext;

  readonly plugin$: Observable<PluginContext>;

  constructor(public settingsService: SettingsService) {
    // Initialize plugin context
    this.plugin = new PluginContext(DefaultPluginSpec());
    // Define settings retrieval pipeline
    const settings$ = this.settingsService.settings$;
    // Define plugin initialization pipeline
    this.plugin$ = this.container$.pipe(
      // Get outer HTML element
      map((container) => {
        // Get HTML div container
        const div = container.nativeElement as HTMLDivElement;
        // Get first child of div container
        const canvas =  div.firstElementChild as HTMLCanvasElement;
        // Return both elements
        return { div, canvas };
      }),
      // Bind plugin to HTML elements
      tap(({ div: container, canvas }) => this.plugin.initViewer(canvas, container)),
      // Initialize plugin
      switchMap(() => from(this.plugin.init())),
      // Return initialized plugin
      map(() => this.plugin),
      // Cache result
      shareReplay(1),
      // Combine with settings retrieval
      combineLatestWith(settings$),
      // Update plugin settings
      map(([plugin, settings]) => {
        // Case canvas3d is available
        if (plugin.canvas3d) {
          // Get background color
          const [ color, alpha ] = fromHexString(settings['background-color']);
          // Set background color
          plugin.canvas3d.setProps({
            // Change background color
            renderer: { 
              backgroundColor: color, 
              pickingAlphaThreshold: alpha,
            }
          });
        }
        // Return updated plugin
        return plugin;
      }),
    );
  }
}
