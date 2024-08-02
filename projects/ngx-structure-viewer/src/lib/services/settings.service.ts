import { Settings } from '../interfaces/settings';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class SettingsService {

  // Define default settings
  readonly DEFAULT = {
    "backbone-color": "#000000",
    "background-color": "#FFFFFF",
    "interaction-color": "#FF0000",
    "interaction-size": .1,
    "show-water": false
  }

  readonly settings$ = new BehaviorSubject<Settings>(this.DEFAULT);

  public get settings(): Settings {
    // Return internal settings
    return this.settings$.value;
  }

}
