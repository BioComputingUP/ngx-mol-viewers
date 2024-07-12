import { Component, ElementRef, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
// Custom dependencies
import { RepresentationService } from './services/representation.service';
import { HighlightService } from './services/highlight.service';
import { StructureService } from './services/structure.service';
import { SettingsService } from './services/settings.service';
import { PluginService } from './services/plugin.service';
import { Interaction } from './interfaces/interaction';
import { Settings } from './interfaces/settings';
import { Source } from './interfaces/source';
import { Locus } from './interfaces/locus';
import { map, shareReplay } from 'rxjs';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ngx-structure-viewer',
  // Handle dependencies
  imports: [
    CommonModule,
  ],
  providers: [
    RepresentationService,
    HighlightService,
    StructureService,
    SettingsService,
    PluginService,
  ],
  standalone: true,
  // Handle representation
  templateUrl: './ngx-structure-viewer.component.html',
  styleUrl: './ngx-structure-viewer.component.scss',
})
export class NgxStructureViewerComponent {

  @ViewChild('container')
  set container(container: ElementRef) {
    // Emit container
    this.pluginService.initialize$.next(container);
  }

  @Input()
  set source(source: Source) {
    this.structureService.source = source;
  }

  @Input()
  set loci(loci: Locus[]) {
    this.representationService.loci = loci;
  }

  @Input()
  set interactions(interactions: Interaction[]) {
    this.representationService.interactions = interactions;
  }

  @Input()
  set settings(settings: Settings) {
    this.settingsService.settings = settings;
  }

  // @Input()
  // set highlights(highlights: Highlights) {
  //   this.highlightService.highlights = highlights;
  // }

  // eslint-disable-next-line @angular-eslint/no-output-rename
  @Output('highlights')
  public highlights$ = this.highlightService.output$;

  public background$ = this.settingsService.settings$.pipe(
    // Extract background color
    map((settings) => settings['background-color']),
    // Cache result
    shareReplay(1),
  );

  constructor(
    public representationService: RepresentationService,
    public highlightService: HighlightService,
    public structureService: StructureService,
    public settingsService: SettingsService,
    public pluginService: PluginService,
  ) {
  }

}
