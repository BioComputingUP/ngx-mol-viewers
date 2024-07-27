import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleSequenceViewerComponent } from './single-sequence-viewer.component';

describe('SingleSequenceViewerComponent', () => {
  let component: SingleSequenceViewerComponent;
  let fixture: ComponentFixture<SingleSequenceViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingleSequenceViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SingleSequenceViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
