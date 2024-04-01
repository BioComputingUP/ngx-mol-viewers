import { TestBed } from '@angular/core/testing';

import { PluginService } from './plugin.service';

describe('InitializeService', () => {
  let service: PluginService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PluginService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
