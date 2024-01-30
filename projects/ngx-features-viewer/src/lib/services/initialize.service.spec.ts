import { TestBed } from '@angular/core/testing';

import { InitializeService } from './initialize.service';

describe('InitializeService', () => {
  let service: InitializeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InitializeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
