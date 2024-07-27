// import { SectionInteractionsComponent } from './sections/section-interactions.component';
// import { SectionSourcesComponent } from './sections/section-sources.component';
// import { SectionChainsComponent } from './sections/section-chains.component';
import { PageStructureViewerComponent } from './page-structure-viewer.component';
import { NgxStructureViewerComponent } from "@ngx-structure-viewer";
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

// Define sub-routes
const routes: Routes = [{ path: '', component: PageStructureViewerComponent }];

@NgModule({
  declarations: [
    PageStructureViewerComponent,
    // SectionInteractionsComponent,
    // SectionSourcesComponent,
    // SectionChainsComponent,
  ],
  imports: [
    NgxStructureViewerComponent,
    RouterModule.forChild(routes),
    HttpClientModule,
    CommonModule,
  ]
})
export class PageStructureViewerModule { }
