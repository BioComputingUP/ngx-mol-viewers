import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageStructureViewerComponent } from './page-structure-viewer.component';

describe('PageStructureViewerComponent', () => {
  let component: PageStructureViewerComponent;
  let fixture: ComponentFixture<PageStructureViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageStructureViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PageStructureViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
