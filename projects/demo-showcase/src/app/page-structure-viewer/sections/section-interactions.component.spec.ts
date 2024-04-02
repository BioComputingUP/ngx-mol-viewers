import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionInteractionsComponent } from './section-interactions.component';

describe('SectionInteractionsComponent', () => {
  let component: SectionInteractionsComponent;
  let fixture: ComponentFixture<SectionInteractionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionInteractionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SectionInteractionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
