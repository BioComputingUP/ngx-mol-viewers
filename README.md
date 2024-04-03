# NGX-BIOCOMP-UP

A library of Angular standalone components for the visualization and manipulation of biological data out-of-the box. 

Generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.0.5.

## Introduction

At the [BioCompUP Laboratory](https://protein.bio.unipd.it/) of the University of Padua we have years of experience in collecting and providing biolcogical data.
We adopted and consolidated the Angular + TypeScript combo to develop the interfaces of our databases and web services, such as [MobiDB](https://mobidb.org/), 
[RepeatsDB](https://repeatsdb.bio.unipd.it/), [RING](https://ring.biocomputingup.it/) and others. Despite having already published some widely used TypeScript 
components in NPM, e.g. [ProSeqViewer](https://www.npmjs.com/package/proseqviewer), [FeatureViewerTypescript](https://www.npmjs.com/package/feature-viewer-typescript),
we had to wrap those components in Angular components to make them work in our interfaces. Therefore, we created the **ngx-biocomp-up** library.

## Components

### ngx-structure-viewer
TODO

### ngx-sequence-viewer
TODO

### ngx-feature-viewer
TODO

## Development

The project contains an Angular application, complete with routes, to present the project and showcase each component. The appluiication is named `demo-showcase`.
While the other components listed above require to be imported in an Angular application, the `demo-showcase` can be served instead. It is used in `development` mode
to reflect changes and develop the other components. It must be built in `production` mode in order to be served in GitHub Pages.

### Development server
Run `ng serve demo-showcase` for a development server. Navigate to `http://localhost:4200`. The application will automatically reload if you change any of the source files.

### Production build
Run `ng build -c=production --output-path docs --base-href https://biocomputingup.github.io/ngx-biocomp-up/ demo-showcase` to build the `demo-showcase` application for it to be served from GitHub Pages.

Then, one needs to copy the built `index.html` into the `404.html` file. To do so, just `cd` into the output `docs` folder and `cp index.html 404.html`.

When pushing the results in the `main` branch, GitHub will automatically publish an updated version of the appl;ication at [https://biocomputingup.github.io/ngx-biocomp-up/].

### Publishing components
Run `ng build -c=production ngx-structure-viewer` to build the Angular component `ngx-structure-viewer` in IVY mode. Hence, the built component will be compatible with almost all 
Angular applications, iindependently of its version. More on that at `https://angular.io/guide/creating-libraries`.
