import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxStructureViewerComponent } from './ngx-structure-viewer.component';

describe('NgxStructureViewerComponent', () => {
  let component: NgxStructureViewerComponent;
  let fixture: ComponentFixture<NgxStructureViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxStructureViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NgxStructureViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
