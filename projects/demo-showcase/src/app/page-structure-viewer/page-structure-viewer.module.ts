// import { SectionInteractionsComponent } from './sections/section-interactions.component';
import { SectionChainsComponent } from './sections/section-chains.component';
import { SectionSourcesComponent } from './sections/section-sources.component';
// import { SectionChainsComponent } from './sections/section-chains.component';
import { PageStructureViewerComponent } from './page-structure-viewer.component';
import { NgxStructureViewerComponent } from '@ngx-structure-viewer';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

@NgModule({
  declarations: [
    PageStructureViewerComponent,
    SectionChainsComponent,
    // SectionInteractionsComponent,
    SectionSourcesComponent,
    // SectionChainsComponent,
  ],
  imports: [
    NgxStructureViewerComponent,
    RouterModule.forChild([
      { path: '', component: PageStructureViewerComponent },
    ]),
    CommonModule,
  ],
  providers: [provideHttpClient(withXhr(), withInterceptorsFromDi())],
})
export class PageStructureViewerModule {}
