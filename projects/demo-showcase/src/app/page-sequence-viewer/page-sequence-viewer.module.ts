import { MultipleSequenceAlignmentComponent } from './multiple-sequence-alignment.component';
import { SingleSequenceViewerComponent } from './single-sequence-viewer.component';
import { PageSequenceViewerComponent } from './page-sequence-viewer.component';
import { NgxSequenceViewerComponent, NgxSingleSequenceViewerComponent } from '@ngx-sequence-viewer';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

@NgModule({
  declarations: [
    MultipleSequenceAlignmentComponent,
    SingleSequenceViewerComponent,
    PageSequenceViewerComponent,
  ],
  imports: [
    NgxSequenceViewerComponent,
    NgxSingleSequenceViewerComponent,
    RouterModule.forChild([
      { path: '', component: PageSequenceViewerComponent }
    ]),
    CommonModule
  ]
})
export class PageSequenceViewerModule { }
