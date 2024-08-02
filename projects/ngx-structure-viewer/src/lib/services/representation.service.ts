import { Injectable, OnDestroy } from '@angular/core';
import { Structure } from 'molstar/lib/mol-model/structure';
import { StaticStructureComponentType } from 'molstar/lib/mol-plugin-state/helpers/structure-component';
import {
  BehaviorSubject,
  combineLatestWith,
  filter,
  from,
  map,
  Observable,
  ReplaySubject,
  shareReplay,
  Subscription,
  switchMap,
  withLatestFrom,
} from 'rxjs';
// Custom dependencies
// import { Interaction, Interactor } from '../interfaces/interaction';
import { Interaction } from '../interfaces/interaction';
import { Locus } from '../interfaces/locus';
import { Source } from '../interfaces/source';
import { BundleLayer } from '../molstar';
import { MolstarService } from './molstar.service';
import { PluginService } from './plugin.service';
import { SettingsService } from './settings.service';
// import { CreateMeshProvider } from './interactions.provider';
import { StructureService, StructureStateObject } from './structure.service';

@Injectable()
export class RepresentationService implements OnDestroy {

  readonly loci$ = new BehaviorSubject<Locus[]>([]);

  readonly interactions$ = new ReplaySubject<Interaction[]>(1);

  public set interactions(interactions: Interaction[]) {
    this.interactions$.next(interactions);
  }

  // readonly structure$: Observable<Structure>

  public representation$: Observable<void>;

  protected _representation: Subscription;

  constructor(
    public structureService: StructureService,
    public settingsService: SettingsService,
    public molstarService: MolstarService,
    public pluginService: PluginService,
  ) {
    // Get source
    const source$ = this.structureService.source$.pipe(
      // Filter out null values
      filter((source): source is Source => source != null),
    );

    // Build component for structure
    const component$: Observable<void> = this.structureService.structure$.pipe(
      // Get latest source
      withLatestFrom(source$),
      // Generate structure
      switchMap(([structure]) => from(this.createRepresentation(structure))),
      // Cache result
      shareReplay(1),
    );

    // Apply settings to representation
    this.representation$ = component$.pipe(
      // Combine with settings emission
      combineLatestWith(this.settingsService.settings$),
      // Combine with loci emission
      combineLatestWith(this.loci$),
      // In the case we changed the structure, we need to wait for it to be loaded again
      filter(() => this.structureService.isStructureLoaded),
      // Define color / alpha layers to be applied to structure
      map(([[, settings], loci]) => {
        // Define locus for backbone color
        const backboneLayer = this.locusToBundleLayer({color : settings['backbone-color']});
        // Define layers for loci
        const lociLayers = loci.map((locus) => this.locusToBundleLayer(locus));
        // Return bundle layers
        return [backboneLayer, ...lociLayers];
      }),
      // Apply colors to representation
      switchMap((bundleLayers) => from(this.colorRepresentation(this.structureService.structure, bundleLayers))),
      // Cache results
      //shareReplay(1),
    );


    // // Define loci representation pipeline
    // const loci$ = this.structure$.pipe(
    //   // With loci emission
    //   combineLatestWith(this.loci$),
    //   // Apply loci representation
    //   // switchMap(([structure, loci]) => from(this.getLociRepresentation(structure, loci))),
    //   // Cache result
    //   shareReplay(1),
    // );
    // this.getLociRepresentation();
    // // Define interactions representation pipeline
    // const interactions$ = this.getInteractionsRepresentation();

    // // Combine structure emission
    // this.representation$ = this.structure$.pipe(
    //   // // With loci representation pipeline
    //   // combineLatestWith(loci$),
    //   // // And interactions representation pipeline
    //   // combineLatestWith(interactions$),
    //   // Return void
    //   map(() => void 0),
    //   // Cache result
    //   shareReplay(1),
    // );

    // Subscribe to representation pipeline
    this._representation = this.representation$.subscribe();
  }

  public ngOnDestroy(): void {
    // Remove subscription
    this._representation.unsubscribe();
  }

