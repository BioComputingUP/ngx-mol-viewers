import { MultipleSequenceAlignmentComponent } from './multiple-sequence-alignment.component';
import { SingleSequenceViewerComponent } from './single-sequence-viewer.component';
import { PageSequenceViewerComponent } from './page-sequence-viewer.component';
import { NgxSequenceViewerComponent } from '@ngx-sequence-viewer';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

// Define sub-routes
const routes: Routes = [{ path: '', component: PageSequenceViewerComponent }];

@NgModule({
  declarations: [
    MultipleSequenceAlignmentComponent,
    SingleSequenceViewerComponent,
    PageSequenceViewerComponent,
  ],
  imports: [
    NgxSequenceViewerComponent,
    RouterModule.forChild(routes),
    CommonModule
  ]
})
export class PageSequenceViewerModule { }
