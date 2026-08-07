# ngx-mol-viewers

## Introduction

The ngx-mol-viewers is an Angular library consisting in a collection components for the visualization and manipulation of biological data.
Each component has been developed as an [Angular standalone component](https://v17.angular.io/guide/standalone-components). This means, it can be easily installed and imported in the most widespread
versions of the framework.

The library was initially developed to share some core components between the applications developed at the [BioCompUP Laboratory](https://protein.bio.unipd.it/), at the University of Padua. 
Among those, there are [MobiDB](https://mobidb.org/), [RepeatsDB](https://repeatsdb.bio.unipd.it/) and [RING](https://ring.biocomputingup.it/). Some of the components in the library were inspired by others already developed within the same laboratory, like the [ProSeqViewer](https://www.npmjs.com/package/proseqviewer) and the[FeatureViewerTypescript](https://www.npmjs.com/package/feature-viewer-typescript). 
Some others are based on well-known components already used in bioinformatics, like [Molstar](https://molstar.org/). 

In both cases, the library makes the components compliant with Angular lifecycle, by satisfying the Angular standalone components specifications. 
This, removes the burden of handling the Angular lifecycle within every Angular application.

Each component has its own NPM repository and can be installed without the others, as they just share the same data structures and requirements.

## Version compatibility

| Angular Version | @biocomputingup/ngx-*-viewer |
| --------------- | ---------------------------- |
| ^18.0.0         | ^1.0.0                       |
| ^19.0.0         | ^2.0.0                       |
| ^20.0.0         | ^3.0.0                       |
| ^21.0.0         | ^4.0.0                       |
| ^22.0.0         | ^5.0.0                       |

## Components

### ngx-structure-viewer

The *ngx-structure-viewer* allows to visualize and manipulate three-dimensional protein structures. It wraps a Molstar instance within and Angular standalone component.

Go to component's [NPM repository](https://www.npmjs.com/package/@biocomputingup/ngx-structure-viewer)

Go to component's [README]()

### ngx-sequence-viewer

The *ngx-sequence-viewer* provides visualization and manipulation for single sequences and multiple sequence alignments.
It deliberately takes inspiration on the ProSeqViewer.

Go to component's [NPM repository](https://www.npmjs.com/package/@biocomputingup/ngx-sequence-viewer)

Go to component's [README]()

### ngx-features-viewer

The *ngx-features-viewer* extends the features provided by the fate FeatureViewerTypeScript. It has been completely re-engineered and optimized
to provide the best adaptability and performance.

Go to component's [NPM repository](https://www.npmjs.com/package/@biocomputingup/ngx-features-viewer)

Go to component's [README]()

## Developer notes

The project contains an Angular application, complete with routes, to present the project and showcase each component. The appluiication is named `demo-showcase`.

While the other components listed above require to be imported in an Angular application, the `demo-showcase` can be served instead. It is used in `development` mode
to reflect changes and develop the other components.

The application must be built in `production` mode in order to be served in GitHub Pages.

### Development server

Run `ng serve demo-showcase` for a development server. Navigate to `http://localhost:4200`. The application will automatically reload if you change any of the source files.

### Production build

Run `ng build -c=production --output-path docs --base-href https://biocomputingup.github.io/ngx-mol-viewers/ demo-showcase` to build the `demo-showcase` application for it to be served from GitHub Pages.

Then, one needs to copy the built `index.html` into the `404.html` file. To do so, just `cd` into the output `docs` folder and `cp index.html 404.html`.

When pushing the results in the `main` branch, GitHub will automatically publish an updated version of the appl;ication at [https://biocomputingup.github.io/ngx-mol-viewers/].

### Publishing components

Run `ng build -c=production ngx-structure-viewer` to build the Angular component `ngx-structure-viewer` in IVY mode.

Built component will be compatible with almost all Angular applications, independently of its version. More on this at `https://angular.io/guide/creating-libraries`.

In order to public the previously build `ngx-structure-viewer` in its NPM repository, execute the following:
```shell
cd dist/ngx-structure-viewer
npm publish
```

**NOTE** before building, ensure that the version number increased, otherwise NPM will prevent publication.
