import { TestBed } from '@angular/core/testing';
import { DrawService } from './draw.service';
import { InitializeService } from './initialize.service';
import { FeaturesService } from './features.service';
import { TooltipService } from './tooltip.service';
import { SequenceRenderer } from './renderers/sequence.renderer';
import { GridRenderer } from './renderers/grid.renderer';

describe('DrawService', () => {
  let service: DrawService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DrawService,
        InitializeService,
        FeaturesService,
        TooltipService,
        SequenceRenderer,
        GridRenderer,
      ]
    });
    service = TestBed.inject(DrawService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
