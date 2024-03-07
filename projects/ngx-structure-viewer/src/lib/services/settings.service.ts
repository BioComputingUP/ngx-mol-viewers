import { Settings } from '../entities/settings';
import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SettingsService {

  // Define settings emitter
  readonly settings$ = new ReplaySubject<Settings>();

  // Store settings
  protected _settings!: Settings;

  // Emit settings
  set settings(settings: Settings) {
    // Store settings
    this._settings = settings;
    // Emit settings
    this.settings$.next(settings);
  }

  get settings(): Settings {
    return this._settings;
  }
  
}
