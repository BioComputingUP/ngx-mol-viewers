import { Routes } from '@angular/router';
import { PageStructureViewerComponent } from './page-structure-viewer/page-structure-viewer.component';
import { PageFeaturesViewerComponent } from './page-features-viewer/page-features-viewer.component';
import { PageHomeComponent } from './page-home/page-home.component';

export const routes: Routes = [
    // Define one route for each viewer
    { path: 'structure', component: PageStructureViewerComponent },
    { path: 'features', component: PageFeaturesViewerComponent },
    // Wildcard for homepage
    { path: '**', component: PageHomeComponent }
];
