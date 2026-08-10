import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxSingleSequenceViewerComponent } from './single-sequence-viewer.component';

describe('SingleSequenceViewerComponent', () => {
  let component: NgxSingleSequenceViewerComponent;
  let fixture: ComponentFixture<NgxSingleSequenceViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxSingleSequenceViewerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxSingleSequenceViewerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
