import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxFeaturesViewerComponent } from './ngx-features-viewer.component';
import { Sequence } from './sequence';
import { Traces } from './trace';
import { SimpleChange } from '@angular/core';

describe('NgxFeaturesViewerComponent Race Conditions & Temporal Dependencies', () => {
  let component: NgxFeaturesViewerComponent;
  let fixture: ComponentFixture<NgxFeaturesViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxFeaturesViewerComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NgxFeaturesViewerComponent);
    component = fixture.componentInstance;
  });

  it('should handle inputs being provided BEFORE initialization', () => {
    // Provide inputs
    component.sequence = 'ACDEFGHIKLMNPQRSTVWY' as unknown as Sequence;
    const traces: Traces = [{ features: [] }];
    component.traces = traces;
    
    // Trigger lifecycle hooks
    component.ngOnChanges({
      sequence: new SimpleChange(null, component.sequence, true)
    });
    
    fixture.detectChanges();
    
    // Assert initialization was successful
    expect(component).toBeTruthy();
    expect(component.initializeService.root).toBeDefined();
    expect(component.initializeService.svg).toBeDefined();
  });

  it('should handle inputs being provided AFTER initialization', () => {
    // Trigger lifecycle hooks without inputs
    fixture.detectChanges();
    
    // Assert initialization
    expect(component).toBeTruthy();
    expect(component.initializeService.root).toBeDefined();
    expect(component.initializeService.svg).toBeDefined();

    // Now provide inputs
    component.sequence = 'ACDEFGHIKLMNPQRSTVWY' as unknown as Sequence;
    const traces: Traces = [{ features: [] }];
    component.traces = traces;
    
    component.ngOnChanges({
      sequence: new SimpleChange(null, component.sequence, false)
    });
    
    fixture.detectChanges();
  });

  it('should ensure label layout properties do not change unnecessarily unless inputs/traces change', (done) => {
    // Provide initial inputs
    component.sequence = 'ACDEFGHIKLMNPQRSTVWY' as unknown as Sequence;
    component.traces = [{ features: [] }];
    component.ngOnChanges({
      sequence: new SimpleChange(null, component.sequence, true)
    });
    fixture.detectChanges();

    let emissionCount = 0;
    let firstLayout: any;

    const sub = component.drawService.layoutTraces$.subscribe(layouts => {
      emissionCount++;
      if (emissionCount === 1) {
        firstLayout = layouts;
      } else if (emissionCount === 2) {
        // Just verify the array has the exact same calculated properties for the first trace
        expect(layouts[0].top).toEqual(firstLayout[0].top);
        expect(layouts[0].height).toEqual(firstLayout[0].height);
      }
    });

    // Trigger another change detection without modifying inputs
    fixture.detectChanges();
    expect(emissionCount).toBe(1); // No new emission

    // Provide a new trace to trigger second emission
    component.traces = [{ features: [] }, { features: [] }];
    component.ngOnChanges({
      traces: new SimpleChange([{ features: [] }], component.traces, false)
    });
    fixture.detectChanges();

    setTimeout(() => {
      expect(emissionCount).toBeGreaterThanOrEqual(2);
      sub.unsubscribe();
      done();
    }, 100);
  });

  it('should resolve layoutTraces$ synchronously during initial change detection, proving lock-step startup', () => {
    let layoutEmittedSynchronously = false;

    // Provide initial inputs required for rendering
    component.sequence = 'ACDEFGHIKLMNPQRSTVWY' as unknown as Sequence;
    component.traces = [{ features: [] }];
    component.ngOnChanges({
      sequence: new SimpleChange(null, component.sequence, true)
    });

    const sub = component.drawService.layoutTraces$.subscribe(() => {
      layoutEmittedSynchronously = true;
    });

    // Triggers ngOnInit which synchronously triggers initSVG, draw$, drawn$, and layoutTraces$
    fixture.detectChanges(); 

    // If this is true immediately after detectChanges(), it proves the SVG and labels 
    // are resolved in the exact same synchronous change detection frame.
    expect(layoutEmittedSynchronously).withContext('layoutTraces$ should emit synchronously').toBeTrue();
    
    sub.unsubscribe();
  });
});
