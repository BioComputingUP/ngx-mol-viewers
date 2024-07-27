import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipleSequenceAlignmentComponent } from './multiple-sequence-alignment.component';

describe('MultipleSequenceAlignmentComponent', () => {
  let component: MultipleSequenceAlignmentComponent;
  let fixture: ComponentFixture<MultipleSequenceAlignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultipleSequenceAlignmentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MultipleSequenceAlignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
