import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  AfterViewInit,
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ContentChildren,
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  QueryList,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import * as d3 from 'd3';
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
  standalone: true,
  imports: [
    NgxFeaturesViewerTooltipDirective,
    NgxFeaturesViewerLabelDirective,
    CommonModule,
  ],
  providers: [
    InitializeService,
    FeaturesService,
    TooltipService,
    ResizeService,
    DrawService,
    ZoomService,
  ],
  templateUrl: './ngx-features-viewer.component.html',
  styleUrl: './ngx-features-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
})
export class NgxFeaturesViewerComponent
  implements
    AfterViewInit,
    AfterContentInit,
    OnChanges,
    OnDestroy
{
  @ViewChild('root')
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

  @Input() public sequence!: Sequence;

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
      tap(() => {
        // const { width, height } = this.resizeService;
        const {
          top: mt,
          left: ms,
          right: me,
          bottom: mb,
        } = this.resizeService.margin;
        const h = this.resizeService.height;
        const w = this.resizeService.width;
        // Define number of residues in sequence
        const n = this.sequence.length + 1;
        // Apply scale limit to 5 residues
        this.initializeService.zoom
          .translateExtent([
            [ms, 0],
            [w - me, h - mb],
          ])
          .scaleExtent([1, n / 5])
          .extent([
            [ms, 0],
            [w - me, h - mb],
          ])
          .on('zoom', (event) => {
            this.zoomService.zoom$.next(event);
          });

        this.initializeService.brush
          .extent([
            [ms, mt],
            [w - me, h - mb],
          ])
          .on('brush', (event) => this.zoomService.adjustBrushToCells(event))
          .on('end', (event) => this.zoomService.brushRegion(event));

        // Initialize brush on the brush region
        this.initializeService.brushRegion.call(this.initializeService.brush);

        const focus = this.initializeService.focus;
        const brushRegion = this.initializeService.brushRegion;
        const focusMousedown = this.initializeService.focusMousedown.bind(
          this.initializeService.focus.node()!,
        );

        // Function to handle key events
        function handleKeyEvent(event: KeyboardEvent) {
          const isShiftOrCmd = event.metaKey || event.shiftKey;
          const isKeyDown = event.type === 'keydown' && isShiftOrCmd;

          // Set cursor and mousedown event based on key press/release
          focus
            .style('cursor', isKeyDown ? 'grabbing' : 'auto')
            .on('mousedown.zoom', isKeyDown ? focusMousedown : () => null);

          // Toggle pointer events on the brush region
          brushRegion
            .select('.overlay')
            .style('pointer-events', isKeyDown ? 'none' : 'all');
        }

        // Bind the key event handler to both keydown and keyup events
        d3.select('body').on('keydown keyup', handleKeyEvent.bind(this));
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
      // Store reference to sequence
      this.initializeService.sequence = this.sequence;
      // Emit sequence
      this.sequence$.next(this.initializeService.sequence);
    }
  }

  public ngAfterContentInit(): void {
    // Case label templates are defined
    if (this.labels) {
      // Loop through each label template
      this.labels.forEach((label) => {
        // Case both labels are defined, then throw error
        if (
          this.initializeService.labelLeft &&
          this.initializeService.labelRight
        ) {
          throw new Error('Only one label can be defined');
        }
        // Case label is left
        if (label.where === 'left') {
          this.initializeService.labelLeft = label;
        }
        // Case label is right
        if (label.where === 'right') {
          this.initializeService.labelRight = label;
        }
      });
    }
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
    // Emit root element
    this.initializeService.initSVG(this._root);
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
