import { TestBed } from '@angular/core/testing';

import { ThemeSelectorService } from './theme-selector.service';

describe('ThemeSelectorService', () => {
  let service: ThemeSelectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeSelectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
