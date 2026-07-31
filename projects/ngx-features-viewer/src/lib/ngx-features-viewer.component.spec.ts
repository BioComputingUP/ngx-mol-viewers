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

  it('should successfully update label top positions dynamically when traces change (no race condition)', () => {
    fixture.detectChanges();
    const traces: Traces = [{ features: [] }];
    component.traces = traces;

    const top = component.getLabelTop(1);
    expect(top).toBeGreaterThanOrEqual(0); // Position is calculated dynamically based on scale
  });
});
