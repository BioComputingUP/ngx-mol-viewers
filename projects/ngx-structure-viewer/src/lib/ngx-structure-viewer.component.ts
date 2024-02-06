// prettier-ignore
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { Observable, ReplaySubject, Subscription, combineLatestWith, from, map, of, shareReplay, switchMap, tap } from 'rxjs';
// Mol* data structures
import { Structure, StructureElement, StructureProperties, StructureSelection } from 'molstar/lib/mol-model/structure';
import { MolScriptBuilder as MS } from "molstar/lib/mol-script/language/builder";
import { DefaultPluginSpec, PluginSpec } from 'molstar/lib/mol-plugin/spec';
import { Expression } from 'molstar/lib/mol-script/language/expression';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { Overpaint } from 'molstar/lib/mol-theme/overpaint';
import { Script } from 'molstar/lib/mol-script/script';
import { Asset } from 'molstar/lib/mol-util/assets';
import { Color } from 'molstar/lib/mol-util/color';
// Custom data structures
import { Source } from './source';
import { Loci, Locus } from './loci';
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms';

// // Define single contact between loci
// export type Contact<T = string> = Omit<
//   Locus<{ position: T; chain: string }>,
//   'chain'
// >;

// // Define multiple contacts between loci
// export type Contacts<T = string> = Array<Contact<T>>;

function getLocusFromQuery(query: Expression, structure: Structure): StructureElement.Loci {
  // Execute query, retrieve selection
  const selection: StructureSelection = Script.getStructureSelection(query, structure);
  // Cast selection to loci
  return StructureSelection.toLociWithSourceUnits(selection);
}

// function getLocusFromRange(start: unknown, end: unknown, structure: Structure): StructureElement.Loci {
//   // Define begin and end residues as strings
//   [start, end] = ['' + start, '' + end];
//   // Override query
//   const query = MS.struct.generator.atomGroups({
//     // Select atoms between <begin> and <end> atom IDs
//     'residue-test': MS.core.rel.inRange([
//       MS.core.str.concat([MS.ammp('auth_seq_id'), MS.ammp('pdbx_PDB_ins_code')]), start, end
//     ])
//   });
//   // Create loci
//   return getLociFromQuery(query, structure);
// }

function getLocusFromSet(set: string[], structure: Structure): StructureElement.Loci {
  // Override query
  const query = MS.struct.generator.atomGroups({
    // Select atoms between <begin> and <end> atom IDs
    'residue-test': MS.core.set.has([
      // Define subset of resdiue identifiers
      MS.set(...set),
      // Define set of residue identifiers (author sequence identifiers)
      MS.core.str.concat([MS.ammp('auth_asym_id'), MS.ammp('auth_seq_id'), MS.ammp('pdbx_PDB_ins_code')]),
    ]),
  });
  // Create loci
  return getLocusFromQuery(query, structure);
}

// Filter overpaint layers for given structure
function getFilteredBundle(layers: Overpaint.BundleLayer[], structure: Structure) {
  // Generate overpaint out of bundle
  const overpaint: Overpaint = Overpaint.ofBundle(layers, structure.root);
  // Merge overpaint layers together (order matters)
  const merged: Overpaint = Overpaint.merge(overpaint);
  // Apply overpaint on target structure
  return Overpaint.filter(merged, structure);
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ngx-structure-viewer',
  standalone: true,
  imports: [],
  template: `
    <div style="position: relative; width: 100%; height: 100%;" #outer>
      <canvas style="position: absolute; left: 0; top: 0; width: 100%; height: 100%;" #inner></canvas>
    </div>
  `,
  styles: ``,
})
export class NgxStructureViewerComponent implements AfterViewInit, OnDestroy {

  @ViewChild('outer')
  public _outer!: ElementRef;

  public get outer() {
    return this._outer.nativeElement as HTMLDivElement;
  }

  @ViewChild('inner')
  public _inner!: ElementRef;

  public get inner() {
    return this._inner.nativeElement as HTMLCanvasElement;
  }

  protected outer$ = new ReplaySubject<HTMLElement>(1);

  // Define plugin initialization pipeline
  protected plugin$: Observable<PluginContext>;

  // Dfine plugin instance
  protected plugin!: PluginContext;

  // Define structure change trigger
  protected source$ = new ReplaySubject<Source>(1);

  // On input chnage, set source
  @Input() set source(source: Source) {
    this.source$.next(source);
  }

  // Define structure generation pipeline
  protected structure$: Observable<Structure>;

