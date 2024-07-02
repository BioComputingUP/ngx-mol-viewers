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
import {Settings} from './settings';
import {Traces} from "./trace";


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
    // Update settings in initialization service
    this.initService.settings = settings;
  }

  @Input()
  public set traces(traces: Traces) {
    // Set the initial traces
    this.featuresService.traces = traces;
    // Draw the traces on the canvas
    this.drawService.traces$.next(this.featuresService.traces);
  }

  @Input() public sequence!: Sequence;

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
        const {top: mt, left: ms, right: me, bottom: mb} = this.resizeService.margin;
        const h = this.resizeService.height;
        const w = this.resizeService.width;
        // Define number of residues in sequence
        const n = this.sequence.length + 1;
        // Apply scale limit to 5 residues
        this.initService.zoom
          .translateExtent([[ms, 0], [w - me, h - mb]])
          .scaleExtent([1, n / 5])
          .extent([[ms, 0], [w - me, h - mb]])
          .on('zoom', (event) => {
            this.zoomService.zoom$.next(event);
          });

        this.initService.brush
          .extent([[ms, mt], [w - me, h - mb]])
          .on('brush', (event) => this.adjustBrushToCells(event))
          .on('end', (event) => this.brushRegion(event));

        // Initialize brush on the brush region
        this.initService.brushRegion.call(this.initService.brush);
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
      this.initService.seqLen = this.sequence.length;
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

  private adjustBrushToCells(event: d3.D3BrushEvent<unknown>) {
    if (!event.sourceEvent) return;
    const x = this.initService.scale.x;
    let [x0, x1] = (event.selection as [number, number]).map(x.invert);
    x0 = Math.max(1, Math.round(x0));
    x1 = Math.min(this.sequence.length, Math.round(x1));
    const d1 = [x0 - 0.5, x1 + 0.5] as [number, number];

    this.initService.brushRegion.call(this.initService.brush.move, d1.map(x) as [number, number]);
  }

  private brushRegion(event: d3.D3BrushEvent<unknown>) {
    if (!event.sourceEvent) return;
    let selection: [number, number] | undefined = undefined;
    // Ensure that if a selection is made, at least 5 residues are selected
    if (event.selection) {
      const x = this.initService.scale.x;
      let [x0, x1] = (event.selection as [number, number]).map(x.invert);
      let cont = Math.round(x1 - x0);
      let toSx = false;

      // If the number of residues is less than 5, add residues to the left and right evenly and respecting the limits
      while (cont < 5) {
        // Add a position to sx if possible
        if (x0 > 1 && toSx) {
          x0 -= 1;
          cont += 1;
        }
        // Add a position to dx if possible
        if (x1 <= this.sequence.length && !toSx) {
          x1 += 1;
          cont += 1;
        }
        toSx = !toSx;
      }
      selection = [x0, x1];
      selection = selection!.map(x) as [number, number];
    }
    this.zoomService.brush$.next(selection);
  }

  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // onFeaturesZoom(event: any) {
  //   // Emit zoom event
  //   this.zoomService.zoom$.next(event);
  // }
}
