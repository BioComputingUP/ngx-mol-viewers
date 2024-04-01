import { Observable, ReplaySubject, combineLatest, from, map, shareReplay, switchMap, tap } from 'rxjs';
import { Structure, StructureProperties } from 'molstar/lib/mol-model/structure';
import { Asset } from 'molstar/lib/mol-util/assets';
import { Injectable } from '@angular/core';
// Custom services
import { SettingsService } from './settings.service';
import { PluginService } from './plugin.service';
import { Source } from '../interfaces/source';
import { fromHexString } from '../colors';


@Injectable({ providedIn: 'platform' })
export class StructureService {

  readonly structure$: Observable<Structure>;

  readonly source$ = new ReplaySubject<Source>;

  set source(source: Source) {
    this.source$.next(source);
  }

  public r2i!: Map<string, number>;

  public i2r!: Map<number, string>;

  constructor(
    public settingsService: SettingsService,
    public pluginService: PluginService,
  ) {
    const plugin$ = this.pluginService.plugin$;
    const source$ = this.source$;
    // Combine all observables into a single one
    this.structure$ = combineLatest([plugin$, source$]).pipe(
      // Wrap source and plugin into an object
      map(([plugin, source]) => ({ plugin, source })),
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
        const model = await plugin.builders.structure.createModel(trajectory);
        // Create structure
        const name = 'model';
        const params = {}; 
        const structure = await plugin.builders.structure.createStructure(model, { name, params });
        // Create component for the whole structure
        const component = await plugin.builders.structure.tryCreateComponentStatic(structure, 'polymer', { label: source.label });
        // Define color
        const [ value ] = fromHexString(this.settingsService.settings['backbone-color']);
        // Initialize white representation
        await plugin.builders.structure.representation.addRepresentation(component!, {
          type: 'cartoon',
          color: 'uniform',
          colorParams: { value },
        });
        // Return structure data
        return structure.cell?.obj?.data as Structure;
      })())),
      // Get residues data out of structure
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
