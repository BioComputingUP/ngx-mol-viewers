import { Component, ElementRef, Input, Output, ViewChild } from '@angular/core';
// Custom dependencies
import { RepresentationService } from './services/representation/representation.service';
import { HighlightService, Highlights } from './services/highlight.service';
import { StructureService } from './services/structure.service';
import { SettingsService } from './services/settings.service';
import { PluginService } from './services/plugin.service';
import { CanvasService } from './services/canvas.service';
import { Interaction } from './interfaces/interaction';
import { Settings } from './interfaces/settings';
import { Source } from './interfaces/source';
import { Locus } from './interfaces/locus';


@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ngx-structure-viewer',
  // Handle dependencies
  providers: [
    RepresentationService,
    HighlightService,
    StructureService,
    SettingsService,
    PluginService,
    CanvasService,
  ],
  standalone: true,
  // Handle representation
  template: `
    <div style="position: relative; width: 100%; height: 100%;" #container>
      <canvas style="position: absolute; left: 0; top: 0; width: 100%; height: 100%;" #canvas></canvas>
    </div>
  `,
  styles: ``,
})
export class NgxStructureViewerComponent {

  @ViewChild('container')
  set container(container: ElementRef) {
    // Emit container
    this.canvasService.container = container;
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

  @Input()
  set highlights(highlights: Highlights) {
    this.highlightService.highlights = highlights;
  }

  // eslint-disable-next-line @angular-eslint/no-output-rename
  @Output('highlights')
  public highlights$ = this.highlightService.output$;

  constructor(
    public representationService: RepresentationService,
    public highlightService: HighlightService,
    public structureService: StructureService,
    public settingsService: SettingsService,
    public pluginService: PluginService,
    public canvasService: CanvasService,
  ) {
  }

}
