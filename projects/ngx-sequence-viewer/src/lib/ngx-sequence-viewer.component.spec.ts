import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxSequenceViewerComponent } from './ngx-sequence-viewer.component';

describe('NgxSequenceViewerComponent', () => {
  let component: NgxSequenceViewerComponent;
  let fixture: ComponentFixture<NgxSequenceViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxSequenceViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NgxSequenceViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
