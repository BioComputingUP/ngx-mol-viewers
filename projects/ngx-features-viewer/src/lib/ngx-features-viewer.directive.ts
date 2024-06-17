import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[ngx-features-viewer-label]',
  standalone: true
})
export class NgxFeaturesViewerLabelDirective {

  @Input('ngx-features-viewer-label') where?: 'left' | 'right';

  constructor(public templateRef: TemplateRef<unknown>) { }

}
