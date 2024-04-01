import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { RepresentationService } from './services/representation.service';
import { StructureService } from './services/structure.service';
import { SettingsService } from './services/settings.service';
import { PluginService } from './services/plugin.service';
import { Settings } from './interfaces/settings';
import { Source } from './interfaces/source';
import { Locus } from './interfaces/locus';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ngx-structure-viewer',
  // Handle dependencies
  providers: [
    RepresentationService,
    StructureService,
    SettingsService,
    PluginService,
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
    this.pluginService.container = container;
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
  set settings(settings: Settings) {
    this.settingsService.settings = settings;
  }

  constructor(
    public representationService: RepresentationService,
    public structureService: StructureService,
    public settingsService: SettingsService,
    public pluginService: PluginService,
  ) {
  }

}
