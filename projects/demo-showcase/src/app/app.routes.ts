import { PageStructureViewerComponent } from './page-structure-viewer/page-structure-viewer.component';
import { PageFeaturesViewerComponent } from './page-features-viewer/page-features-viewer.component';
import { PageHomeComponent } from './page-home/page-home.component';
import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: 'structure', component: PageStructureViewerComponent },
    { path: 'feature', component: PageFeaturesViewerComponent },
    { path: '', component: PageHomeComponent },
    { path: '**', redirectTo: '' }
];