  protected locusToBundleLayer(locus: Partial<Locus>): BundleLayer {
    // Get Mol* lazy loaded dependencies
    const Molstar = this.molstarService.molstar;
    // Define all residue identifiers
    let residueIds = Array.from(this.structureService.i2r.values());
    // Initialize numeric start, end indices
    let [locusNumericStart, locusNumericEnd] = [0, residueIds.length];
    // In case chain is defined
    if (locus?.chain !== undefined) {
      // Get chain start and end indices
      [locusNumericStart, locusNumericEnd] = this.structureService.c2i.get(locus.chain) ?? [locusNumericStart, locusNumericEnd];
    }
    // Case both start and end indices are defined
    if (locus.chain && (locus?.start !== undefined && locus?.end !== undefined)) {
      // Define full locus start
      const locusFullStart = locus.chain + locus.start;
      const locusFullEnd = locus.chain + locus.end;

      if (this.checkIndexes(locusFullStart, locusFullEnd)) {
        // Slice residues by start and end positions
        locusNumericStart = this.structureService.r2i.get(locusFullStart)!;
        locusNumericEnd = this.structureService.r2i.get(locusFullEnd)!;
      } else {
        [locusNumericStart, locusNumericEnd] = [Number.NaN, Number.NaN];
        console.error('Invalid locus start and end indices', locus);
      }
    }
    // Get residue identifiers
    residueIds = residueIds.slice(locusNumericStart, locusNumericEnd + 1);
    // Get Mol* locus
    const representationLoci = Molstar.getLocusFromSet(residueIds, this.structureService.structure);
    // Define current Mol* bundle
    const bundleLayer = Molstar.getBundleFromLoci(representationLoci);  // StructureElement.Bundle.fromLoci(locus);
    // Cast HEX color to Mol* color
    const [representationColor, representationAlpha] = Molstar.colorFromHexString(locus?.color || '#ffffffff');
    // Return BundleLayer
    return {bundle : bundleLayer, color : representationColor, alpha : representationAlpha, clear : false};
  }

  private checkIndexes(locusFullStart: string, locusFullEnd: string) {
    return this.structureService.r2i.has(locusFullStart) && this.structureService.r2i.has(locusFullEnd);
  }

  protected async createRepresentation(structure: StructureStateObject): Promise<void> {
    // Define plugin instance
    const plugin = this.pluginService.plugin;
    // Create component for the whole structure
    let component = await plugin.builders.structure.tryCreateComponentStatic(structure, 'all');
    // Initialize representation
    await plugin.builders.structure.representation.addRepresentation(component!, {type : 'cartoon', color : 'uniform'});

    for (const componentType of ['ion', 'ligand', 'lipid']) {
      component = await plugin.builders.structure.tryCreateComponentStatic(structure, <StaticStructureComponentType>componentType);
      // Initialize representation
      await plugin.builders.structure.representation.addRepresentation(component!, {
        type : 'ball-and-stick',
        color : 'uniform',
      });
    }

    if (this.settingsService.settings['show-water']) {
      component = await plugin.builders.structure.tryCreateComponentStatic(structure, 'water');
      // Initialize representation
      await plugin.builders.structure.representation.addRepresentation(component!, {
        type : 'ball-and-stick',
        color : 'uniform',
      });
    }

  }

  protected async colorRepresentation(structure: Structure, layers: BundleLayer[]): Promise<void> {
    // Get Mol* lazy loaded dependencies
    const Molstar = this.molstarService.molstar;
    // Define color layers
    const colorLayers = layers.map(({bundle, color, clear}) => ({bundle, color, clear}));
    const alphaLayers = layers.map(({bundle, alpha}) => ({bundle, value : alpha}));
    // // Filter bundle of layers
    // const colorBundle = Molstar.getFilteredBundle(colorLayers, structure);
    // Define plugin instance
    const {plugin} = this.pluginService;
    // Initialize plugin update
    const update = plugin.state.data.build();
    // Loop through structures in plugin
    for (const structureRef of plugin.managers.structure.hierarchy.current.structures) {
      // Loop through components in current structure
      for (const componentRef of structureRef.components) {
        // Loop through each representation in current component
        for (const representationRef of componentRef.representations) {
          // Apply color to current representation
          update.to(representationRef.cell.transform.ref).apply(
            Molstar.OverpaintStructureRepresentation3DFromBundle,
            // TODO Fix this 
            {layers : colorLayers},
          );
          // Apply transparency to current representation
          update.to(representationRef.cell.transform.ref).apply(
            Molstar.TransparencyStructureRepresentation3DFromBundle,
            {layers : alphaLayers},
          );
        }
      }
    }
    // Apply update
    await update.commit({canUndo : false, doNotUpdateCurrent : false});
  }

