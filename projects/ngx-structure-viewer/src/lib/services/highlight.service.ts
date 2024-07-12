// Custom dependencies
import { getLocusFromSet } from './representation.service';
import { StructureService } from './structure.service';
import { PluginService } from './plugin.service';
import { Locus } from '../interfaces/locus';
// Common dependencies
import { Observable, ReplaySubject, Subscription, combineLatestWith, map, mergeWith, shareReplay } from 'rxjs';
import { StructureProperties as SP, StructureElement as SE } from 'molstar/lib/mol-model/structure';
import { Injectable, OnDestroy } from '@angular/core';

export type Highlights = Locus | undefined;

@Injectable()
export class HighlightService implements OnDestroy {

  readonly input$ = new ReplaySubject<Highlights>(1);

  readonly output$!: Observable<Highlights>;

  // public set highlights(highlights: Highlights) {
  //   // Emit highlight
  //   this.input$.next(highlights);
  // }

  // protected _highlights: Subscription;

  // constructor(
  //   // public representationService: RepresentationService,
  //   public structureService: StructureService,
  //   public pluginService: PluginService,
  // ) {
  //   // Get plugin instance
  //   const plugin = this.pluginService.plugin;
  //   // Define hover event
  //   const hover$ = plugin.behaviors.interaction.hover;
  //   // Subscribe to representation event
  //   const input$ = this.structureService.structure$.pipe(
  //     // Combine with highlights input
  //     combineLatestWith(this.input$),
  //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //     map(([structure, highlights ]) => ({ structure, highlights})),
  //     // Get all residue identifiers within locus
  //     map(({ structure, highlights }) => {
  //       // Case highlight is defined
  //       if (highlights) {
  //         const ids = [...this.structureService.i2r.values()];
  //         const start = this.structureService.r2i.get(highlights.chain + highlights.start)!;
  //         const end = this.structureService.r2i.get(highlights.chain + highlights.end)!;
  //         // Add residue identifier to current locus
  //         return { structure, highlights: { ...highlights, ids: ids.slice(start, end + 1) } };
  //       }
  //       // Otherwise, return empty locus
  //       return { structure, highlights: { start: '', end: '', chain: '', ids: [] } };
  //     }),
  //     // Apply highlight on given locus
  //     map(({ structure, highlights }) => {
  //       // Case locus is defined
  //       if (highlights.ids.length > 0) {
  //         // Define Mol* loci instance
  //         const loci = getLocusFromSet(highlights.ids, structure);
  //         // Fire highlight event
  //         plugin.managers.interactivity.lociHighlights.highlightOnly({ loci });
  //       }
  //     }),
  //   );
  //   // Subscribe to output event
  //   this.output$ = hover$.pipe(
  //     // Extract current highlights
  //     map((event) => {
  //       // Emit loci from hover event
  //       if (event && event.current.loci.kind === 'element-loci') {
  //         // Check loci type
  //         if (SE.Loci.is(event.current.loci)) {
  //           // Get first
  //           const first = SE.Loci.getFirstLocation(event.current.loci);
  //           // Case first location is defined
  //           if (first) {
  //             // Get chain identifier, sequence identifier, PDB insertion code
  //             const authAsymId = SP.chain.auth_asym_id(first);
  //             const authSeqId = SP.residue.auth_seq_id(first);
  //             const pdbInsCode = SP.residue.pdbx_PDB_ins_code(first);
  //             // Get start, end position
  //             const start = authSeqId + pdbInsCode;
  //             const end = start + '';
  //             // Return loci
  //             return { start, end, chain: authAsymId };
  //           }
  //         }
  //       }
  //       // Emit locus
  //       return undefined;
  //     }),
  //     // // Avoid flooding
  //     // distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
  //     // Cache result
  //     shareReplay(1),
  //   );
  //   // Define output observable
  //   const highlights$ = input$.pipe(
  //     // Subscribe to both input and output
  //     mergeWith(this.output$),
  //     // Return nothing
  //     map(() => void 0),
  //   );
  //   // Subscribe to highlights
  //   this._highlights = highlights$.subscribe();
  // }

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  public ngOnDestroy(): void {
    // this._highlights.unsubscribe();
  }

}
