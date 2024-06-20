import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {Observable, Subscription, switchMap, tap} from 'rxjs';
import {CommonModule} from '@angular/common';
// Custom components
import {NgxFeaturesViewerLabelDirective} from './ngx-features-viewer.directive';
// Custom providers
import {InitializeService} from './services/initialize.service';
import {FeaturesService} from './services/features.service';
import {ResizeService} from './services/resize.service';
import {ZoomService} from './services/zoom.service';
import {DrawService} from './services/draw.service';
// Custom data types
import {Hierarchy} from './hierarchy';
import {Settings} from './settings';


// TODO Define sequence type
export type Sequence = Array<string>;

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ngx-features-viewer',
  standalone: true,
  imports: [
    NgxFeaturesViewerLabelDirective,
    CommonModule,
  ],
  providers: [
    InitializeService,
    FeaturesService,
    ResizeService,
    DrawService,
    ZoomService,
  ],
  templateUrl: './ngx-features-viewer.component.html',
  styleUrl: './ngx-features-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NgxFeaturesViewerComponent implements AfterViewInit, AfterContentInit, OnChanges, OnDestroy {

  @ViewChild('root')
  public _root!: ElementRef;

  @ContentChildren(NgxFeaturesViewerLabelDirective)
  public labels?: QueryList<NgxFeaturesViewerLabelDirective>;

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
    const traces = Array.from(this.featuresService.traces.values());
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
      // Subscribe to resize event (set width, height)
      switchMap(() => this.resizeService.resized$),
      // Initialize zoom scale
      tap(() => {
        // const { width, height } = this.resizeService;
        const {left: ms, right: me, bottom: mb} = this.resizeService.margin;
        const h = this.resizeService.height;
        const w = this.resizeService.width;
        // // Define number of residues in sequnce
        const n = this.sequence.length + 1;
        // Apply scale limit to 5 residues
        this.initService.zoom
          .translateExtent([[ms, 0], [w - me, h - mb]])
          .scaleExtent([1, n / 5])
          .extent([[ms, 0], [w - me, h - mb]])
          .on('zoom', (event) => {
            // // Modify the event.transform in place
            // event.transform.y = 0;
            // // Case k or x values are finite
            // if (isFinite(event.transform.k) && isFinite(event.transform.x)) {
            //   // Emit transformation to update visualization
            //   this.zoomService.zoom$.next(event);
            // }
            // Emit transformation to update visualization
            this.zoomService.zoom$.next(event);
            // // TODO Remove console.log
            // console.log('event.transform', event.transform);
          });
      }),
      // Subscribe to zoom event
      switchMap(() => this.zoomService.zoomed$),
      // Finally, update representation
      switchMap(() => this.drawService.drawn$),
    );
    // Subscribe to update emission
    this._update = this.update$.subscribe();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    // Case input sequence changes
    if (changes && changes['sequence']) {
      // Emit sequence
      this.sequence$.next(this.sequence);
    }
  }

  public ngAfterContentInit(): void {
    // Case label templates are defined
    if (this.labels) {
      // Loop through each label template
      this.labels.forEach((label) => {
        // Case both labels are defined, then throw error
        if (this.initService.labelLeft && this.initService.labelRight) {
          throw new Error('Only one label can be defined');
        }
        // Case label is left
        if (label.where === 'left') {
          this.initService.labelLeft = label;
        }
        // Case label is right
        if (label.where === 'right') {
          this.initService.labelRight = label;
        }
      });
    }
  }

  public ngAfterViewInit(): void {
    // Emit root element
    this.initService.initialize$.next(this._root);
  }

  public ngOnDestroy(): void {
    // Unsubscribe from update emission
    this._update.unsubscribe();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    // Just emit width of container element
    this.resizeService.resize$.next(event);
  }

  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // onFeaturesZoom(event: any) {
  //   // Emit zoom event
  //   this.zoomService.zoom$.next(event);
  // }
}
