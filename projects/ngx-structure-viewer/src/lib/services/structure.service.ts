import { BehaviorSubject, Observable, filter, from, map, shareReplay, switchMap, tap } from 'rxjs';
import { Structure, StructureProperties } from 'molstar/lib/mol-model/structure';
// import { StateObjectRef } from 'molstar/lib/mol-state';
import { Asset } from 'molstar/lib/mol-util/assets';
import { Injectable } from '@angular/core';
// Custom services
// import { SettingsService } from './settings.service';
import { PluginService } from './plugin.service';
import { Residue, threeToOne } from '../interfaces/residue';
import { Source } from '../interfaces/source';

@Injectable()
export class StructureService {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly structure$: Observable<any>;

  readonly source$ = new BehaviorSubject<Source | null>(null);

  set source(source: Source) {
    this.source$.next(source);
  }

  public r2i!: Map<string, number>;

  public i2r!: Map<number, string>;

  public residues!: Array<Residue>;

  constructor(
    // public settingsService: SettingsService,
    public pluginService: PluginService,
  ) {
    // Combine all observables into a single one
    this.structure$ = this.pluginService.plugin$.pipe(
      // Combine with source emission
      switchMap((plugin) => {
        // Combine with source emission
        return this.source$.pipe(
          // Filter out null values
          filter((source): source is Source => source != null),
          // Emit both plugin and source
          map((source: Source) => ({ plugin, source })),
        );
      }),
      // Parse source data
      switchMap(({ source }) => from((async () => {
        // Case source is local
        if (source.type === 'local') {
          // Parse local source
          const data = await this.parseLocalSource(source);
          // Return data
          return { data, source };
        }
        // Otherwise, source is remote
        const data = await this.parseRemoteSource(source);
        // Return data
        return { data, source };
      })())),
      // Generate trajectory
      switchMap(({ data, source }) => from((async () => {
        // Define plugin instance
        const plugin = this.pluginService.plugin;
        // Parse trajectory
        const trajectory = await plugin.builders.structure.parseTrajectory(data, source.format);
        // Create model
        const model = await plugin.builders.structure.createModel(trajectory, { modelIndex: 0 });
        // TODO Create structure
        return plugin.builders.structure.createStructure(model, { name: 'model', params: {} });
        // // Create component for the whole structure
        // const component = await plugin.builders.structure.tryCreateComponentStatic(structure, 'polymer', { label: source.label });
        // // Define color
        // const [ value ] = fromHexString(this.settingsService.settings['backbone-color']);
        // // Initialize white representation
        // await plugin.builders.structure.representation.addRepresentation(component!, {
        //   type: 'cartoon',
        //   color: 'uniform',
        //   colorParams: { value },
        // });
      })())),
      // Get residues data out of structure
      tap((structure) => {
        // Initialize index
        let index = 0;
        // Initialize residues array
        this.residues = [];
        // Initialize map between residue (sequence number, insertion code) to numeric index
        const r2i = this.r2i = new Map();
        const i2r = this.i2r = new Map();
        // Loop through each residue
        Structure.eachAtomicHierarchyElement(structure.cell?.obj?.data as Structure, ({
          // Do nothing on residue loop
          residue: (r) => {
            // Define residue index
            const authSeqId = StructureProperties.residue.auth_seq_id(r);
            // Get insertion code
            const pdbInsCode = StructureProperties.residue.pdbx_PDB_ins_code(r);
            // Define residue name
            const authAsymId = StructureProperties.chain.auth_asym_id(r);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const authCompId = StructureProperties.atom.auth_comp_id(r);
            // Define residue unique identifier
            const identifier = (authAsymId + authSeqId + pdbInsCode).trim();
            // Map residue id to its index
            r2i.set(identifier, index);
            i2r.set(index, identifier);
            // Store residue information in the residues array
            this.residues.push({ 
              pdbInsCode, 
              authSeqId, 
              authAsymId,
              authCompId3: threeToOne.has(authCompId) ? authCompId : 'XXX', 
              authCompId1: threeToOne.get(authCompId) || 'X',
            });
            // Update index
            index++;
          },
        }));
      }),
      // Cache results
      shareReplay(1),
    );
  }

  protected async parseRemoteSource(source: Source & { type: 'remote' }) {
    const url = Asset.Url(source.link);
    const label = source.label;
    const binary = source.binary;
    // Define plugin instance
    const plugin = this.pluginService.plugin;
    // Retrieve remote data
    return plugin.builders.data.download({ url, label, isBinary: binary });
  }

  protected async parseLocalSource(source: Source & { type: 'local' }) {
    // Define source label
    const binary = source.binary;
    const label = source.label;
    // Define plugin instance
    const plugin = this.pluginService.plugin;
    // Case source data is string, no need to read data as file
    if (typeof source.data === 'string') {
      // Read file from string
      return plugin.builders.data.rawData({ data: source.data, label });
    }
    // Wrap blob into file
    let file: Asset.File;
    // Case source data is file
    if (source.data instanceof File) {
      // File is already available
      file = Asset.File(source.data);
    }
    // Othwerwise, data must be read as file
    else {
      // Get file name
      const ext = source.format === 'mmcif' ? 'cif' : 'ent';
      const name = `${label}.${ext}`;
      // Generate file
      file = Asset.File(new File([source.data], name));
    }
    // Return data read from file
    const { data } = await plugin.builders.data.readFile({ file, label, isBinary: binary });
    // Return retrieved data
    return data;
  }

}
