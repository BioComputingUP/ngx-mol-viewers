import { Settings } from '../interfaces/settings';
import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Injectable()
export class SettingsService {

  readonly settings$ = new ReplaySubject<Settings>();

  protected _settings!: Settings;

  set settings(settings: Settings) {
    this.settings$.next(this._settings = settings);
  }

  get settings(): Settings {
    return this._settings;
  }
  
}
