# ngx-features-viewer

The ngx-features-viewer, frequently referred to as the features viewer, provides visualization and manipulation capabilities for biological annotations upon a biological entity.

Frequently, target entities are protein sequences or protein structures. Protein structures taken from the PDB or the AlphaFoldDB are frequently using the mmCIF or PDBx formats. 
Both these formats might have alphanumeric indices. Thus, the component can take as input a custom index.

The annotated biological entity can be provided to the component using its `sequence` input property. Annotation can be defined using the `traces` input property instead.
The concept of traces has been derived mixing the concept of sparklines and traces in Plotly. 

The traces have a hierarchy, which is reflected on their representation. The user can open/close a parent trace to
show/hide its child traces.

The component is highly customizable. The whole HTML content of its tooltip, left labels and right labels can be defined exploiting Angular's [content projection](https://v17.angular.io/guide/content-projection).

Global settings can be set for all components by means of the `settings` input property. Settings defined directly on a trace override the global ones.

## Installation

To install the latest version of the features viewer into an Angular project, run:

```shell
npm install ngx-features-viewer
```
## Version compatibility

| Angular Version | @biocomputingup/ngx-features-viewer |
| --------------- | ----------------------------------- |
| ^18.0.0         | ^1.0.0                              |
| ^19.0.0         | ^2.0.0                              |
## Usage

First, import the component and other directives in the TypeScript file:

```typescript
import {
  NgxFeaturesViewerComponent,
  NgxFeaturesViewerLabelDirective,
  NgxFeaturesViewerTooltipDirective,
  SelectionContext,
  Sequence,
  Settings,
  Trace,
} from '@ngx-features-viewer';

@Component({
  imports : [
    NgxFeaturesViewerTooltipDirective,
    NgxFeaturesViewerLabelDirective,
    NgxFeaturesViewerComponent,
  ],
})
export class MyComponent {
  
}
```

Then, inject the component and other directives into the HTML template

```html
<ngx-features-viewer [sequence]="sequence" [traces]="traces" [settings]="(settings$ | async)!" (selectedFeature)="onFeatureSelected($event)">
  <!-- Left label -->
  <ng-template let-trace="trace" ngx-features-viewer-label>
    ...
  </ng-template>
  <!-- Right label -->
  <ng-template let-trace="trace" ngx-features-viewer-label where="right">
    ...
  </ng-template>
  <!-- Tooltip template -->
  <ng-template let-trace="trace" let-feature="feature" let-index="index" let-coordinates="coordinates" ngx-features-viewer-tooltip>
    ...
  </ng-template>
</ngx-features-viewer>
```

## Developer notes

## Building component

Run `ng build -c=production ngx-features-viewer` to build the component in production mode. The build artifacts will be stored in the `dist/ngx-features-viewer` directory.

## Publishing component

After building your library, go to the dist folder `cd dist/ngx-features-viewer` and run `npm publish`.
