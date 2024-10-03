import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { combineLatestWith, map, shareReplay, startWith } from 'rxjs';
import { Locus } from './interfaces/locus';
import { Settings } from './interfaces/settings';
import { Source } from './interfaces/source';
import { MolstarService } from './services/molstar.service';
import { PluginService } from './services/plugin.service';

import { RepresentationService } from './services/representation.service';
import { SettingsService } from './services/settings.service';
import { StructureService } from './services/structure.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector : 'ngx-structure-viewer',
  styleUrl : './ngx-structure-viewer.component.scss',
  template : '<div [style.background-color]="background$ | async" #container></div>',
  // Handle dependencies
  imports : [CommonModule],
  providers : [
    RepresentationService,
    // HighlightService,
    StructureService,
    SettingsService,
    MolstarService,
    PluginService,
  ],
  standalone : true,
})
export class NgxStructureViewerComponent implements AfterViewInit, OnChanges {

  @ViewChild('container')
  public container!: ElementRef;

  @Input() settings!: Partial<Settings> | null;

  @Input() source!: Source | null;

  @Input() loci!: Locus[] | null;

  @Output() structureLoadFail$ = this.structureService.onStructureLoadFail$;

  // Allow acces to background color in background
  public background$ = this.settingsService.settings$.pipe(
    // Wait for pluing to be loaded
    combineLatestWith(this.pluginService.plugin$),
    // Extract background color
    map(([settings]) => settings['background-color']),
    // Start with transparent background
    startWith('transparent'),
    // Cache result
    shareReplay(1),
  );

  constructor(
    public representationService: RepresentationService,
    public structureService: StructureService,
    public settingsService: SettingsService,
    public pluginService: PluginService,
  ) {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    // Handle settings changes
    if (changes['settings']) {
      // Get default settings
      const {DEFAULT} = this.settingsService;
      // Initialize settings
      const settings = this.settings || {};
      // Emit settings
      this.settingsService.settings$.next({...DEFAULT, ...settings});
    }
    // Handle source changes
    if (changes['source']) {
      // Emit source
      this.structureService.source = this.source;
    }
    // Handle loci changes
    if (changes['loci']) {
      // Emit loci
      this.representationService.loci$.next(this.loci || []);
    }
  }

  public ngAfterViewInit(): void {
    // Emit container
    this.pluginService.container$.next(this.container);
  }

}
