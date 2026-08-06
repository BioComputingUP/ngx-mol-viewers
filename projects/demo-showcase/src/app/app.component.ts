// Core dependencies
import { RouterModule, RouterOutlet } from '@angular/router';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { Component, ChangeDetectionStrategy } from '@angular/core';
// Custom dependencies
import { ThemeSelectorComponent } from './theme-selector/theme-selector.component';
import { ThemeSelectorService } from './theme-selector/theme-selector.service';
import { PageHomeModule } from './page-home/page-home.module';
import { VersionSelector } from './version-selector/version-selector.component';

@Component({
  selector: 'app-root',
  imports: [
    ThemeSelectorComponent,
    PageHomeModule,
    VersionSelector,
    RouterModule,
    RouterOutlet,
  ],
  providers: [
    // Activate hash routing
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    // Import theme selector
    ThemeSelectorService,
  ],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  // TODO Define demo title
  title = 'ngx-bio-tools';
}
