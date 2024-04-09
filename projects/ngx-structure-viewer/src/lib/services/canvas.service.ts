
import { Observable, ReplaySubject, combineLatestWith, map, shareReplay, tap } from 'rxjs';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { ElementRef, Injectable } from '@angular/core';
import { SettingsService } from './settings.service';
import { PluginService } from './plugin.service';
import { fromHexString } from '../colors';

@Injectable({ providedIn: 'platform' })
export class CanvasService {

  readonly initialize$ = new ReplaySubject<ElementRef>(1);

  readonly initialized$: Observable<PluginContext>;

  set container(container: ElementRef) {
    this.initialize$.next(container);
  }

  constructor(
    public settingsService: SettingsService,
    public pluginService: PluginService,
  ) {
    // Initialize plugin context
    const plugin$ = this.pluginService.plugin$;
    // Define settings retrieval pipeline
    const settings$ = this.settingsService.settings$;
    // Define plugin initialization pipeline
    this.initialized$ = this.initialize$.pipe(
      // Get outer HTML element
      map((container) => {
        // Get HTML div container
        const div = container.nativeElement as HTMLDivElement;
        // Get first child of div container
        const canvas =  div.firstElementChild as HTMLCanvasElement;
        // Return both elements
        return { div, canvas };
      }),
      // Combine with plugin initialization
      combineLatestWith(plugin$),
      // Bind plugin to HTML elements
      tap(([{ div: container, canvas }, plugin]) => plugin.initViewer(canvas, container)),
      // Return initialized plugin
      map(([, plugin]) => plugin),
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