  // protected async getLociRepresentation(structure: Structure, loci: Locus[]): Promise<void> {
  //   // // Cast each locus as list of indices, rather than just [start, end] boundaries
  //   // const indices = loci.map((locus) => {
  //   //   // Case start position is defined, then initialize end position
  //   //   if (locus.start ) {
  //   //     // Initialize end position
  //   //     end = end || start;
  //   //     // Get numeric start index
  //   //     const startIdx = this.structureService.r2i.get(start)!;
  //   //     const endIdx = this.structureService.r2i.get(end)!;
  //   //     // Return list of indices
  //   //     return Array.from({ length: endIdx - startIdx + 1 }, (_, i) => startIdx + i);
  //   //   }
  //   //   // Otherwise, filter residues by chain
  //   //   else {
  //   //     // Get list of identifiers whose value starts with given chain
  //   //     return Array.from(this.structureService.i2r.values()).filter((id) => id.startsWith(loci[0].chain));
  //   //   }
  //   // });
  //   //   // Map numeric locis to set of residue identifiers
  //   //   map(({ structure, loci: prev }) => {
  //   //     // Get residue identifiers
  //   //     const ids = [...this.structureService.i2r.values()];
  //   //     // Initialize loci as list of residue ranges
  //   //     const curr = prev.map((p) => {
  //   //       // Case start psoition is defined, then initialize end position
  //   //       if (p.start) {
  //   //         // Initialize end position
  //   //         p = { ...p, end: p.end || p.start };
  //   //         // Get numeric start index
  //   //         const start = this.structureService.r2i.get(p.chain + p.start)!;
  //   //         const end = this.structureService.r2i.get(p.chain + p.end)!;
  //   //         // Add residue identifier to current locus
  //   //         return { ...p, ids: ids.slice(start, end + 1) }
  //   //       }
  //   //       // Otherwise, filter residues by chain
  //   //       else {
  //   //         // Get list of identifiers whose value starts with given chain
  //   //         return { ...p, ids: ids.filter((id) => id.startsWith(p.chain)) };
  //   //       }
  //   //     });
  //   //     // Return updated loci, as well as structure (data) and plugin
  //   //     return { structure, loci: curr };
  //   //   }),
  //   //   // // Combine with settings emission
  //   //   // combineLatestWith(this.settingsService.settings$),
  //   //   // Apply colors
  //   //   // switchMap(([{ structure, loci }, settings]) => {
  //   //   switchMap(({ structure, loci }) => {
  //   //     // Initialize color layers
  //   //     const layers = [] as Overpaint.BundleLayer[];
  //   //     // Fill in map between color and residues
  //   //     for (const { ids, color: hex } of loci) {
  //   //       // Define current Mol* loci
  //   //       // const locus = getLociFromRange(start, end, structure);
  //   //       const locus = getLocusFromSet(ids, structure);
  //   //       // Define current Mol* bundle
  //   //       const bundle = StructureElement.Bundle.fromLoci(locus);
  //   //       // Compute color
  //   //       // const [color] = fromHexString(hex || settings['backbone-color']);
  //   //       const [color] = fromHexString(hex || '#000000');
  //   //       // Define and store current layer
  //   //       layers.push({ bundle, color, clear: false });
  //   //     }
  //   //     // Define plugin instance
  //   //     const plugin = this.pluginService.plugin;
  //   //     // Initialize plugin update
  //   //     const update = plugin.state.data.build();
  //   //     // Filter bundle of layers
  //   //     const bundle = getFilteredBundle(layers, structure);
  //   //     // Loop through structures in plugin
  //   //     for (const structureRef of plugin.managers.structure.hierarchy.current.structures) {
  //   //       // Loop through components in current structure
  //   //       for (const componentRef of structureRef.components) {
  //   //         // Loop through each representation in current component
  //   //         for (const representationRef of componentRef.representations) {
  //   //           // Apply update on current representation
  //   //           update
  //   //             .to(representationRef.cell.transform.ref)
  //   //             .apply(
  //   //               StateTransforms.Representation.OverpaintStructureRepresentation3DFromBundle,
  //   //               Overpaint.toBundle(bundle as never)
  //   //             );
  //   //           // // TODO Define locus for all residues
  //   //           // const _locus = getLocusFromSet([...this.structureService.i2r.values()], structure);
  //   //           // const _bundle = StructureElement.Bundle.fromLoci(_locus);
  //   //           // // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   //           // const [_color, alpha] = fromHexString(this.settingsService.settings['backbone-color']);
  //   //           // // TODO Apply transparency to representation
  //   //           // update
  //   //           //   .to(representationRef.cell.transform.ref)
  //   //           //   .apply(
  //   //           //     StateTransforms.Representation.TransparencyStructureRepresentation3DFromBundle,
  //   //           //     { layers: [{ bundle: _bundle, value: alpha }] },
  //   //           //   );
  //   //         }
  //   //       }
  //   //     }
  //   //     // Cast promise to observable
  //   //     return from(update.commit({ doNotUpdateCurrent: true }));
  //   //   }),
  //   // );
  // }

