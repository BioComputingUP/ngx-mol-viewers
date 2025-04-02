import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageExampleComponent } from './page-example.component';
import { NgxSequenceViewerComponent } from '@ngx-sequence-viewer';
import { NgxStructureViewerComponent } from '@ngx-structure-viewer';
import { NgxFeaturesViewerComponent, NgxFeaturesViewerLabelDirective, NgxFeaturesViewerTooltipDirective } from '@ngx-features-viewer';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';



@NgModule({
  declarations: [
    PageExampleComponent,
  ],
  imports: [
    NgxStructureViewerComponent,
    NgxSequenceViewerComponent,
    NgxFeaturesViewerTooltipDirective,
    NgxFeaturesViewerLabelDirective,
    NgxFeaturesViewerComponent,
    RouterModule.forChild([
      { path: '', component: PageExampleComponent }
    ]),
    HttpClientModule,
    CommonModule
  ]
})
export class PageExampleModule {}
