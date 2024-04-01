import { Observable, ReplaySubject, Subscription, combineLatestWith, from, map, shareReplay, switchMap } from 'rxjs';
import { Injectable, OnDestroy } from '@angular/core';
// Molstar dependencies
import { Structure, StructureElement, StructureProperties as SP, StructureSelection } from 'molstar/lib/mol-model/structure';
import { MolScriptBuilder as MS } from "molstar/lib/mol-script/language/builder";
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms';
import { Expression } from 'molstar/lib/mol-script/language/expression';
import { Overpaint } from 'molstar/lib/mol-theme/overpaint';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';
import { Script } from 'molstar/lib/mol-script/script';
// Custom dependencies
import { StructureService } from '../structure.service';
import { SettingsService } from '../settings.service';
import { PluginService } from '../plugin.service';
import { Interaction, Interactor } from '../../interfaces/interaction';
import { Locus } from '../../interfaces/locus';
import { fromHexString } from '../../colors';
import { CreateMeshProvider } from './interactions.provider';


function getLocusFromQuery(query: Expression, structure: Structure): StructureElement.Loci {
  // Execute query, retrieve selection
  const selection: StructureSelection = Script.getStructureSelection(query, structure);
  // Cast selection to loci
  return StructureSelection.toLociWithSourceUnits(selection);
}

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

@Injectable({ providedIn: 'platform' })
export class RepresentationService implements OnDestroy {

  readonly loci$ = new ReplaySubject<Locus[]>(1);

  set loci(loci: Locus[]) {
    this.loci$.next(loci);
  }

  readonly interactions$ = new ReplaySubject<Interaction[]>(1);

  set interactions(interactions: Interaction[]) {
    this.interactions$.next(interactions);
  }

  protected representation$: Observable<void>;

  protected _representation: Subscription;

  constructor(
    public structureService: StructureService,
    public settingsService: SettingsService,
    public pluginService: PluginService,
  ) {
    // Define loci representation pipeline
    const loci$ = this.getLociRepresentation();
    // Define interactions representation pipeline
    const interactions$ = this.getInteractionsRepresentation();
    // Combine structure emission
    this.representation$ = this.structureService.structure$.pipe(
      // With loci representation pipeline
      combineLatestWith(loci$),
      // And interactions representation pipeline
      combineLatestWith(interactions$),
      // Return void
      map(() => void 0),
      // Cache result
      shareReplay(1),
    );
    // Subscribe to representation pipeline
    this._representation = this.representation$.subscribe();
  }

  public ngOnDestroy(): void {
    // Remove subscription
    this._representation.unsubscribe();
  }

  protected getLociRepresentation(): Observable<unknown> {
    // Subscribe to structure emission
    return this.structureService.structure$.pipe(
      // Combine with loci emission
      combineLatestWith(this.loci$),
      // Wrap structure and loci into an object
      map(([structure, loci]) => ({ structure, loci })),
      // Map numeric locis to set of residue identifiers
      map(({ structure, loci: prev }) => {
        // Get residue identifiers
        const ids = [...this.structureService.i2r.values()];
        // Initialize loci as list of residue ranges
        const curr = prev.map((p) => {
          // Case start psoition is defined, then initialize end position
          if (p.start) {
            // Initialize end position
            p = { ...p, end: p.end || p.start };
            // Get numeric start index
            const start = this.structureService.r2i.get(p.chain + p.start)!;
            const end = this.structureService.r2i.get(p.chain + p.end)!;
            // Add residue identifier to current locus
            return { ...p, ids: ids.slice(start, end + 1) }
          }
          // Otherwise, filter residues by chain
          else {
            // Get list of identifiers whose value starts with given chain
            return { ...p, ids: ids.filter((id) => id.startsWith(p.chain)) };
          }
        });
        // Return updated loci, as well as structure (data) and plugin
        return { structure, loci: curr };
      }),
      // Apply colors
      switchMap(({ structure, loci }) => {
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
          const [color] = fromHexString(hex || this.settingsService.settings['backbone-color']);
          // Define and store current layer
          layers.push({ bundle, color, clear: false });
        }
        // Define plugin instance
        const plugin = this.pluginService.plugin;
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
                  Overpaint.toBundle(bundle as never)
                );
              // TODO Define locus for all residues
              const _locus = getLocusFromSet([...this.structureService.i2r.values()], structure);
              const _bundle = StructureElement.Bundle.fromLoci(_locus);
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const [_color, alpha] = fromHexString(this.settingsService.settings['backbone-color']);
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
    );
  }

  protected getInteractionsRepresentation(): Observable<unknown> {
    // Initialize state object selector
    let stateObjectRef: string;
    // Subscribe to structure emission
    return this.structureService.structure$.pipe(
      // Combine with interactions emission
      combineLatestWith(this.interactions$),
      // Wrap structure and interactions into an object
      map(([structure, interactions]) => ({ structure, interactions })),
      // TODO When coodeinates are not available, extract them frim indices
      map(({ structure, interactions }) => {
        // Define interactors
        const interactors = interactions.reduce((acc, { from, to }) => [...acc, from, to], [] as Interactor[]);
        // Loop through each atom in the structure
        Structure.eachAtomicHierarchyElement(structure, ({
          // Define function for each atom
          atom: (a) => {
            // Define coordinates vector
            const coordinates = Vec3.create(SP.atom.x(a), SP.atom.y(a), SP.atom.z(a));
            // Loop through each interactor
            for (const interactor of interactors) {
              // Do only if coordinates are not already set
              if (!interactor.coordinates) {
                // Case chain, residue and atom match
                if (interactor['atom.id'] === SP.atom.id(a)) {
                  // Update coordinates
                  interactor.coordinates = coordinates;
                }
                // Case residue matches
                else if (interactor['chain.id'] === SP.chain.auth_asym_id(a)) {
                  // Case residue identifier matches
                  if (interactor['residue.id'] === SP.residue.auth_seq_id(a) + SP.residue.pdbx_PDB_ins_code(a)) {
                    // Case atom name matches
                    if (interactor['atom.name'] === SP.atom.auth_atom_id(a)) {
                      // Update coordinates
                      interactor.coordinates = coordinates;
                    }
                  }
                }
              }
            }
          },
        }));
        // Filter out interactions whose interactors do not have coordinates
        interactions = interactions.filter(({ from, to }) => from.coordinates && to.coordinates);
        // Return both structure and filtered interactions
        return { structure, interactions };
      }),
      // Apply mesh representation
      switchMap(({ interactions }) => {
        // Define plugin instance
        const plugin = this.pluginService.plugin;
        // Initialize plugin update
        const update = plugin.state.data.build();
        // Cast interactions to data
        const data = interactions.map(({ from, to, color, label, size }) => ({
          // Extract coordinates from interactors
          from: from.coordinates,
          to: to.coordinates,
          // Cast string to Color
          color: fromHexString(color || this.settingsService.settings['interaction-color']).at(0),
          // Define size
          size: size || this.settingsService.settings['interaction-size'],
          // Define label, if any
          label,
        }));
        // Delete previous state object
        if (stateObjectRef) update.delete(stateObjectRef);
        // Apply representation
        const updated = update.toRoot()
          .apply(CreateMeshProvider, { data })
          .apply(StateTransforms.Representation.ShapeRepresentation3D);
        // Store state object reference
        stateObjectRef = updated.ref;
        // Cast promise to observable
        return from(update.commit({ doNotUpdateCurrent: true }));
      }),
      // Cache result
      shareReplay(1),
    );
  }

}
