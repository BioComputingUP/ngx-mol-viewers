import { StructureService } from './structure.service';
import { PluginService } from './plugin.service';
import { Source } from '../interfaces/source';
// import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

describe('StructureService', () => {
  let structureService: StructureService;
  // let pluginService: PluginService;

  beforeEach(() => {
    // Test module definition
    TestBed.configureTestingModule({
      // imports: [HttpClientModule],
      providers: [StructureService, PluginService]
    });
    // Inject services
    structureService = TestBed.inject(StructureService);
    // // Get HTTP client
    // const http = TestBed.inject(HttpClient);
    // // Define 
    // TestBed.inject(PluginService);
    // // Define file data
    // const data = new Blob([fs.readFileSync(path.join(__dirname, 'assets', '8vap.A.pdb'), 'utf8')]);
    // // Define source for plugin service
    // const source: Source = { type: 'local', data, format: 'mmcif', label: '8vap.A.pdb', binary: false };
    // // Emit source in plugin service
    // structureService.source$.next(source);
    // Define remote source, which is actually stored in ./assets
    const source: Source = { type: 'remote', link: 'assets/8vap.A.cif', format: 'mmcif', label: '8vap.A', binary: false };
    // Emit source in plugin service
    structureService.source$.next(source);
  });

  // Test data is available
  it('should have data available', () => {
    // Get current data
    const data = structureService.source$.value;
    // Test if data is available
    expect(data).toBeTruthy();
  });

  // it('should be created', () => {
  //   expect(structureService).toBeTruthy();

  // });

  // it('structure$ should return correct results', (done: DoneFn) => {
  //   service.structure$.subscribe(value => {
  //     expect(value).toBe('mocked value');
  //     done();
  //   });
  // });

  // it('subsequent subscriptions to structure$ should use cached results', (done: DoneFn) => {
  //   service.structure$.subscribe(firstValue => {
  //     service.structure$.subscribe(secondValue => {
  //       expect(firstValue).toBe(secondValue);
  //       expect(sourceSpy.calls.count()).toBe(1);
  //       done();
  //     });
  //   });
  // });

  // Test structure emission on source change
  it('structure$ should emit on source change', (done: DoneFn) => {
    // Subscribe to structure emission
    structureService.structure$.subscribe((value) => {
      // Test if structure is available
      expect(value).toBeTruthy();
      // Test if resiudes map is available
      // expect(structureService.residues).toBeTruthy();
      // Finish test
      done();
    });
  });
});