  // Define map between residue id (author asym and sequence identifier, PDB insertion code)
  // and residue index (numeric) and vice-versa
  protected r2i!: Map<string, number>;
  protected i2r!: Map<number, string>;

  // Define observable for loci (and colors)
  protected loci$ = new ReplaySubject<Loci>(1);

  // Handle loci emission on change
  @Input() set loci(loci: Loci) {
    this.loci$.next(loci);
  }

  // // Define observable for contacts
  // protected contacts$ = new ReplaySubject<Contacts>(1);

  // // Handle contacts emission on change
  // @Input() set contacts(contacts: Contacts) {
  //   this.contacts$.next(contacts);
  // }

  // Define update pipeline
  protected update$: Observable<void>;

  // Define update subscription
  protected _update: Subscription;

  // Define output selection
  @Output() selected = new EventEmitter<Locus>();

  // Define output highlights
  @Output() highlighted = new EventEmitter<Locus>();

  constructor() {
    // Define pipeline for plugin initialization
    this.plugin$ = this.initPlugin();
    // Define pipeline for structure initialization
    this.structure$ = this.initStructure();
    // Define pipeline for input change
    this.update$ = this.updateRepresentation();
    // Subscribe to update pipeline
    this._update = this.update$.subscribe();
  }

  public initPlugin(): Observable<PluginContext> {
    // Define default plugin specifications
    const settings: PluginSpec = {
      // Unpack default configuration
      ...DefaultPluginSpec(),
      // config: [[PluginConfig.VolumeStreaming.Enabled, false]],
    };
    // Subscribe to parent HTML element initialization first
    return this.outer$.pipe(
      // Initialize plugin using outer, inner containers
      switchMap(() => from((async () => {
        // Initialize plugin context
        const plugin = new PluginContext(settings);
        await plugin.init();
        // Get outer, inner containers
        const { outer, inner } = this;
        // Try rendering plugin
        if (!plugin.initViewer(inner, outer)) {
          // Eventually, emit error
          throw new Error('Could not render the Mol* plugin');
        }
        // Return initialized plugin
        // NOTE It also stores a refecence to initialized plugin for later use
        return this.plugin = plugin;
      })())),
      // Cache result, since this might mìbe subscripted multiple times
      // and we do not want the plugin to be re-initialized each time
      shareReplay(1)
    );
  }

  public initStructure() {
    // First, subscribe to plugin initialization
    return this.plugin$.pipe(
      // Then, subscribe to changes in source
      combineLatestWith(this.source$),
      // Cast combined values to object
      map(([plugin, source]) => ({ plugin, source })),
      // Retrieve data
      switchMap(({ plugin, source }) => {
        // Define data retrieval pipeline
        const data$ = from((async () => {
          const label = source.label;
          const binary = source.binary;
          // Handle local source data
          if (source.type === 'local') {
            // Case source data is string, no need to read data as file
            if (typeof source.data === 'string') {
              // Read file from string
              return plugin.builders.data.rawData({ data: source.data, label });
            }
            // Otherwise, data must be read as file
            else {
              // Wrap blob into file
              let file: Asset.File;
              // Case source data is blob, file must be created
              if (source.data instanceof Blob) {
                // Get file name
                const ext = source.format === 'mmcif' ? 'cif' : 'ent';
                const name = `${label}.${ext}`;
                // Generate file
                file = Asset.File(new File([source.data], name));
              }
              // Otherwise
              else {
                // File is already available
                file = Asset.File(source.data);
              }
              // Return data read from file
              return plugin.builders.data.readFile({ file, label, isBinary: binary });
            }
          }
          // Handle remote source data
          else if (source.type === 'remote') {
            const url = Asset.Url(source.link);
            const label = source.label;
            const binary = source.binary;
            // Retrieve remote data
            return plugin.builders.data.download({ url, label, isBinary: binary });
          }
          // Otherwise, throw an error
          throw new Error('Given source data is not valid');
        })());
        // Return initial values, along with retrieved data
        return data$.pipe(
          // Wrap data into object
          map((data) => ({ data })),
          // Combine with initial values
          combineLatestWith(of({ plugin, source })),
          // Combine all into the same object
          map(([{ data }, { plugin, source }]) => ({ plugin, source, data })),
        );
      }),
      // Draw trajectory
      switchMap(({ plugin, source, data }) => {
        // Unpack source parameters
        const { label, format } = source;
        // Cast Promise to Observable
        return from((async () => {
          // TODO Build trajectory out of given data
          const trajectory = await plugin.builders.structure.parseTrajectory(data as never, format);
          // Create model
          const model = await plugin.builders.structure.createModel(trajectory);
          // TODO Create structure
          const structure = await plugin.builders.structure.createStructure(model, {
            name: 'model',
            params: {}
          });
          // Create component for the whole structure
          const component = await plugin.builders.structure.tryCreateComponentStatic(structure, 'polymer', { label });
          // Initialize white representation
          await plugin.builders.structure.representation.addRepresentation(component!, {
            type: 'cartoon',
            color: 'uniform',
            colorParams: {
              value: Color(0xffffff)
            }
          });
          // Return structure data
          return structure.cell?.obj?.data as Structure;
        })());
      }),
      // TODO Map residue id to its index and vice-versa
      tap((structure) => {
        // Initialize index
        let index = 0;
        // Initialize map between residue (sequence number, insertion code) to numeric index
        const r2i = this.r2i = new Map();
        const i2r = this.i2r = new Map();
        // Loop through each residue
        Structure.eachAtomicHierarchyElement(structure, ({
          // Do nothing on residue loop
          residue: (r) => {
            // Define residue index
            const authSeqId = StructureProperties.residue.auth_seq_id(r);
            // Get insertion code
            const pdbInsCode = StructureProperties.residue.pdbx_PDB_ins_code(r);
            // Define residue name
            const authAsymId = StructureProperties.chain.auth_asym_id(r);
            // Define residue unique identifier
            const identifier = (authAsymId + authSeqId + pdbInsCode).trim()
            // Map residue id to its index
            r2i.set(identifier, index);
            i2r.set(index, identifier);
            // Update index
            index++;
          },
        }));
        // TODO Remove this
        console.log('Residue to index', r2i);
        console.log('Index to residue', i2r);
      }),
      // Cache results
      shareReplay(1),
    );
  }

