// Core dependencies
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
// Custom dependencies
import { ThemeSelectorComponent } from './theme-selector/theme-selector.component';
import { ThemeSelectorService } from './theme-selector/theme-selector.service';
import { PageSequenceViewerModule } from './page-sequence-viewer/page-sequence-viewer.module';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // Custom components
    ThemeSelectorComponent,
    // TODO Import pages
    PageSequenceViewerModule,
    // Core modules
    CommonModule, 
    RouterModule, 
    RouterOutlet,
  ],
  providers: [
    ThemeSelectorService
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  // TODO Define demo title
  title = 'ngx-bio-tools';
}
