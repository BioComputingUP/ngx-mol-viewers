import { TestBed } from '@angular/core/testing';
import { DrawService, sortLocuses } from './draw.service';
import { InitializeService } from './initialize.service';
import { FeaturesService } from './features.service';
import { TooltipService } from './tooltip.service';
import { SequenceRenderer } from './renderers/sequence.renderer';
import { GridRenderer } from './renderers/grid.renderer';
import { Locus } from '../features/locus';
import { Feature, featureIdentity } from '../features/feature';

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

  describe('sortLocuses', () => {
    it('should place outer locus before nested child locus', () => {
      const parentLocus: Locus = { type: 'locus', start: 10, end: 50 };
      const childLocus: Locus = { type: 'locus', start: 20, end: 30 };

      // When comparing child to parent: child nested in parent should return 1 (child drawn after parent)
      expect(sortLocuses(childLocus, parentLocus)).toBe(1);
      // When comparing parent to child: parent should return -1 (parent drawn before child)
      expect(sortLocuses(parentLocus, childLocus)).toBe(-1);
    });

    it('should order non-nested locuses by start position', () => {
      const locus1: Locus = { type: 'locus', start: 10, end: 20 };
      const locus2: Locus = { type: 'locus', start: 30, end: 40 };

      expect(sortLocuses(locus1, locus2)).toBeLessThan(0);
      expect(sortLocuses(locus2, locus1)).toBeGreaterThan(0);
    });

    it('should return 0 when comparing non-locus features', () => {
      const pin: Feature = { type: 'pin', position: 15 };
      const locus: Locus = { type: 'locus', start: 10, end: 20 };

      expect(sortLocuses(pin, locus)).toBe(0);
      expect(sortLocuses(locus, pin)).toBe(0);
    });

    it('should sort an array of features so nested locuses are placed after their container locus', () => {
      const child: Locus = { type: 'locus', start: 20, end: 30, label: 'child' };
      const parent: Locus = { type: 'locus', start: 10, end: 50, label: 'parent' };
      const other: Locus = { type: 'locus', start: 60, end: 70, label: 'other' };

      const features: Feature[] = [child, other, parent];
      features.sort(sortLocuses);

      const parentIndex = features.indexOf(parent);
      const childIndex = features.indexOf(child);

      // Parent must come before child so child is drawn on top
      expect(parentIndex).toBeLessThan(childIndex);
    });

    it('should place container DSSP feature before nested child DSSP features', () => {
      const f3: Feature = { type: 'dssp', code: 'C', start: 56, end: 92, label: 'feature-3' };
      const f4: Feature = { type: 'dssp', code: 'T', start: 93, end: 105, label: 'feature-4' };
      const f5: Feature = { type: 'dssp', code: 'E', start: 106, end: 140, label: 'feature-5' };
      const f6: Feature = { type: 'dssp', code: 'C', start: 50, end: 217, label: 'feature-6' };

      const features: Feature[] = [f3, f4, f5, f6];
      features.sort(sortLocuses);

      const f6Index = features.indexOf(f6);
      const f3Index = features.indexOf(f3);
      const f4Index = features.indexOf(f4);
      const f5Index = features.indexOf(f5);

      // f6 is the container (50-217), so it must be rendered first (underneath), and f3, f4, f5 after it (on top)
      expect(f6Index).toBeLessThan(f3Index);
      expect(f6Index).toBeLessThan(f4Index);
      expect(f6Index).toBeLessThan(f5Index);
    });
  });

  describe('featureIdentity', () => {
    it('should assign a unique, stable number for each feature reference', () => {
      const f1: Locus = { type: 'locus', start: 1, end: 10 };
      const f2: Locus = { type: 'locus', start: 20, end: 30 };

      const fid1 = featureIdentity(f1);
      const fid2 = featureIdentity(f2);

      expect(typeof fid1).toBe('number');
      expect(typeof fid2).toBe('number');
      expect(fid1).not.toBe(fid2);

      // Stable across multiple calls
      expect(featureIdentity(f1)).toBe(fid1);
      expect(featureIdentity(f2)).toBe(fid2);
    });

    it('should retain stable identity when features array is shuffled', () => {
      const f1: Locus = { type: 'locus', start: 1, end: 10 };
      const f2: Locus = { type: 'locus', start: 15, end: 25 };
      const f3: Locus = { type: 'locus', start: 30, end: 40 };

      const originalIds = [f1, f2, f3].map(featureIdentity);

      // Shuffle features
      const shuffled = [f3, f1, f2];
      const shuffledIds = shuffled.map(featureIdentity);

      expect(shuffledIds[0]).toBe(originalIds[2]);
      expect(shuffledIds[1]).toBe(originalIds[0]);
      expect(shuffledIds[2]).toBe(originalIds[1]);
    });
  });
});