  public updateRepresentation() {
    // First, subscribe structure change
    return this.structure$.pipe(
      // // TODO As well as input loci and contacts change
      // combineLatestWith(this.loci$, this.contacts$),
      // TODO Update representation on loci emission
      combineLatestWith(this.loci$),
      // Unpack structure, loci
      map(([structure, loci]) => ({ structure, loci, plugin: this.plugin })),
      // First, cast string loci to numeric loci
      // Then, cast numeric loci to array of residue identifiers
      map(({ structure, loci: prev, plugin}) => {
        // Get residue identifiers
        const ids = [...this.i2r.values()];
        // Initialize loci as list of residue ranges
        const curr = prev.map((p) => {
          // Get numeric start index
          const start = this.r2i.get(p.chain + p.start)!;
          const end = this.r2i.get(p.chain + p.end)!;
          // Add residue identifier to current locus
          return { ...p, ids: ids.slice(start, end + 1) }
        });
        // Return updated loci, as well as structure (data) and plugin
        return { structure, loci: curr, plugin };
      }),
      // Apply colors
      switchMap(({ structure, loci, plugin }) => {
        // Initialize color layers
        const layers = [] as Overpaint.BundleLayer[];
        // Fill in map between color and residues
        for (const { ids, color: hex } of loci) {
          // Define current Mol* loci
          // const locus = getLociFromRange(start, end, structure);
          const locus = getLocusFromSet(ids, structure);
          // Define current Mol* bundle
          const bundle = StructureElement.Bundle.fromLoci(locus);
          // Compute color
          const color = Color.fromHexStyle(hex || '#000000');
          // // TODO Remove this
          // console.log('Locus', { start, end, color: hex});
          // console.log('Color', color);
          // Define and store current layer
          layers.push({ bundle, color, clear: false });
        }
        // Initialize plugin update
        const update = plugin.state.data.build();
        // Filter bundle of layers
        const bundle = getFilteredBundle(layers, structure);
        // Loop through structures in plugin
        for (const structureRef of plugin.managers.structure.hierarchy.current.structures) {
          // Loop through components in current structure
          for (const componentRef of structureRef.components) {
            // Loop through each representation in current component
            for (const representationRef of componentRef.representations) {
              // Apply update on current representation
              update
                .to(representationRef.cell.transform.ref)
                .apply(
                  StateTransforms.Representation.OverpaintStructureRepresentation3DFromBundle,
                  // TODO Types not working
                  Overpaint.toBundle(bundle as never)
                );
            }
          }
        }
        // Cast promise to observable
        return from(update.commit({ doNotUpdateCurrent: true }));
      }),
      // Return nothing
      map(() => void 0),
    );
  }

  public ngAfterViewInit(): void {
    // Emit parent element
    this.outer$.next(this.outer);
  }

  public ngOnDestroy(): void {
    // Unsubscribe
    this._update.unsubscribe();
  }
}
