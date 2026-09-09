---
name: ngx-features-viewer
description: Architecture, behaviors, and reactive update pipeline reference for ngx-features-viewer. Documents services, renderers, feature strategies, interaction mechanics, and D3/RxJS orchestration.
---

# `ngx-features-viewer` Architecture & System Reference

`ngx-features-viewer` is an Angular and D3-based visualization library designed to render sequence-aligned biological features (e.g. genomic or protein features) across stacked tracks (traces).

use skills angular-developer and d3-visualization to efficiently manage updates to the library
---

## 1. Quick File & Component Index

### Component & Directives
- **Main Component**: [`ngx-features-viewer.component.ts`](file:///home/adel/projects/ngx-mol-viewers/projects/ngx-features-viewer/src/lib/ngx-features-viewer.component.ts)
  - Inputs: `@Input() sequence`, `@Input() traces`, `@Input() settings`, `@Input() zoomOnRegion`.
  - Outputs: `@Output() selectedFeature`, `@Output() zoomedAt`.
  - Template: [`ngx-features-viewer.component.html`](file:///home/adel/projects/ngx-mol-viewers/projects/ngx-features-viewer/src/lib/ngx-features-viewer.component.html)
- **Directives**:
  - `NgxFeaturesViewerTooltipDirective`: Captures custom template references for tooltips.
  - `NgxFeaturesViewerLabelDirective`: Captures custom templates for left/right trace labels.

### Core Services (`src/lib/services/`)
- [`initialize.service.ts`](file:///home/adel/projects/ngx-mol-viewers/projects/ngx-features-viewer/src/lib/services/initialize.service.ts): SVG scaffolding, D3 selections (`svg`, `draw`, `axes`, `shadow`, `hoverCircleMarker`), coordinates, shared scale instances.
- [`features.service.ts`](file:///home/adel/projects/ngx-mol-viewers/projects/ngx-features-viewer/src/lib/services/features.service.ts): Trace hierarchy processing, flattening nested traces, domain bounds calculation (`globalMinMax`), trace lookup maps.
- [`draw.service.ts`](file:///home/adel/projects/ngx-mol-viewers/projects/ngx-features-viewer/src/lib/services/draw.service.ts): Master rendering pipeline, vertical layout calculation, trace/feature D3 data-joins, selection shadow updates, label clicks.
- [`resize.service.ts`](file:///home/adel/projects/ngx-mol-viewers/projects/ngx-features-viewer/src/lib/services/resize.service.ts): Listens to container element dimensions, resizes root SVG and inner containers.
- [`zoom.service.ts`](file:///home/adel/projects/ngx-mol-viewers/projects/ngx-features-viewer/src/lib/services/zoom.service.ts): Manages D3 zoom and brush behaviors, domain updates, and scale synchronization.
- [`tooltip.service.ts`](file:///home/adel/projects/ngx-mol-viewers/projects/ngx-features-viewer/src/lib/services/tooltip.service.ts): Handles tooltip positioning, emission to `tooltip$`, and feature mouse event binding.

### Renderers (`src/lib/services/renderers/`)
- [`sequence.renderer.ts`](file:///home/adel/projects/ngx-mol-viewers/projects/ngx-features-viewer/src/lib/services/renderers/sequence.renderer.ts): Calculates character widths (`sequenceCharWidth`, `featureLabelCharWidth`), renders residues, dots, and sequence axis.
- [`grid.renderer.ts`](file:///home/adel/projects/ngx-mol-viewers/projects/ngx-features-viewer/src/lib/services/renderers/grid.renderer.ts): Renders horizontal reference grid lines and zero-lines for traces.

### Feature Strategies (`src/lib/services/strategies/`)
- Factory: [`strategy.factory.ts`](file:///home/adel/projects/ngx-mol-viewers/projects/ngx-features-viewer/src/lib/services/strategies/strategy.factory.ts) resolves strategy by `FeatureType`.
- Strategies:
  - [`locus.strategy.ts`](file:///home/adel/projects/ngx-mol-viewers/projects/ngx-features-viewer/src/lib/services/strategies/locus.strategy.ts): Discrete genomic/sequence intervals (rectangles with labels).
  - [`continuous.strategy.ts`](file:///home/adel/projects/ngx-mol-viewers/projects/ngx-features-viewer/src/lib/services/strategies/continuous.strategy.ts): Numeric series (area and line profiles across residues).
  - [`pin.strategy.ts`](file:///home/adel/projects/ngx-mol-viewers/projects/ngx-features-viewer/src/lib/services/strategies/pin.strategy.ts): Point markers / lollipops at specific positions.
  - [`poly.strategy.ts`](file:///home/adel/projects/ngx-mol-viewers/projects/ngx-features-viewer/src/lib/services/strategies/poly.strategy.ts): Multi-segment polygon and arrow markers.
  - [`dssp.strategy.ts`](file:///home/adel/projects/ngx-mol-viewers/projects/ngx-features-viewer/src/lib/services/strategies/dssp.strategy.ts): Secondary structure elements (helices, sheets, coils).

---

## 2. System Behaviors & User Interactions

### Zoom & Pan
- **Driver**: [`ZoomService`](file:///home/adel/projects/ngx-mol-viewers/projects/ngx-features-viewer/src/lib/services/zoom.service.ts) binds `d3.zoom()` onto `initializeService.events`.
- **Behavior**: Horizontal scrolling or pinch-zooming alters the horizontal domain of `scale.x`.
- **Output**: Fires `zoomed$` into the update pipeline to re-render all sequence residues, grids, and features according to the updated horizontal coordinates.

### Brush Region Selection
- **Driver**: D3 brush bound to `initializeService.brushRegion`.
- **Behavior**: Users can drag a selection box across the sequence ruler.
- **Output**: Synchronizes with `zoomService.brush$` and emits the 1-indexed residue range through `@Output() zoomedAt`.

### Feature Selection & Shadow Box
- **Driver**: Clicking a feature invokes `tooltipService.selectFeature()`, emitting into `drawService.selectedFeatureEmit$`.
- **Behavior**: An SVG rect (`initializeService.shadow`) is animated and stretched across the selected feature's residue span `[start, end]`.
- **Output**: Emitted to `@Output() selectedFeature` as a `SelectionContext`. Clicking outside or deselecting collapses the shadow rect to width 0.

### Hovering & Tooltips
- **Driver**: `TooltipService.bindFeatureEvents()` binds `mouseenter`, `mousemove`, and `mouseleave` onto rendered feature groups.
- **Behavior**:
  - `mouseenter` / `mousemove`: Translates the HTML tooltip container (`setTooltipPosition`) to follow the cursor, bounds-checking window edges, and emits `{ trace, feature, index, coordinates }` to `tooltip$`.
  - For `continuous` features, a circular hover indicator (`initializeService.hoverCircleMarker`) snaps to the exact Y value of the curve at the hovered residue coordinate.
  - `mouseleave`: Hides the tooltip and circular hover marker.

### Trace Hierarchy & Label Expansion
- **Driver**: [`DrawService.onLabelClick()`](file:///home/adel/projects/ngx-mol-viewers/projects/ngx-features-viewer/src/lib/services/draw.service.ts) triggered from label template DOM events.
- **Behavior**: Toggles `trace.expanded`. When expanded, descendant traces at `level + 1` are set to `show = true`; when collapsed, all descendants are hidden (`show = false`).
- **Output**: The updated list of visible traces is emitted into `drawService.traces$`, triggering dynamic recalculation of vertical scale ranges and SVG canvas height.

### Viewport Culling
- In `DrawService.renderTraces`, each feature's `[featureStart, featureEnd]` is evaluated against `[currentDomainStart, currentDomainEnd]`.
- Features completely outside the visible viewport boundary are tracked in `alreadyExitedFromView` to skip redundant calculations.

---

## 3. Coordinate Systems & Scales

### Horizontal Scale (`scale.x`)
- **Type**: `d3.ScaleLinear<number, number>`.
- **Domain**: `[0, sequence.length + 1]`.
- **Range**: `[margin.left, width - margin.right]`.
- Residue `1` is centered at `scale.x(1)`. Residue boundaries occupy intervals of width `cw = scale.x(1) - scale.x(0)`.

### Vertical Scale (`scale.y`)
- **Type**: `d3.ScaleOrdinal<string, number>`.
- **Domain**: Array of string trace IDs `['0', '1', '2', ...]`.
- **Range**: Cumulative vertical pixel offsets computed sequentially:
  $$\text{Y}_{i} = \text{Y}_{i-1} + \text{mb}_{i-1} + \text{mt}_{i} + \text{lh}_{i-1}$$
  where `mt` is margin-top, `mb` is margin-bottom, and `lh` is line-height.

### Feature Value Mapping (Continuous)
- Traces with numeric curves calculate local domain: `[trace.domain.min, trace.domain.max]`.
- Pixel boundaries for each trace:
  - $\text{center} = \text{scale.y}(\text{trace.id}) + \frac{\text{line-height}}{2}$
  - $\text{top} = \text{center} - \frac{\text{content-size}}{2}$
  - $\text{bottom} = \text{center} + \frac{\text{content-size}}{2}$
- Values are scaled proportionally between $\text{bottom}$ (min) and $\text{top}$ (max).

---

## 4. The Update Pipeline (RxJS & D3 Orchestration)

The entire rendering and interaction model runs through an integrated RxJS pipeline orchestrated in `NgxFeaturesViewerComponent` and `DrawService`.

### Pipeline Execution Order

```
initializeService.initialized$
  │
  ├──> drawService.draw$
  │      ├── Update horizontal domain: [0, sequence.length + 1]
  │      ├── Calculate font metrics (calculateCharWidth)
  │      ├── createSequence()
  │      ├── createBrush() & createTooltip()
  │      └── switchMap(traces$)
  │            ├── updateScale(traces)
  │            └── gridRenderer.createGrid(traces)
  │
  ├──> resizeService.resized$
  │      ├── updateRoot()
  │      └── updateDraw()
  │
  ├──> zoomService.setupZoomAndBrushBounds()
  │
  ├──> zoomService.zoomed$
  │
  └──> drawService.drawn$
         ├── sequenceRenderer.updateSequence()
         ├── gridRenderer.updateGrid()
         ├── drawService.renderTraces(traces)
         └── drawService.updateShadowPosition()
```

### 1. Initialization Phase (`initialized$`)
- `NgxFeaturesViewerComponent.ngOnInit()` passes the host container reference to `InitializeService.initSVG()`.
- `initSVG()` builds the SVG DOM scaffolding: root `<svg>`, `<defs>`, `<clipPath>`, background `<rect>`, `<g id="draw">`, axes groups, hover marker, and shadow rect.
- Once created, `initialized$` emits the root SVG selection.

### 2. Draw Setup Phase (`draw$`)
- Combines `initialized$` and `sequence$`.
- Sets the domain on `scale.x` for the sequence length.
- Measures character rendering dimensions via temporary DOM nodes.
- Initializes sequence residue containers, brush region, and tooltip.
- Switches to `traces$` emissions via `switchMap`. When traces emit, vertical scale domains and ranges are updated and background grid lines are created.

### 3. Resize & Zoom Setup (`resized$`, `zoomed$`)
- `ResizeService.resized$` calculates container widths, updating SVG dimensions and clip paths.
- `ZoomService.setupZoomAndBrushBounds()` initializes zoom scale constraints and extent limits based on sequence length.
- `zoomed$` emits on every zoom or pan transformation.

### 4. Render Phase (`drawn$`)
`drawn$` is triggered whenever `draw$` emits or when settings/zoom change:
1. **`sequenceRenderer.updateSequence()`**: Repositions text residues, ruler ticks, and dot markers along `scale.x`.
2. **`gridRenderer.updateGrid()`**: Repositions horizontal grid lines according to current trace offsets.
3. **`drawService.renderTraces(traces)`**:
   - Performs a D3 data-join on `g.trace` elements.
   - For each trace, performs a D3 data-join on `g.feature` elements.
   - Delegates the rendering of each feature group to its respective strategy via `StrategyFactory.getStrategy(feature.type).render(...)`.
   - Binds tooltip and click interaction hooks (`bindFeatureEvents`).
4. **`updateShadowPosition()`**: Repositions the selection highlight rect to match current zoom coordinates.
