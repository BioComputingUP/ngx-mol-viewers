import { Directive, TemplateRef } from '@angular/core';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[ngx-features-viewer-label], [ngx-features-viewer-label-left], [ngx-features-viewer-label-right]',
  standalone: true
})
export class NgxFeaturesViewerLabelDirective {

  constructor(public templateRef: TemplateRef<unknown>) { }

}
