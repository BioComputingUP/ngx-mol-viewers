import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import {
  Observable,
  ReplaySubject,
  Subscription,
  combineLatestWith,
  from,
  map,
  of,
  shareReplay,
  switchMap,
} from 'rxjs';
import { DefaultPluginSpec, PluginSpec } from 'molstar/lib/mol-plugin/spec';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { Structure } from 'molstar/lib/mol-model/structure';
import { Asset } from 'molstar/lib/mol-util/assets';

// Define source data
export interface Source {
  // Source data, whether URL or Blob
  data: string | Blob | File;
  // Define structure label
  label?: string;
  // Flag whether source structure is compressed or not
  compressed?: boolean;
  // Format for source structure data
  format?: 'mmcif' | 'pdb';
}

// Define single locus type
export interface Locus<T = string> {
  // Start, end position
  start: T;
  end: T;
  // Given chain
  chain: string;
  // Define color
  color: string;
}

// Define multiple loci type
export type Loci<T = string> = Array<Locus<T>>;

// Define single contact between loci
export type Contact<T = string> = Omit<
  Locus<{ position: T; chain: string }>,
  'chain'
>;

// Define multiple contacts between loci
export type Contacts<T = string> = Array<Contact<T>>;

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ngx-structure-viewer',
  standalone: true,
  imports: [],
  template: `
    <div style="position: relative" #parent>
      <canvas
        style="position: absolute; left: 0; top: 0; width: 100%; height: 100%;"
        #canvas
      ></canvas>
    </div>
  `,
  styles: ``,
})
export class NgxStructureViewerComponent implements AfterViewInit, OnDestroy {
  // Define plugin emitter
  protected parent$ = new ReplaySubject<HTMLElement>(1);

  // Define plugin container
  @ViewChild('parent')
  public _parent!: ElementRef;

  // Define plugin canvas
  @ViewChild('canvas')
  public _canvas!: ElementRef;

  // Define plugin initialization pipeline
  protected plugin$: Observable<PluginContext>;

  // Define structure change trigger
  protected source$ = new ReplaySubject<Source>(1);

  // On input chnage, set source
  @Input() set source(source: Source) {
    this.source$.next(source);
  }

  // Define structure generation pipeline
  protected structure$: Observable<Structure>;

  // Define observable for loci (and colors)
  protected loci$ = new ReplaySubject<Loci>(1);

  // Handle loci emission on change
  @Input() set loci(loci: Loci) {
    this.loci$.next(loci);
  }

  // Define observable for contacts
  protected contacts$ = new ReplaySubject<Contacts>(1);

  // Handle contacts emission on change
  @Input() set contacts(contacts: Contacts) {
    this.contacts$.next(contacts);
  }

  // Define update pipeline
  protected update$: Observable<void>;

  // Define update subscription
  protected _update: Subscription;

  // Define output selection
  @Output() selected = new EventEmitter<Omit<Loci, 'color'>[]>();

  // Define output highlights
  @Output() highlighted = new EventEmitter<Omit<Loci, 'color'>[]>();

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

  // Define observable for plugin initialization
  protected initPlugin(): Observable<PluginContext> {
    // Define default plugin specifications
    const settings: PluginSpec = {
      // Unpack default configuration
      ...DefaultPluginSpec(),
      // config: [[PluginConfig.VolumeStreaming.Enabled, false]],
    };
    // Subscribe to parent HTML element initialization first
    return this.parent$.pipe(
      // Get both parent and canvas HTML elements
      map(() => ({
        // Cast elements to correct
        parent: this._parent.nativeElement as HTMLDivElement,
        canvas: this._canvas.nativeElement as HTMLCanvasElement,
      })),
      // prettier-ignore
      switchMap(({ parent, canvas }) => from((async () => {
        // Initialize plugin context
        const plugin = new PluginContext(settings);
        await plugin.init();
        // Try rendering plugin
        if(!plugin.initViewer(canvas, parent)) {
          // Eventually, emit error
          throw new Error('Could not render the Mol* plugin');
        }
        // Return initialized plugin
        return plugin;
      })())),
      // Cache result, since this might mìbe subscripted multiple times
      // and we do not want the plugin to be re-initialized each time
      shareReplay(1)
    );
    // // Define current plugin
    // return from(
    //   (async () => {
    //     // Create plugin
    //     const plugin: PluginContext = await createPluginAsync(parent, settings);
    //     // Initialize data
    //     let data: any;
    //     // Case input URL is defined
    //     if (this.url) {
    //       // Fetch data from remote url
    //       data = await plugin.builders.data.download(
    //         { url: this.url },
    //         { state: { isGhost: true } }
    //       );
    //     }
    //     // Case input Blob is defined
    //     else if (this.blob) {
    //       // Generate file out of blob
    //       const file = new File([this.blob], 'structure.cif');
    //       // Parse data out of file
    //       data = await plugin.builders.data.readFile({
    //         file: file as any,
    //         label: 'structure',
    //         isBinary: this.compressed,
    //       });
    //     }
    //     // Otherwise
    //     else {
    //       // Throw error
    //       throw new Error('Neither input URL nor Blob data has been defined');
    //     }
    //     // TODO Build trajectory out of given data
    //     const trajectory = await plugin.builders.structure.parseTrajectory(
    //       data,
    //       this.format
    //     );
    //     // TODO Represent structure
    //     await plugin.builders.structure.hierarchy.applyPreset(
    //       trajectory,
    //       'default'
    //     );
    //     // Return generated plugin
    //     return plugin;
    //   })()
    // );
  }

  // Define observable for structure initialization
  protected initStructure() {
    // First, subscribe to plugin initialization
    return this.plugin$.pipe(
      // Then, subscribe to changes in source
      combineLatestWith(this.source$),
      // prettier-ignore
      switchMap(([plugin, source]) => from((async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: any;
        // Define label
        const label = source.label || 'structure';
        // Define format
        const format = source.format || 'mmcif';
        // Check whether is binary
        const isBinary = source.compressed === true;
        // Case data is string, then treat it as URL
        if (typeof source.data === 'string') {
          // Get source URL
          const url = Asset.Url(source.data);
          // Then, fetch data remotely
          data = await plugin.builders.data.download({ url, label, isBinary });
        }
        // Otherwise, data is blob or file
        else {
          // Wrap blob into file
          const file = Asset.File(source.data instanceof Blob ? new File([source.data], `${label}.${format}`) : source.data);
          // Then, load data locally
          data = await plugin.builders.data.readFile({ file, label, isBinary });
        }
        // TODO Build trajectory out of given data
        const trajectory = await plugin.builders.structure.parseTrajectory( data, format);
        // TODO Represent structure
        await plugin.builders.structure.hierarchy.applyPreset(
          trajectory,
          'default'
        );
        // prettier-ignore
        return plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data as Structure;
      })()))
    );
  }

  // TODO Define observable for updating representation
  protected updateRepresentation() {
    return of(void 0);
  }

  public ngAfterViewInit(): void {
    // Get parent element
    const parent = this._parent.nativeElement;
    // Emit parent element
    this.parent$.next(parent);
  }

  public ngOnDestroy(): void {
    // Unsubscribe
    this._update.unsubscribe();
  }
}
