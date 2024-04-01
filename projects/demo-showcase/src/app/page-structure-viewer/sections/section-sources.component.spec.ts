import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionSourcesComponent } from './section-sources.component';

describe('SectionSourcesComponent', () => {
  let component: SectionSourcesComponent;
  let fixture: ComponentFixture<SectionSourcesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionSourcesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SectionSourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
