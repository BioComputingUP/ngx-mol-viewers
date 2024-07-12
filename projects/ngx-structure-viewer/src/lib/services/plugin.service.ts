import { DefaultPluginUISpec, PluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { renderReact18 } from 'molstar/lib/mol-plugin-ui/react18';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
// import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { Observable, ReplaySubject, from, map, shareReplay, switchMap, tap } from 'rxjs';
import { ElementRef, Injectable } from '@angular/core';

@Injectable()
export class PluginService {

  public plugin!: PluginUIContext;

  readonly specs: PluginUISpec = { ...DefaultPluginUISpec(),
    // Show commands
    config: [
      [PluginConfig.VolumeStreaming.Enabled, false]
    ],
    // TODO Remove this
    canvas3d: {
      // renderer: {
      //   backgroundColor: Color(0x000000),
      // }
      transparentBackground: true,
    }
  };

  readonly initialize$ = new ReplaySubject<ElementRef>(1);

  readonly plugin$: Observable<PluginUIContext>;

  constructor() {
    // Define plugin initialization pipeline
    this.plugin$ = this.initialize$.pipe(
      // Get HTML div container
      map((container) => container.nativeElement as HTMLDivElement),
      // Create plugin context
      switchMap((div) => from(createPluginUI({
        // Define container div
        target: div,
        // Define rendered 
        render: renderReact18,
        // Define plugin specs
        spec: this.specs,
      }))),
      // TODO Remove this
      tap((plugin) => {
        console.log('Plugin created', plugin)
      }),
      // Get current plugin instance
      map((plugin) => this.plugin = plugin),
      // Cache result
      shareReplay(1),
    );
  }
}
