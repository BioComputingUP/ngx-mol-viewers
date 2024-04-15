import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageSequenceViewerComponent } from './page-sequence-viewer.component';

describe('PageSequenceViewerComponent', () => {
  let component: PageSequenceViewerComponent;
  let fixture: ComponentFixture<PageSequenceViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageSequenceViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PageSequenceViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
