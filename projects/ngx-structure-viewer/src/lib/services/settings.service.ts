import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { Injectable, OnDestroy } from '@angular/core';
import { Settings } from '../interfaces/settings';
import { PluginService } from './plugin.service';
import { fromHexString } from '../colors';

@Injectable()
export class SettingsService implements OnDestroy {

  // Define default settings
  readonly DEFAULT = {
    "backbone-color": "#000000",
    "background-color": "#FFFFFF",
    "interaction-color": "#FF0000",
    "interaction-size": .1,
  }

  readonly settings$ = new BehaviorSubject<Settings>(this.DEFAULT);

  public get settings(): Settings {
    // Return internal settings
    return this.settings$.value;
  }

  readonly _settings: Subscription;

  constructor(public pluginService: PluginService) {
    // Get plugin emission
    const { plugin$ } = this.pluginService;
    // Subscribe to settings change and plugin instance
    const settings$ = combineLatest([ plugin$, this.settings$ ]);
    // Subscribe to settings change
    this._settings = settings$.subscribe(([plugin, settings]) => {
      // Get background color
      const [ color, alpha ] = fromHexString(settings["background-color"]);
      // Update plugin settings
      plugin.canvas3d?.setProps({
        // Set background color
        renderer: { backgroundColor: color },
        // Set background opacity
        transparentBackground: alpha === 1,
      });
    });
  }

  public ngOnDestroy() {
    // Unsubscribe from settings
    this._settings.unsubscribe();
  }

}
