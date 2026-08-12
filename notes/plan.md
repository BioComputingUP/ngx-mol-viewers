## Goal Description
The objective is to add a unit test to `projects/ngx-features-viewer/src/lib/ngx-features-viewer.component.spec.ts`. This test will ensure that dynamically updating the `traces` input of an already-rendered component yields the exact same DOM (SVG output) as a component freshly initialized with the exact same updated `traces`. This guarantees that D3 data binding (`join`, `enter`, `update`, `exit`) accurately updates existing DOM nodes and doesn't leave stale UI states or incorrectly positioned elements during a lifecycle update.

## User Review Required
No major architectural changes or breaking changes are proposed. Please review the testing strategy to make sure it covers the specific dynamic updates (e.g. adding features, modifying nested traces) you want validated. 

## Proposed Changes

### `projects/ngx-features-viewer/src/lib/ngx-features-viewer.component.spec.ts`
We will add a new `it` block inside the main `describe` suite. The strategy involves:
1. Creating a component, setting initial traces, and triggering change detection.
2. Updating the component's `traces` property with modified data (including changed feature coordinates, a new feature, and a nested trace update) and triggering change detection again. We will record the resulting HTML of the SVG.
3. Creating a fresh component (via `TestBed.createComponent`) and directly initializing it with the exact same modified `traces` data, triggering change detection, and recording its HTML.
4. Comparing the two HTML outputs to ensure they are strictly equal.

```typescript
  it('should render identically for direct initialization vs runtime updates', () => {
    // 1. Setup a fresh fixture and provide an initial set of traces
    const initialTraces: Traces = [
      {
        label: 'Trace 1',
        features: [
          { type: 'locus', start: 1, end: 5, color: 'red' }
        ]
      }
    ];

    component.sequence = 'ACDEFGHIKLMNPQRSTVWY' as unknown as Sequence;
    component.traces = initialTraces;
    fixture.detectChanges();

    // 2. Perform an update phase on the original component
    const updatedTraces: Traces = [
      {
        label: 'Trace 1', // Same trace ID/label to trigger update instead of full recreate
        features: [
          { type: 'locus', start: 3, end: 8, color: 'blue' }, // Changed coordinates and color
          { type: 'pin', position: 10 } // Added feature
        ],
        nested: [
          {
            features: [
              { type: 'locus', start: 15, end: 18, color: 'green' } // Added nested trace
            ]
          }
        ]
      },
      {
        label: 'Trace 2', // Added trace
        features: [
          { type: 'continuous', values: [1, 2, 3, 4, 5] }
        ]
      }
    ];

    // Trigger update phase
    component.traces = updatedTraces;
    fixture.detectChanges();

    // Get HTML output from updated component
    const updatedHtml = component.initializeService.svg.node()!.innerHTML;

    // 3. Create a brand new component for direct rendering of updatedTraces
    const fixtureDirect = TestBed.createComponent(NgxFeaturesViewerComponent);
    const componentDirect = fixtureDirect.componentInstance;
    componentDirect.sequence = 'ACDEFGHIKLMNPQRSTVWY' as unknown as Sequence;
    componentDirect.traces = updatedTraces;
    fixtureDirect.detectChanges();

    // Get HTML output from directly initialized component
    const directHtml = componentDirect.initializeService.svg.node()!.innerHTML;

    // 4. Compare both HTML outputs
    expect(updatedHtml).withContext('The updated SVG should exactly match the directly initialized SVG').toEqual(directHtml);
  });
```

## Verification Plan
### Automated Tests
Run the Karma/Jasmine tests using `npm test` or `ng test ngx-features-viewer`. The newly added test must pass, ensuring that no stale nodes or incorrect placements persist across data updates.
