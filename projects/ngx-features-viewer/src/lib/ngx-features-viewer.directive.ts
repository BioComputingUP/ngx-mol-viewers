import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[ngx-features-viewer-label]',
  standalone: true
})
export class NgxFeaturesViewerLabelDirective {

  where: 'left' | 'right' = 'left';

  @Input('ngx-features-viewer-label') set _where(value: 'left' | 'right' | '' | undefined) {
    if (value === 'left' || value === 'right') {
      this.where = value;
    } else {
      this.where = 'left';
    }
  }

  constructor(public templateRef: TemplateRef<unknown>) { }

}
