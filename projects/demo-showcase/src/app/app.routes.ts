import { PageHomeComponent } from './page-home/page-home.component';
import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: 'structure', loadChildren: () => import('./page-structure-viewer/page-structure-viewer.module').then(m => m.PageStructureViewerModule) },
    { path: 'features', loadChildren: () => import('./page-features-viewer/page-features-viewer.module').then(m => m.PageFeaturesViewerModule) },
    { path: 'sequence', loadChildren: () => import('./page-sequence-viewer/page-sequence-viewer.module').then(m => m.PageSequenceViewerModule) },
    { path: '', component: PageHomeComponent },
    { path: '**', redirectTo: '' }
];
