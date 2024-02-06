import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageFeaturesViewerComponent } from './page-features-viewer.component';

describe('PageFeaturesViewerComponent', () => {
  let component: PageFeaturesViewerComponent;
  let fixture: ComponentFixture<PageFeaturesViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageFeaturesViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PageFeaturesViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
