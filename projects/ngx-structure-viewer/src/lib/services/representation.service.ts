import { Observable, ReplaySubject, Subscription, combineLatestWith, filter, from, map, shareReplay, switchMap, withLatestFrom } from 'rxjs';
import { Structure } from 'molstar/lib/mol-model/structure';
import { Injectable, OnDestroy } from '@angular/core';
// Molstar dependencies
// import { Structure, StructureElement, StructureProperties as SP, StructureSelection } from 'molstar/lib/mol-model/structure';
// import { Structure, StructureElement } from 'molstar/lib/mol-model/structure';
// import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms';
// import { Overpaint } from 'molstar/lib/mol-theme/overpaint';
// import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';
// Custom dependencies
// import { Interaction, Interactor } from '../interfaces/interaction';
import { Interaction } from '../interfaces/interaction';
// import { CreateMeshProvider } from './interactions.provider';
import { StructureService } from './structure.service';
import { SettingsService } from './settings.service';
import { MolstarService } from './molstar.service';
import { PluginService } from './plugin.service';
import { Source } from '../interfaces/source';
import { Locus } from '../interfaces/locus';
import { fromHexString } from '../colors';
import { Overpaint } from 'molstar/lib/mol-theme/overpaint';

@Injectable()
export class RepresentationService implements OnDestroy {

  readonly loci$ = new ReplaySubject<Locus[]>(1);

  public set loci(loci: Locus[]) {
    this.loci$.next(loci);
  }

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
      switchMap(([structure, source]) => from((async () => {
        // Define reference for current plugin
        const plugin = this.pluginService.plugin;
        // Create component for the whole structure
        const component = await plugin.builders.structure.tryCreateComponentStatic(structure as never, 'protein', { label: source.label });
        // Initialize representation
        await plugin.builders.structure.representation.addRepresentation(component!, { type: 'backbone', color: 'uniform' });
      })())),
      // Cache result
      shareReplay(1),
    );
    // Apply settings to represenatation
    this.representation$ = component$.pipe(
      // Combine with settings emission
      combineLatestWith(this.settingsService.settings$),
      // Get emitted structure
      withLatestFrom(this.structureService.structure$),
      // Apply given color to backbone
      switchMap(([[, settings], structure]) => from(this.applyBackboneColor(structure as Structure, settings['backbone-color']))),
      // TODO Remove this
      map(() => void 0),
      // // Apply settings to both background and representation
      // switchMap(([, settings]) => from((async () => {
      //   // Get plugin instance
      //   const plugin = this.pluginService.plugin;
      //   // Get background color
      //   const [ color, alpha ] = fromHexString(settings['background-color']);
      //   // // Update plugin settings
      //   // plugin.canvas3d?.setProps({
      //   //   // Set background color
      //   //   renderer: { backgroundColor: color },
      //   //   // Set background opacity
      //   //   transparentBackground: alpha === 1,
      //   // });
      // })())),
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

  // TODO
  protected async applyBackboneColor(structure: Structure, backboneColor: string): Promise<void> {
    // Initialize color layers
    const bundleLayers: Overpaint.BundleLayer[] = [];
    // Define all residue identifiers
    const residueIdentifiers = Array.from(this.structureService.i2r.values());
    // Get locus from residue identifiers
    const representationLoci = this.molstarService.molstar.getLocusFromSet(residueIdentifiers, structure);
    // Define current Mol* bundle
    const bundleLayer = this.molstarService.molstar.getBundleFromLoci(representationLoci);  // StructureElement.Bundle.fromLoci(locus);
    // Cast color to Mol* color
    const [representationColor] = fromHexString(backboneColor);
    // Define and store current layer
    bundleLayers.push({ bundle: bundleLayer, color: representationColor, clear: true });
    // Define plugin instance
    const { plugin } = this.pluginService;
    // Initialize plugin update
    const update = plugin.state.data.build();
    // Filter bundle of layers
    const filteredBundle = this.molstarService.molstar.getFilteredBundle(bundleLayers, structure);
    // Loop through structures in plugin
    for (const structureRef of plugin.managers.structure.hierarchy.current.structures) {
      // Loop through components in current structure
      for (const componentRef of structureRef.components) {
        // Loop through each representation in current component
        for (const representationRef of componentRef.representations) {
          const { OverpaintStructureRepresentation3DFromBundle, overpaintToBundle } = this.molstarService.molstar;
          // Apply update on current representation
          update.to(representationRef.cell.transform.ref).apply(
            OverpaintStructureRepresentation3DFromBundle,
            overpaintToBundle(filteredBundle as never)
          );
        }
      }
    }
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
