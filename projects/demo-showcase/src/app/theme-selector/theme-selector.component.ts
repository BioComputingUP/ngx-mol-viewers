import { Theme, ThemeSelectorService } from './theme-selector.service';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-theme-selector',
  // Define dependencies
  imports: [CommonModule],
  standalone: true,
  // Define styles
  templateUrl: './theme-selector.component.html',
  styleUrl: './theme-selector.component.scss',
})
export class ThemeSelectorComponent {

  // Bind component to logic
  public readonly theme$ = this.themeSelectorService.theme$;

  // Dependency injection
  constructor(protected themeSelectorService: ThemeSelectorService) {}

  public setTheme(theme: Theme) {
    // Emit theme value
    this.theme$.next(theme);
  }
}
