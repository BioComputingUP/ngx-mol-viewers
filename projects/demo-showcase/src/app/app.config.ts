import { ApplicationConfig } from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  // Implement lazyu loading 
  providers: [provideRouter(routes, withPreloading(PreloadAllModules))],
};
