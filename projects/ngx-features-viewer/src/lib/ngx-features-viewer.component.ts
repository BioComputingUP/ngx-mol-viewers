import {
  AfterContentInit,
  AfterViewInit,
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
  QueryList,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { Observable, Subscription, switchMap, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
// Custom components
import { InitializeService } from './services/initialize.service';
import { FeaturesService } from './services/features.service';
import { ResizeService } from './services/resize.service';
import { ZoomService } from './services/zoom.service';
import { DrawService } from './services/draw.service';
// Custom data types
import { Settings } from './settings';
import { Traces } from "./trace";
import * as d3 from "d3";
import { KeyboardEvent } from "react";
import { TooltipService } from "./services/tooltip.service";


@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[ngx-features-viewer-label]',
  standalone: true
})
export class NgxFeaturesViewerLabelDirective {

  @Input() where: 'left' | 'right' = 'left';

  @Input() justify: 'start' | 'center' | 'end' = 'start';

  @Input() align: 'start' | 'center' | 'end' = 'center';

  @Input() padding = 0;

  constructor(public templateRef: TemplateRef<unknown>) {
  }
}

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[ngx-features-viewer-tooltip]',
  standalone: true
})
export class NgxFeaturesViewerTooltipDirective {
  constructor(public templateRef: TemplateRef<unknown>) {
  }
}

// TODO Define sequence type
export type Sequence = { length: number } & Partial<Record<number, string>>;

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
  encapsulation: ViewEncapsulation.None,
})
export class NgxFeaturesViewerComponent implements AfterViewInit, AfterContentInit, OnChanges, OnDestroy {

  @ViewChild('root')
  public _root!: ElementRef;

  @ContentChildren(NgxFeaturesViewerLabelDirective)
  public labels?: QueryList<NgxFeaturesViewerLabelDirective>;

  @ContentChild(NgxFeaturesViewerTooltipDirective)
  public tooltipCustomDirective?: NgxFeaturesViewerTooltipDirective;

  @ViewChild(NgxFeaturesViewerTooltipDirective)
  public tooltipDefaultDirective!: NgxFeaturesViewerTooltipDirective;

  @ViewChild('tooltip')
  public tooltipElementRef!: ElementRef<HTMLDivElement>;  // NOTE this is the element ref to the tooltip container

  @Input()
  public set settings(settings: Settings) {
    // Update settings in initialization service
    this.initializeService.settings = settings;
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
    public initializeService: InitializeService,
    public featuresService: FeaturesService,
    public tooltipService: TooltipService,
    public resizeService: ResizeService,
    public zoomService: ZoomService,
    public drawService: DrawService,
  ) {
    // TODO Update SVG according to inputs
    this.update$ = this.initializeService.initialized$.pipe(
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
        this.initializeService.zoom
          .translateExtent([[ms, 0], [w - me, h - mb]])
          .scaleExtent([1, n / 5])
          .extent([[ms, 0], [w - me, h - mb]])
          .on('zoom', (event) => {
            this.zoomService.zoom$.next(event);
          });

        this.initializeService.brush
          .extent([[ms, mt], [w - me, h - mb]])
          .on('brush', (event) => this.adjustBrushToCells(event))
          .on('end', (event) => this.brushRegion(event));

        // Initialize brush on the brush region
        this.initializeService.brushRegion.call(this.initializeService.brush);

        const focus = this.initializeService.focus;
        const brushRegion = this.initializeService.brushRegion;
        const focusMousedown = this.initializeService.focusMousedown.bind(this.initializeService.focus.node()!)

        // Function to handle key events
        function handleKeyEvent(event: KeyboardEvent) {
          const isShiftOrCmd = event.metaKey || event.shiftKey;
          const isKeyDown = event.type === 'keydown' && isShiftOrCmd

          // Set cursor and mousedown event based on key press/release
          focus
            .style('cursor', isKeyDown ? 'grabbing' : 'auto')
            .on('mousedown.zoom', isKeyDown ? focusMousedown : () => null)

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
        if (this.initializeService.labelLeft && this.initializeService.labelRight) {
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
    const tooltipDirective = this.tooltipCustomDirective || this.tooltipDefaultDirective;
    // Store tooltip template in init service
    this.initializeService.tooltip = tooltipDirective;
    // Store template reference
    this.tooltipService.templateRef = tooltipDirective.templateRef;
    // Get tooltip element
    this.tooltipService.tooltip = this.tooltipElementRef.nativeElement;
    // Emit root element
    this.initializeService.initialize$.next(this._root);
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

    if ((event.sourceEvent as MouseEvent).shiftKey) {
      // Do a pan
      this.initializeService.brushRegion.select('.overlay').style('cursor', 'grabbing');
    }

    const x = this.initializeService.scale.x;
    let [x0, x1] = (event.selection as [number, number]).map(x.invert);
    x0 = Math.max(1, Math.round(x0));
    x1 = Math.min(this.sequence.length, Math.round(x1));
    const d1 = [x0 - 0.5, x1 + 0.5] as [number, number];
    this.initializeService.brushRegion.call(this.initializeService.brush.move, d1.map(x) as [number, number]);
  }

  private brushRegion(event: d3.D3BrushEvent<unknown>) {
    if (!event.sourceEvent) return;
    let selection: [number, number] | undefined = undefined;
    // Ensure that if a selection is made, at least 5 residues are selected
    if (event.selection) {
      const x = this.initializeService.scale.x;
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
