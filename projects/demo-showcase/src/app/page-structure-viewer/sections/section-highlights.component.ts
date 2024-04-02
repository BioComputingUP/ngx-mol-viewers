import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgxStructureViewerComponent } from '@ngx-structure-viewer';

@Component({
  selector: 'app-section-highlights',
  imports: [
    NgxStructureViewerComponent,
    CommonModule,
  ],
  standalone: true,
  templateUrl: './section-highlights.component.html',
  styleUrl: './section-highlights.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHighlightsComponent {

  // Define settings
  readonly settings: Settings = {

  }

  // Define highlight
  readonly highlights$

  public onHighlight(highlight: Locus | undefined) {

  }

}
