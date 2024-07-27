import { NgxFeaturesViewerComponent, NgxFeaturesViewerLabelDirective } from '@ngx-features-viewer';
import { PageFeaturesViewerComponent } from './page-features-viewer.component';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';


// Define sub-routes
const routes: Routes = [{ path: '', component: PageFeaturesViewerComponent }];

@NgModule({
  declarations: [
    PageFeaturesViewerComponent,
  ],
  imports: [
    NgxFeaturesViewerLabelDirective,
    NgxFeaturesViewerComponent,
    RouterModule.forChild(routes),
    CommonModule
  ]
})
export class PageFeaturesViewerModule { }
