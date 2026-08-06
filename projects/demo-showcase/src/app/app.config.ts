import { ApplicationConfig } from '@angular/core';
import {
  PreloadAllModules,
  provideRouter,
  withPreloading,
} from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withXhr } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  // Implement lazyu loading
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withXhr()),
  ],
};
