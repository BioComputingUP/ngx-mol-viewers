import { ElementRef, Injectable } from '@angular/core';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { PluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';
import { combineLatest, from, Observable, ReplaySubject, shareReplay, switchMap } from 'rxjs';
import { MolstarService } from './molstar.service';

@Injectable()
export class PluginService {

  // Define default specs
  protected spec: Partial<PluginUISpec> = {
    canvas3d : {
      // Make background transparent
      transparentBackground : true,
    },
    config : [
      [PluginConfig.Viewport.ShowExpand, false],
      [PluginConfig.Viewport.ShowControls, false],
      [PluginConfig.Viewport.ShowSelectionMode, false],
      [PluginConfig.Viewport.ShowAnimation, true],
    ],
  }

  // Define 
  readonly container$ = new ReplaySubject<ElementRef>(1);

  // NOTE This must be emitted after initialization, as it requires the container div
  readonly plugin$: Observable<PluginUIContext>;

  protected _plugin!: PluginUIContext;

  public get plugin(): PluginUIContext {
    return this._plugin;
  }

  constructor(
    public molstarService: MolstarService,
  ) {
    const {molstar$} = this.molstarService;
    // Emit plugin after initialization
    this.plugin$ = combineLatest([this.container$, molstar$]).pipe(
      // Initialize plugin
      switchMap(([elementRef]) => from(this.initPlugin(elementRef))),
      // Cache result
      shareReplay(1),
    );
  }

  public async initPlugin(elementRef: ElementRef): Promise<PluginUIContext> {
    // Load MolStar asynchronously
    const {createPluginUI, renderReact18, DefaultPluginUISpec} = this.molstarService.molstar;
    // Define plugin initial settings
    const spec = {...this.spec, ...DefaultPluginUISpec()};
    // Create plugin instance
    return this._plugin = await createPluginUI({
      // Define container div
      target : elementRef.nativeElement as HTMLDivElement,
      // Define rendered 
      render : renderReact18,
      // Define plugin specs
      spec,
    });
  }

}
