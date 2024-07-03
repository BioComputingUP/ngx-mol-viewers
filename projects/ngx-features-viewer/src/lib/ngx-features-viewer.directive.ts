import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[ngx-features-viewer-label]',
  standalone: true
})
export class NgxFeaturesViewerLabelDirective {
  @Input() where: 'left' | 'right' = 'left';

  @Input() justify: 'start' | 'center' | 'end' = 'start';

  @Input() align: 'start' | 'center' | 'end' = 'center';

  @Input() padding = 0;

  constructor(public templateRef: TemplateRef<unknown>) {
  }

}
