import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';
// import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { Observable, from, map, shareReplay } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'platform' })
export class PluginService {

  readonly plugin!: PluginUIContext;

  readonly plugin$: Observable<PluginUIContext>;

  constructor() {
    // Initialize plugin context
    this.plugin = new PluginUIContext({
      ...DefaultPluginUISpec(),
      config: [
          [PluginConfig.VolumeStreaming.Enabled, false]
      ]
    });
    // Define plugin initialization pipeline
    this.plugin$ = from(this.plugin.init()).pipe(
      // Get current plugin instance
      map(() => this.plugin),
      // Cache result
      shareReplay(1),
    );
    // this.container$.pipe(
    //   // Get outer HTML element
    //   map((container) => {
    //     // Get HTML div container
    //     const div = container.nativeElement as HTMLDivElement;
    //     // Get first child of div container
    //     const canvas =  div.firstElementChild as HTMLCanvasElement;
    //     // Return both elements
    //     return { div, canvas };
    //   }),
    //   // Bind plugin to HTML elements
    //   tap(({ div: container, canvas }) => this.plugin.initViewer(canvas, container)),
    //   // Initialize plugin
    //   switchMap(() => ),
    //   // Return initialized plugin
    //   map(() => this.plugin),
    //   // Cache result
    //   shareReplay(1),
    //   // Combine with settings retrieval
    //   combineLatestWith(settings$),
    //   // Update plugin settings
    //   map(([plugin, settings]) => {
    //     // Case canvas3d is available
    //     if (plugin.canvas3d) {
    //       // Get background color
    //       const [ color, alpha ] = fromHexString(settings['background-color']);
    //       // Set background color
    //       plugin.canvas3d.setProps({
    //         // Change background color
    //         renderer: { 
    //           backgroundColor: color, 
    //           pickingAlphaThreshold: alpha,
    //         }
    //       });
    //     }
    //     // Return updated plugin
    //     return plugin;
    //   }),
  }
}
