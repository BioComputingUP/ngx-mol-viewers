// import { PageStructureViewerComponent } from './page-structure-viewer/page-structure-viewer.component';
// import { PageSequenceViewerComponent } from './page-sequence-viewer/page-sequence-viewer.component';
// import { PageFeaturesViewerComponent } from './page-features-viewer/page-features-viewer.component';
import { PageHomeComponent } from './page-home/page-home.component';
import { Routes } from '@angular/router';

export const routes: Routes = [
    { 
        path: 'structure', 
        loadComponent: () => import('./page-structure-viewer/page-structure-viewer.component').then(m => m.PageStructureViewerComponent) 
    },
    { 
        path: 'sequence', 
        loadComponent: () => import('./page-sequence-viewer/page-sequence-viewer.component').then(m => m.PageSequenceViewerComponent) 
    },
    { 
        path: 'features', 
        loadComponent: () => import('./page-features-viewer/page-features-viewer.component').then(m => m.PageFeaturesViewerComponent) 
    },
    { path: '', component: PageHomeComponent },
    { path: '**', redirectTo: '' }
];
