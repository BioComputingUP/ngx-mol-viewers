import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  // Handle representation
  templateUrl : './page-structure-viewer.component.html',
  styleUrl : './page-structure-viewer.component.scss',
  changeDetection : ChangeDetectionStrategy.OnPush,
  // eslint-disable-next-line @angular-eslint/component-selector
  selector : 'page-structure-viewer',
})
export class PageStructureViewerComponent {
}
