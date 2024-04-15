import { TestBed } from '@angular/core/testing';

import { NgxSequenceViewerService } from './ngx-sequence-viewer.service';

describe('NgxSequenceViewerService', () => {
  let service: NgxSequenceViewerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxSequenceViewerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
