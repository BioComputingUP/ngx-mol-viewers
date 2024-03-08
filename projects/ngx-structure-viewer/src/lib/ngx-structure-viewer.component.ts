import { Observable, ReplaySubject, Subscription, combineLatestWith, from, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, Output, ViewChild } from '@angular/core';
// Mol* data structures
import { Structure, StructureElement, StructureProperties, StructureSelection } from 'molstar/lib/mol-model/structure';
import { MolScriptBuilder as MS } from "molstar/lib/mol-script/language/builder";
import { DefaultPluginSpec, PluginSpec } from 'molstar/lib/mol-plugin/spec';
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms';
import { Expression } from 'molstar/lib/mol-script/language/expression';
import { PluginBehaviors } from 'molstar/lib/mol-plugin/behavior';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { Overpaint } from 'molstar/lib/mol-theme/overpaint';
import { Script } from 'molstar/lib/mol-script/script';
import { Asset } from 'molstar/lib/mol-util/assets';
// import { Color } from 'molstar/lib/mol-util/color';
// Custom services
import { SettingsService } from './services/settings.service';
// Custom data structures
import { fromHexString } from './entities/colors';
import { Loci, Locus } from './entities/loci';
import { Settings } from './entities/settings';
import { Source } from './entities/source';
import { Color } from 'molstar/lib/mol-util/color';



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
  // Handle dependencies
  imports: [],
  standalone: true,
  // Handle representation
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

  protected select$ = new ReplaySubject<Locus | null>();

  @Input() set select(locus: Locus | null) {
    // Emit selected locus
    this.select$.next(locus);
  }

  @Output() selected: Observable<Locus | null>;

  protected _selected: Subscription;

  protected highlight$ = new ReplaySubject<Locus | null>();

  @Input() set highlight(locus: Locus | null) {
    // Emit highlighted locus
    this.highlight$.next(locus);
  }

  @Output() highlighted: Observable<Locus | null>;

  protected _highlighted: Subscription; 

  @Input() set settings(settings: Settings) {
    // Define settings
    this.settingsService.settings = settings;
  }

  get settings(): Settings {
    // Retrieve current settings
    return this.settingsService.settings;
  }

  readonly settings$ = this.settingsService.settings$;

  constructor(
    public settingsService: SettingsService,
  ) {
    // Define pipeline for plugin initialization
    this.plugin$ = this.initPlugin();
    // Define pipeline for structure initialization
    this.structure$ = this.initStructure();
    // Define pipeline for input change
    this.update$ = this.updateRepresentation();
    // Subscribe to update pipeline
    this._update = this.update$.subscribe();

    // Emit selected locus
    this.selected = this.select$.pipe(
      // Get structure instance
      combineLatestWith(this.structure$),
      // Get plugin instance
      combineLatestWith(this.plugin$),
      // Wrap everythin together
      map(([[locus, structure], plugin]) => ({ plugin, structure, locus })),
      // TODO Cast locus to list of residues
      map(({ plugin, structure, locus: prev }) => {
        // Initialize current locus
        let curr = { start: '', end: '', chain: '', ids: [] as string[] };
        // Case previous locus is not empty
        if (prev) {
          // Get residue identifiers
          const ids = [...this.i2r.values()];
          // Get numeric start index
          const start = this.r2i.get(prev.chain + prev.start)!;
          const end = this.r2i.get(prev.chain + prev.end)!;
          // Add residue identifier to current locus
          curr = { ...prev, ids: ids.slice(start, end + 1) };
        }
        // Return updated loci, as well as structure (data) and plugin
        return { structure, locus: curr, plugin };
      }),
      // TODO Generate locus from list
      map(({ plugin, structure, locus }) => {
        // Case selected locus is defined
        if (locus.ids.length > 0) {
          // Map object locus to Mol* locus
          const _locus = getLocusFromSet(locus.ids, structure);
          // Update highlights
          plugin.managers.structure.selection.fromLoci('set', _locus);
        }
        // Return input locus, if defined
        return locus.start ? locus as Locus : null;
      }),
    );
    // Subscribe to select
    this._selected = this.selected.subscribe();

    // Emit highlighted locus
    this.highlighted = this.highlight$.pipe(
      // Get structure instance
      combineLatestWith(this.structure$),
      // Get plugin instance
      combineLatestWith(this.plugin$),
      // TODO Remove this
      // Wrap everythin together
      map(([[locus, structure], plugin]) => ({ plugin, structure, locus })),
      // TODO Cast locus to list of residues
      map(({ plugin, structure, locus: prev }) => {
        // Initialize current locus
        let curr = { start: '', end: '', chain: '', ids: [] as string[] };
        // Case previous locus is not empty
        if (prev) {
          // Get residue identifiers
          const ids = [...this.i2r.values()];
          // Get numeric start index
          const start = this.r2i.get(prev.chain + prev.start)!;
          const end = this.r2i.get(prev.chain + prev.end)!;
          // Add residue identifier to current locus
          curr = { ...prev, ids: ids.slice(start, end + 1) };
        }
        // Return updated loci, as well as structure (data) and plugin
        return { structure, locus: curr, plugin };
      }),
      // TODO Generate locus from list
      map(({ plugin, structure, locus }) => {
        // Case locus is defined
        if (locus.ids.length > 0) {
          // Map object locus to Mol* locus
          const _locus = getLocusFromSet(locus.ids, structure);
          // Update highlights
          // plugin.managers.camera.focusLoci(_locus);
          plugin.managers.interactivity.lociHighlights.highlightOnly({ loci: _locus });
        }
        // Return input locus, if defined
        return locus.start ? locus as Locus : null;
      }),
    );
    // Subscribe to highlight
    this._highlighted = this.highlighted.subscribe();
  }

  public initPlugin(): Observable<PluginContext> {
    // Define default plugin specifications
    const settings: PluginSpec = {
      // Unpack default configuration
      ...DefaultPluginSpec(),
      // Define behaviors
      behaviors: [
        PluginSpec.Behavior(PluginBehaviors.Representation.HighlightLoci, { mark: true }),
        PluginSpec.Behavior(PluginBehaviors.Representation.DefaultLociLabelProvider),
        PluginSpec.Behavior(PluginBehaviors.Camera.FocusLoci),
        PluginSpec.Behavior(PluginBehaviors.Representation.FocusLoci),
        // PluginSpec.Behavior(PluginBehaviors.CustomProps.Interactions),
        PluginSpec.Behavior(PluginBehaviors.Representation.HighlightLoci),
        PluginSpec.Behavior(PluginBehaviors.Representation.SelectLoci),
        PluginSpec.Behavior(PluginBehaviors.Representation.FocusLoci),
        PluginSpec.Behavior(PluginBehaviors.Camera.FocusLoci),
        PluginSpec.Behavior(PluginBehaviors.Camera.CameraAxisHelper),
        PluginSpec.Behavior(PluginBehaviors.CustomProps.StructureInfo),
        PluginSpec.Behavior(PluginBehaviors.CustomProps.AccessibleSurfaceArea),
        PluginSpec.Behavior(PluginBehaviors.CustomProps.Interactions),
        PluginSpec.Behavior(PluginBehaviors.CustomProps.SecondaryStructure),
        PluginSpec.Behavior(PluginBehaviors.CustomProps.ValenceModel),
        PluginSpec.Behavior(PluginBehaviors.CustomProps.CrossLinkRestraint),
      ]
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
      // Then, subscribe to settings emission
      combineLatestWith(this.settings$),
      // Cast combined values to object
      map(([[plugin, source], settings]) => ({ plugin, settings, source })),
      // Update background color
      tap(({ plugin, settings }) => {
        // Get background color
        const [ color, alpha ] = fromHexString(settings.background);
        // Set background color
        plugin.canvas3d?.setProps({
          // TODO Define background transparency
          // transparentBackground: alpha == 0.5,
          // Change background color
          renderer: { 
            backgroundColor: color, 
            pickingAlphaThreshold: alpha,
          }
        })
      }),
      // Retrieve data
      switchMap(({ plugin, settings, source }) => {
        // Define data retrieval pipeline
        const data$ = from((async () => {
          const label = source.label;
          const binary = source.binary;
          // Handle local source data
          if (source.type === 'local') {
            // Case source data is string, no need to read data as file
            if (typeof source.data === 'string') {
              // // TODO Remove this
              // console.log(source.data);
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
          combineLatestWith(of({ plugin, settings, source })),
          // Combine all into the same object
          map(([{ data }, { plugin, settings, source }]) => ({ plugin, settings, source, data })),
        );
      }),
      // Draw trajectory
      switchMap(({ plugin, settings, source, data }) => {
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
          // Define color
          const [ value ] = fromHexString(settings.color);
          // Initialize white representation
          await plugin.builders.structure.representation.addRepresentation(component!, {
            type: 'cartoon',
            color: 'uniform',
            colorParams: { value },
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
      map(({ structure, loci: prev, plugin }) => {
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
          const [ color ] = fromHexString(hex || this.settings.color);
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
              // TODO Define locus for all residues
              const _locus = getLocusFromSet([...this.i2r.values()], structure);
              const _bundle = StructureElement.Bundle.fromLoci(_locus);
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const [ _color, alpha ] = fromHexString(this.settings.color); 
              // TODO Apply transparency to representation
              update
                .to(representationRef.cell.transform.ref)
                .apply(
                  StateTransforms.Representation.TransparencyStructureRepresentation3DFromBundle,
                  { layers: [{ bundle: _bundle, value: alpha }] },
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
    this._selected.unsubscribe();
    this._highlighted.unsubscribe();
  }
}
