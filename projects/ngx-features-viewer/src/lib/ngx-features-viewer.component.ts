import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ContentChildren,
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { map, Observable, Subscription, switchMap, tap } from 'rxjs';
import { Sequence } from './sequence';
import { DrawService } from './services/draw.service';
import { FeaturesService } from './services/features.service';
// Custom components
import {
  InitializeService,
  SelectionContext,
} from './services/initialize.service';
import { ResizeService } from './services/resize.service';
import { TooltipService } from './services/tooltip.service';
import { ZoomService } from './services/zoom.service';
import { SequenceRenderer } from './services/renderers/sequence.renderer';
import { GridRenderer } from './services/renderers/grid.renderer';
// Custom data types
import { Settings } from './settings';
import { Traces } from './trace';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[ngx-features-viewer-label]',
  standalone: true,
})
export class NgxFeaturesViewerLabelDirective {
  @Input() where: 'left' | 'right' = 'left';

  constructor(public templateRef: TemplateRef<unknown>) {}
}

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[ngx-features-viewer-tooltip]',
  standalone: true,
})
export class NgxFeaturesViewerTooltipDirective {
  constructor(public templateRef: TemplateRef<unknown>) {}
}

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: 'ngx-features-viewer',
    imports: [
        NgxFeaturesViewerTooltipDirective,
        CommonModule,
    ],
    providers: [
        InitializeService,
        FeaturesService,
        TooltipService,
        ResizeService,
        DrawService,
        ZoomService,
        SequenceRenderer,
        GridRenderer,
    ],
    templateUrl: './ngx-features-viewer.component.html',
    styleUrl: './ngx-features-viewer.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.Emulated
})
export class NgxFeaturesViewerComponent
  implements
    OnInit,
    AfterViewInit,
    OnDestroy
{
  @ViewChild('root', { static: true })
  public _root!: ElementRef;

  @ContentChildren(NgxFeaturesViewerLabelDirective)
  public labels?: QueryList<NgxFeaturesViewerLabelDirective>;

  @ContentChild(NgxFeaturesViewerTooltipDirective)
  public tooltipCustomDirective?: NgxFeaturesViewerTooltipDirective;

  @ViewChild(NgxFeaturesViewerTooltipDirective)
  public tooltipDefaultDirective!: NgxFeaturesViewerTooltipDirective;

  @ViewChild('tooltip')
  public tooltipElementRef!: ElementRef<HTMLDivElement>; // NOTE this is the element ref to the tooltip container

  @Input()
  public set settings(settings: Partial<Settings> | null) {
    // Update settings in initialization service
    this.initializeService.settings = settings;
  }

  @Input()
  public set traces(traces: Traces) {
    console.log({ tracesSet: traces.length });
    // Set the initial traces
    this.featuresService.traces = traces;
    // Draw the traces on the canvas
    this.drawService.traces$.next(this.featuresService.traces);
  }

  @Input()
  public set sequence(sequence: Sequence) {
    this.initializeService.sequence = sequence;
    this.drawService.sequence$.next(sequence);
  }
  public get sequence(): Sequence {
    return this.initializeService.sequence;
  }

  public get labelLeft(): NgxFeaturesViewerLabelDirective | undefined {
    return this.labels?.find(label => label.where === 'left');
  }

  public get labelRight(): NgxFeaturesViewerLabelDirective | undefined {
    return this.labels?.find(label => label.where === 'right');
  }

  @Input()
  public set zoomOnRegion(zoomRegion: [number, number] | undefined) {
    // Check that the selected region is within the sequence
    if (zoomRegion) {
      if (zoomRegion[0] >= 1 && zoomRegion[1] <= this.sequence.length) {
        const x = this.initializeService.scale.x;
        zoomRegion = [zoomRegion[0] - 0.5, zoomRegion[1] + 0.5];
        this.zoomService.brush$.next(zoomRegion.map(x) as [number, number]);
      } else {
        console.warn(
          `Selected region [${zoomRegion[0]}, ${zoomRegion[1]}] is out of bounds (1, ${this.sequence.length})`,
        );
      }
    }
  }

  @Output() public selectedFeature: Observable<SelectionContext | undefined> =
    this.drawService.selectedFeature$.pipe(
      // Adjust for the .5 offset
      map((context) =>
        context
          ? {
              ...context!,
              range: {
                start: context.range!.start + 0.5,
                end: context.range!.end - 0.5,
              },
            }
          : undefined,
      ),
    );

  @Output() public zoomedAt: Observable<[number, number] | undefined> =
    this.zoomService.brush$.pipe(
      map((range) => {
        const x = this.initializeService.scale.x;
        return range
          ? (range
              .map(x.invert)
              .map((v, i) => (i == 0 ? v + 0.5 : v - 0.5))
              .map(Math.round) as [number, number])
          : undefined;
      }),
    );

  private readonly sequence$ = this.drawService.sequence$;

  private update$: Observable<unknown>;

  private _update: Subscription;

  constructor(
    // Dependency injection
    public initializeService: InitializeService,
    public featuresService: FeaturesService,
    public tooltipService: TooltipService,
    public resizeService: ResizeService,
    public zoomService: ZoomService,
    public drawService: DrawService,
  ) {
    // Update SVG according to inputs
    this.update$ = this.initializeService.initialized$.pipe(
      // Initialize drawings
      switchMap(() => this.drawService.draw$),
      // Subscribe to resize event (set width, height)
      switchMap(() => this.resizeService.resized$),
      // Initialize zoom scale
      tap(() => this.zoomService.setupZoomAndBrushBounds(this.sequence.length)),
      // Subscribe to zoom event
      switchMap(() => this.zoomService.zoomed$),
      // Finally, update representation
      switchMap(() => this.drawService.drawn$),
    );
    // Subscribe to update emission
    this._update = this.update$.subscribe();
  }

  public ngOnInit(): void {
    // Emit root element for SVG initialization synchronously
    this.initializeService.initSVG(this._root);
  }



  public ngAfterViewInit(): void {
    // Get tooltip directive, fallback to default in case custom is not defined
    const tooltipDirective =
      this.tooltipCustomDirective || this.tooltipDefaultDirective;
    // Store tooltip template in init service
    this.initializeService.tooltip = tooltipDirective;
    // Store template reference
    this.tooltipService.templateRef = tooltipDirective.templateRef;
    // Get tooltip element
    this.tooltipService.tooltip = this.tooltipElementRef.nativeElement;
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
}
