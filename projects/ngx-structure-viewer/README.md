# ngx-structure-viewer

The ngx-structure-viewer, frequently referred to as the structure viewer, allows to visualize and manipulate three-dimensional protein structures. 

The component wraps a [Molstar](https://molstar.org/) instance within and Angular standalone component. Furthermore, it wires up Angular input and output
properties in order to integrate it with other Angular components and application.

The component allows to define the source for a target biological structure to be represented, through the `source` input parameter.

The `source` given as input might be an URL, where a mmCIF or PDBx file can be downloaded,
or the content of one of such files.

Regions in the represented biological structure can be represented differently with respect to the structure itself.
This can be achieved using the `loci` input parameter. Each locus is defined as a start, end position defined using a composite index
retrieved by concatenating residue number and PDBx insertion code from source structure.

Overall representation can be tweaked using the `settings` input parameter.
For example, the `background-color` and the `backbone-color` settings can be changed according to the current
theme of the page.

**NOTE** The Molstar package is usually quite heavy, as it weights ~3MB. Thus, it has been lazily loaded by the ngx-structure-viewer.
This allows to avoid performance issued during compilation of the component itself, making navigation faster and smoother.

## Installation

To install the latest version of the features viewer into an Angular project, run:

```shell
npm install ngx-structure-viewer
```

## Usage

First, import the component and other directives in the TypeScript file:

```typescript
import { NgxSequenceViewerComponent } from '@ngx-sequence-viewer';


@Component({
  imports : [ NgxStructureViewerComponent ],
})
export class MyComponent {
  
}
```

Then, inject the component and other directives into the HTML template

```html
<ngx-structure-viewer 
  [settings]="settings" 
  [source]="source" 
  <!-- Define loci dynamically -->
  [loci]="(chains$ | async) || []"
></ngx-structure-viewer>
```

## Developer notes

## Building component

Run `ng build -c=production ngx-structure-viewer` to build the component in production mode. The build artifacts will be stored in the `dist/ngx-structure-viewer` directory.

## Publishing component

After building your library, go to the dist folder `cd dist/ngx-structure-viewer` and run `npm publish`.
