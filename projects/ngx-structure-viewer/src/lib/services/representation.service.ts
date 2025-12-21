import { Injectable, OnDestroy } from '@angular/core';
import { Structure } from 'molstar/lib/mol-model/structure';
import { StaticStructureComponentType } from 'molstar/lib/mol-plugin-state/helpers/structure-component';
import {
  StructureRepresentationBuiltInProps,
} from 'molstar/lib/mol-plugin-state/helpers/structure-representation-params';
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
    const representationLoci = Molstar.getLocusFromSet(residueIds, this.structureService.structure, this.settingsService.settings.prefer_label_asym_id);
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
    await plugin.builders.structure.representation.addRepresentation(component!, <StructureRepresentationBuiltInProps>{
      type : this.settingsService.settings['representation-type'],
      color : 'uniform',
    });

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
}
