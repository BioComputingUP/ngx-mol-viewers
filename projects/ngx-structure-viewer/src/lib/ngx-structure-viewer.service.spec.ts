import { TestBed } from '@angular/core/testing';

import { NgxStructureViewerService } from './ngx-structure-viewer.service';

describe('NgxStructureViewerService', () => {
  let service: NgxStructureViewerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxStructureViewerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
