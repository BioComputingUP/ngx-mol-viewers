// prettier-ignore 
import { AfterViewInit, Component, ElementRef, HostListener, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { Observable, Subscription, tap, switchMap } from 'rxjs';
// Custom providers
import { InitializeService } from './services/initialize.service';
import { FeaturesService } from './services/features.service';
import { ResizeService } from './services/resize.service';
import { ZoomService } from './services/zoom.service';
import { DrawService } from './services/draw.service';
// Custom data types
import { Hierarchy } from './hierarchy';
import { Settings } from './settings';

// TODO Define sequence type
export type Sequence = Array<string>;

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ngx-features-viewer',
  standalone: true,
  imports: [],
  providers: [
    InitializeService,
    FeaturesService,
    ResizeService,
    DrawService,
    ZoomService,
  ],
  template: `<div style="position: relative; display: block; width: 100%; height: 100%;" #root></div>`,
  styleUrl: './ngx-features-viewer.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class NgxFeaturesViewerComponent implements AfterViewInit, OnChanges, OnDestroy {

  @ViewChild('root')
  public _root!: ElementRef;

  @Input()
  public set settings(settings: Settings) {
    // TODO Update settings in initialization service
    this.initService.settings = settings;
  }

  @Input()
  public set features(hierarchy: Hierarchy) {
    // Initialize hierarchy
    this.featuresService.hierarchy = hierarchy;
    // Get traces
    const traces = Array
      // Get index, trace 
      .from(this.featuresService.traces.entries())
      // Cast to traces
      .map(([i, trace]) => Object.assign(trace, { id: i, visible: true }));
    // Emit traces
    this.traces$.next(traces);
  }

  private readonly traces$ = this.drawService.traces$;

  @Input()
  public sequence!: Sequence;

  private readonly sequence$ = this.drawService.sequence$;

  private update$: Observable<unknown>;

  private _update: Subscription;

  constructor(
    // Dependency injection
    public featuresService: FeaturesService,
    public initService: InitializeService,
    public resizeService: ResizeService,
    public zoomService: ZoomService,
    public drawService: DrawService,
  ) {
    // TODO Update SVG according to inputs
    this.update$ = this.initService.initialized$.pipe(
      // TODO Initialize drawings
      switchMap(() => this.drawService.draw$),
      // // Initialize callback on label click
      // tap(() => {
      //   this.drawService.labels.on('click', (_, feature) => {
      //     this.onLabelClick(feature);
      //   })
      // }),
      // Subscribe to resize event (set width, height)
      switchMap(() => this.resizeService.resized$),
      // Initialize zoom scale
      tap(() => {
        // Get current width
        const { margin, width } = this.resizeService;
        // Define number of residues in sequnce
        const n = this.sequence.length + 1;
        // Apply scale limit to 5 residues
        this.initService.zoom
          .extent([[margin.left, 0], [width - margin.right, Infinity]])
          .scaleExtent([1, n / 5])
          .translateExtent([[margin.left, 0], [width - margin.right, 0]])
          .on('zoom', (event) => {
            // // TODO remove this
            // console.log('Zoom event handler', this.zoom);
            // Call zoom features on update
            this.onFeaturesZoom(event);
          })
      }),
      // Subscribe to zoom event
      switchMap(() => this.zoomService.zoomed$),
      // Finally, update representation
      switchMap(() => this.drawService.drawn$),
    );
    // Subscribe to update emission
    this._update = this.update$.subscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Case input sequence changes
    if (changes && changes['sequence']) {
      // Emit sequence
      this.sequence$.next(this.sequence);
    }
  }

  ngAfterViewInit(): void {
    // Emit root element
    this.initService.initialize$.next(this._root);
  }

  ngOnDestroy(): void {
    // Unsubscribe from update emission
    this._update.unsubscribe();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    // Just emit width of container element
    this.resizeService.resize$.next(event);
  }

  // onLabelClick(_feature: { id?: number }) {
  //   // // Get label element
  //   // const label = event.target as HTMLDivElement;
  //   // Toggle active flag on current feature
  //   const feature = this.features[_feature.id!];
  //   // Invert current active sign
  //   feature.active = !feature.active;
  //   // Emit updated features
  //   this.features$.next([...this.features]);
  // }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFeaturesZoom(event: any) {
    // Emit zoom event
    this.zoomService.zoom$.next(event);
  }
}
