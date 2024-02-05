// prettier-ignore 
import {AfterViewInit, Component, ElementRef, HostListener, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { Observable, Subscription, tap, switchMap } from 'rxjs';
// Custom providers
import { Margin, InitializeService } from './services/initialize.service';
import { ResizeService } from './services/resize.service';
import { ZoomService } from './services/zoom.service';
import { DrawService } from './services/draw.service';
// Custom data types
import Continuous from './features/continuous';
import Loci from './features/loci';
import Pins from './features/pins';
import DSSP from './features/dssp';
// // D3 library
// import * as d3 from 'd3';

// TODO Define sequence type
type Sequence = Array<string>;

// Define type for allowed features
export type Features = Array<Continuous | Loci | Pins | DSSP>;

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ngx-features-viewer',
  standalone: true,
  imports: [],
  template: `<div style="position: relative; display: block; width: 100%; height: 100%;" #root></div>`,
  styleUrl: './ngx-features-viewer.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class NgxFeaturesViewerComponent implements AfterViewInit, OnChanges, OnDestroy {

  @ViewChild('root')
  public _root!: ElementRef;

  // Margins, clockwise [top, right, bottom, left]
  @Input()
  public set margin(margin: Margin) {
    // Just set inner margins
    this.initService.margin = margin;
  }

  public get margin() {
    return this.resizeService.margin;
  }

  public get height() {
    return this.resizeService.height;
  }

  public get width() {
    return this.resizeService.width;
  }

  public get axes() {
    return this.initService.axes;
  }

  public get grid() {
    return this.initService.grid;
  }

  // Return zoom behavior
  public get zoom() {
    return this.initService.zoom;
  }

  public get labels() {
    return this.drawService.labels;
  }

  @Input()
  public sequence!: Sequence;

  private readonly sequence$ = this.drawService.sequence$;

  @Input()
  public features!: Features;

  private readonly features$ = this.drawService.features$;

  private update$: Observable<unknown>;

  private _update: Subscription;

  constructor(
    // Dependency injection
    public initService: InitializeService,
    public resizeService: ResizeService,
    public zoomService: ZoomService,
    public drawService: DrawService,
  ) {
    // TODO Remove this
    this.margin = { top: 24, right: 24, bottom: 24, left: 128 };
    // TODO Update SVG according to inputs
    this.update$ = this.initService.initialized$.pipe(
      // Initialize callback on zoom event
      tap(() => {
        // Get zoom event handler
        this.zoom
          // Define zoom extent
          .scaleExtent([1, 100])
          // Define zoom callback
          .on('zoom', (event) => { this.onFeaturesZoom(event); })
      }),
      // TODO Initialize drawings
      switchMap(() => this.drawService.draw$),
      // Initialize callback on label click
      tap(() => {
        this.labels.on('click', (_, feature) => { this.onLabelClick(feature) })
      }),
      // Initialize zoom scale
      tap(() => {
        // Define number of residues in sequnce
        const n = this.sequence.length + 1;
        //
        // Apply scale limit to 5 residues
        this.zoom.scaleExtent([1, n / 5]);
      }),
      // Subscribe to resize event (set width, height)
      switchMap(() => this.resizeService.resized$),
      // // TODO Update pan extent according to boundaries graph boundaries
      // tap(() => {
      //   // Get current height, width and margins
      //   const margin = this.margin;
      //   const height = this.height;
      //   const width = this.width;
      //   // Get top-left point
      //   const tl: [number, number] = [0, 0];
      //   // Get bottom-right point
      //   const br: [number, number] = [width, height];
      //   // Apply limitations on pan
      //   this.zoom.translateExtent([tl, br]);
      // }),
      // Subscribe to zoom event
      switchMap(() => this.zoomService.zoomed$),
      // Finally, update representation
      switchMap(() => this.drawService.drawn$),
    );
    // Subscribe to update emission
    this._update = this.update$.subscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Case input sequence changed
    if (changes && changes['sequence']) {
      // Emit sequence
      this.sequence$.next(this.sequence);
    }
    // Case input features changed
    if (changes && changes['features']) {
      // Initialize input features
      this.features.forEach((feature) => {
        // Set feature as active
        feature.active = feature.active === undefined ? true : feature.active;
      });
      // Emit new features
      this.features$.next(this.features);
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

  onLabelClick(_feature: { id?: number }) {
    // // Get label element
    // const label = event.target as HTMLDivElement;
    // Toggle active flag on current feature
    const feature = this.features[_feature.id!];
    // Invert current active sign
    feature.active = !feature.active;
    // Emit updated features
    this.features$.next([...this.features]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFeaturesZoom(event: any) {
    // Emit zoom event
    this.zoomService.zoom$.next(event);
  }
}
