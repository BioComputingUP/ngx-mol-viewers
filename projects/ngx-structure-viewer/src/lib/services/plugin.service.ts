import { DefaultPluginUISpec, PluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';
// import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { Observable, from, map, shareReplay } from 'rxjs';
import { Injectable } from '@angular/core';
import { Color } from 'molstar/lib/mol-util/color'; // TODO Remove this

@Injectable()
export class PluginService {

  readonly plugin!: PluginUIContext;

  readonly specs: PluginUISpec = { ...DefaultPluginUISpec(),
    // Show commands
    config: [
      [PluginConfig.VolumeStreaming.Enabled, false]
    ],
    // TODO Remove this
    canvas3d: {
      renderer: {
        backgroundColor: Color(0x000000),
      }
    }
  };

  readonly plugin$: Observable<PluginUIContext>;

  constructor() {
    // Initialize plugin context
    this.plugin = new PluginUIContext(this.specs);
    // Define plugin initialization pipeline
    this.plugin$ = from(this.plugin.init()).pipe(
      // Get current plugin instance
      map(() => this.plugin),
      // Cache result
      shareReplay(1),
    );
  }
}
