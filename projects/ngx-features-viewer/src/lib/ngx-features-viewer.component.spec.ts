import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxFeaturesViewerComponent } from './ngx-features-viewer.component';

describe('NgxFeaturesViewerComponent', () => {
  let component: NgxFeaturesViewerComponent;
  let fixture: ComponentFixture<NgxFeaturesViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxFeaturesViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NgxFeaturesViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
