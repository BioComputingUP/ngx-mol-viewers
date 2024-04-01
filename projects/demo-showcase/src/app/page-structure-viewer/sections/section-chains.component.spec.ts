import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionChainsComponent } from './section-chains.component';

describe('SectionChainsComponent', () => {
  let component: SectionChainsComponent;
  let fixture: ComponentFixture<SectionChainsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionChainsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SectionChainsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
