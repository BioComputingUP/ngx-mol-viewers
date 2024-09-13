import { NgxFeaturesViewerComponent, NgxFeaturesViewerLabelDirective } from '@ngx-features-viewer';
import { PageFeaturesViewerComponent } from './page-features-viewer.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

@NgModule({
  declarations: [

  ],
  imports : [
    NgxFeaturesViewerLabelDirective,
    NgxFeaturesViewerComponent,
    RouterModule.forChild([
      { path: '', component: PageFeaturesViewerComponent }
    ]),
    CommonModule,
    PageFeaturesViewerComponent,
  ],
})
export class PageFeaturesViewerModule { }
