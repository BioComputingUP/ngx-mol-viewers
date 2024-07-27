import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({ providedIn: 'root' })
export class ThemeSelectorService implements OnDestroy {

  public theme$ = new BehaviorSubject<Theme>(this.getStoredTheme());
  
  public _theme: Subscription;

  constructor() {
    // Subscribe to theme change
    this._theme = this.theme$.subscribe((theme) => {
      // Store theme in local storage
      this.setStoredTheme(theme);
      // Case theme is `auto`
      if (theme === 'auto') {
        // Then set theme as either `light` or `dark` according to system preferences
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      // Update theme in document
      document.documentElement.setAttribute('data-bs-theme', theme);
    });
  }

  public getStoredTheme(): Theme {
    // Attempt to extract theme from 
    return localStorage.getItem('theme') as Theme || 'auto';
  }

  public setStoredTheme(theme: Theme) {
    // Set theme in local storage
    localStorage.setItem('theme', theme);
  }

  public ngOnDestroy(): void {
    // Unsubscribe from theme change
    this._theme.unsubscribe();
  }
}
