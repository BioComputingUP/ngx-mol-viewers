
import { Observable, ReplaySubject, combineLatestWith, from, map, shareReplay, switchMap } from 'rxjs';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { Plugin } from 'molstar/lib/mol-plugin-ui/plugin';
// import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { ElementRef, Injectable } from '@angular/core';
import { SettingsService } from './settings.service';
import { PluginService } from './plugin.service';
import { fromHexString } from '../colors';

// React dependencies
import { createRoot } from 'react-dom/client';
import { createElement } from "react";

@Injectable()
export class CanvasService {

  readonly initialize$ = new ReplaySubject<ElementRef>(1);

  readonly initialized$: Observable<PluginUIContext>;

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
        const canvas = div.firstElementChild as HTMLCanvasElement;
        // Return both elements
        return { div, canvas };
      }),
      // Combine with plugin initialization
      combineLatestWith(plugin$),
      // Combine with settings retrieval
      combineLatestWith(settings$),
      // Create plugin's React UI
      map(([[{ div: container }, plugin], settings]) => {
        // Get background color
        const [color, alpha] = fromHexString(settings['background-color']);
        // Update canvas specs before rendering
        this.pluginService.specs.canvas3d = {
          renderer: {
            backgroundColor: color,
            pickingAlphaThreshold: alpha,
          }
        };
        // Render using React
        createRoot(container).render(createElement(Plugin, { plugin }));
        // Return initialized plugin 
        return plugin;
      }),
      // Cache result
      shareReplay(1),
    );
  }
}