  // protected getInteractionsRepresentation(): Observable<unknown> {
  //   // Initialize state object selector
  //   let stateObjectRef: string;
  //   // Subscribe to structure emission
  //   return this.structure$.pipe(
  //     // Combine with interactions emission
  //     combineLatestWith(this.interactions$),
  //     // Wrap structure and interactions into an object
  //     map(([structure, interactions]) => ({ structure, interactions })),
  //     // TODO When coodeinates are not available, extract them frim indices
  //     map(({ structure, interactions }) => {
  //       // Define interactors
  //       const interactors = interactions.reduce((acc, { from, to }) => [...acc, from, to], [] as Interactor[]);
  //       // Loop through each atom in the structure
  //       Structure.eachAtomicHierarchyElement(structure, ({
  //         // Define function for each atom
  //         atom: (a) => {
  //           // Define coordinates vector
  //           const coordinates = Vec3.create(SP.atom.x(a), SP.atom.y(a), SP.atom.z(a));
  //           // Loop through each interactor
  //           for (const interactor of interactors) {
  //             // Do only if coordinates are not already set
  //             if (!interactor.coordinates) {
  //               // Case chain, residue and atom match
  //               if (interactor['atom.id'] === SP.atom.id(a)) {
  //                 // Update coordinates
  //                 interactor.coordinates = coordinates;
  //               }
  //               // Case residue matches
  //               else if (interactor['chain.id'] === SP.chain.auth_asym_id(a)) {
  //                 // Case residue identifier matches
  //                 if (interactor['residue.id'] === SP.residue.auth_seq_id(a) + SP.residue.pdbx_PDB_ins_code(a)) {
  //                   // Case atom name matches
  //                   if (interactor['atom.name'] === SP.atom.auth_atom_id(a)) {
  //                     // Update coordinates
  //                     interactor.coordinates = coordinates;
  //                   }
  //                 }
  //               }
  //             }
  //           }
  //         },
  //       }));
  //       // Filter out interactions whose interactors do not have coordinates
  //       interactions = interactions.filter(({ from, to }) => from.coordinates && to.coordinates);
  //       // Return both structure and filtered interactions
  //       return { structure, interactions };
  //     }),
  //     // Apply mesh representation
  //     switchMap(({ interactions }) => {
  //       // Define plugin instance
  //       const plugin = this.pluginService.plugin;
  //       // Initialize plugin update
  //       const update = plugin.state.data.build();
  //       // Cast interactions to data
  //       const data = interactions.map(({ from, to, color, label, size }) => ({
  //         // Extract coordinates from interactors
  //         from: from.coordinates,
  //         to: to.coordinates,
  //         // Cast string to Color
  //         color: fromHexString(color || this.settingsService.settings['interaction-color']).at(0),
  //         // Define size
  //         size: size || this.settingsService.settings['interaction-size'],
  //         // Define label, if any
  //         label,
  //       }));
  //       // Delete previous state object
  //       if (stateObjectRef) update.delete(stateObjectRef);
  //       // Apply representation
  //       const updated = update.toRoot()
  //         .apply(CreateMeshProvider, { data })
  //         .apply(StateTransforms.Representation.ShapeRepresentation3D);
  //       // Store state object reference
  //       stateObjectRef = updated.ref;
  //       // Cast promise to observable
  //       return from(update.commit({ doNotUpdateCurrent: true }));
  //     }),
  //     // Cache result
  //     shareReplay(1),
  //   );
  // }

}
