import { TestBed } from '@angular/core/testing';

import { NgxFeaturesViewerService } from './ngx-features-viewer.service';

describe('NgxFeaturesViewerService', () => {
  let service: NgxFeaturesViewerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxFeaturesViewerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
