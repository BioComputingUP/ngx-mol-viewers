# ngx-sequence-viewer

The ngx-sequence-viewer, frequently referred to as the sequence viewer, provides visualization and manipulation features for biological sequences, or multiple sequence alignments.

The component deliberately takes inspiration from the [ProSeqViewer](https://biocomputingup.github.io/ProSeqViewer-documentation/). However, its features have been
completely re-engineered under the hood, in order to integrate it with the Angular lifecycle.

The component allows to define a target sequence or multiple sequence alignment, through the `sequence` or `sequences` input properties, respectively.

Once target sequence(s) has been set, the number of positions is known. By default, the component
shows the numeric position of each biological unit in the sequence (e.g. amino-acids for in case of protein sequences). 
However, it is possible to set a custom index through the `index` input property.

Annotations can be defined upon target sequence(s) through the `loci` input property. In this context, a locus is 
defined as a couple of start, end positions in the previously defined `index`. 

For each input locus, a `background-color` and a `text-color` can be defined. `background-color` is applied on the border of 
biological units falling within the range defined by its start, end positions. `background-color` is applied to the content
if the biological unit only if it does not have a color itself (e.g. BLOSUM).

The `settings` property allows for more customization how the data is represented. Among them, there are:
- `rotate-index` turns the index value represented over the viewer, for it to be represented vertically. This is useful when all the positions must be shown;
- `chunk-size` defined whether to split sequence(s) in chunks, separated by a space, and how big these chunks must be. This is useful to show less index positions (e.g. only the last one in chunk);
- `color-map` associates to each code in the biological sequence a `background-color` and a `text-color`.

Finally, the component exposes some actions through as Angular outputs. Among these, the most used is the
`selected` output property, which allows to bind a function to a selected locus, defined by the user while
dragging the mouse over the component.

## Installation

To install the latest version of the features viewer into an Angular project, run:

```shell
npm install ngx-sequence-viewer
```

## Usage

First, import the component and other directives in the TypeScript file:

```typescript
import { NgxSequenceViewerComponent } from '@ngx-sequence-viewer';


@Component({
  imports : [ NgxSequenceViewerComponent ],
})
export class MyComponent {
  
}
```

Then, inject the component and other directives into the HTML template

```html
<ngx-sequence-viewer 
  [sequence]="sequence" 
  [index]="index" 
  [loci]="loci" 
  <!-- Change settings asynchronously -->
  [settings]="settings$ | async"
  <!-- Bind selection to custom function -->
  (selected$)="onSelected($event)"
></ngx-sequence-viewer>

```

## Developer notes

## Building component

Run `ng build -c=production ngx-sequence-viewer` to build the component in production mode. The build artifacts will be stored in the `dist/ngx-sequence-viewer` directory.

## Publishing component

After building your library, go to the dist folder `cd dist/ngx-sequence-viewer` and run `npm publish`.
