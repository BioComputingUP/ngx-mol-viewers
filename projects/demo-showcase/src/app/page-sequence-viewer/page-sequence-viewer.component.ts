import { NgxSequenceViewerComponent, Loci, Colors } from '@ngx-sequence-viewer';
import { StructureService, Source } from '@ngx-structure-viewer';
import { CommonModule, Location } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

// const P05067 = `
//   >sp|P05067|A4_HUMAN Amyloid-beta precursor protein OS=Homo sapiens OX=9606 GN=APP PE=1 SV=3
//   MLPGLALLLLAAWTARALEVPTDGNAGLLAEPQIAMFCGRLNMHMNVQNGKWDSDPSGTK
//   TCIDTKEGILQYCQEVYPELQITNVVEANQPVTIQNWCKRGRKQCKTHPHFVIPYRCLVG`;

// const P05067 = `
//   >sp|P05067|A4_HUMAN Amyloid-beta precursor protein OS=Homo sapiens OX=9606 GN=APP PE=1 SV=3
//   MLPGLALLLLAAWTARALEVPTDGNAGLLAEPQIAMFCGRLNMHMNVQNGKWDSDPSGTK
//   TCIDTKEGILQYCQEVYPELQITNVVEANQPVTIQNWCKRGRKQCKTHPHFVIPYRCLVG
//   EFVSDALLVPDKCKFLHQERMDVCETHLHWHTVAKETCSEKSTNLHDYGMLLPCGIDKFR
//   GVEFVCCPLAEESDNVDSADAEEDDSDVWWGGADTDYADGSEDKVVEVAEEEEVAEVEEE
//   EADDDEDDEDGDEVEEEAEEPYEEATERTTSIATTTTTTTESVEEVVREVCSEQAETGPC
//   RAMISRWYFDVTEGKCAPFFYGGCGGNRNNFDTEEYCMAVCGSAMSQSLLKTTQEPLARD
//   PVKLPTTAASTPDAVDKYLETPGDENEHAHFQKAKERLEAKHRERMSQVMREWEEAERQA
//   KNLPKADKKAVIQHFQEKVESLEQEAANERQQLVETHMARVEAMLNDRRRLALENYITAL
//   QAVPPRPRHVFNMLKKYVRAEQKDRQHTLKHFEHVRMVDPKKAAQIRSQVMTHLRVIYER
//   MNQSLSLLYNVPAVAEEIQDEVDELLQKEQNYSDDVLANMISEPRISYGNDALMPSLTET
//   KTTVELLPVNGEFSLDDLQPWHSFGADSVPANTENEVEPVDARPAADRGLTTRPGSGLTN
//   IKTEEISEVKMDAEFRHDSGYEVHHQKLVFFAEDVGSNKGAIIGLMVGGVVIATVIVITL
//   VMLKKKQYTSIHHGVVEVDAAVTPEERHLSKMQQNGYENPTYKFFEQMQN`;

@Component({
  selector: 'app-page-sequence-viewer',
  standalone: true,
  imports: [CommonModule, NgxSequenceViewerComponent ],
  providers: [StructureService],
  templateUrl: './page-sequence-viewer.component.html',
  styleUrl: './page-sequence-viewer.component.scss'
})
export class PageSequenceViewerComponent implements OnDestroy {

  public index!: Array<string>;

  // readonly sequence = P05067.replace(/[\r\n]+[\s\t]*/g, '\n').trim();
  public sequence!: Array<string>;

  readonly source: Source;

  // Define example loci
  readonly loci: Loci<number> = [
    { start: 12, end: 43, type: 'range', background: '#007A78', color: '#FFC745' },
    { start: 57, end: 58, type: 'range', background: '#BDE673', color: '#000000' }
  ]

  // Define color scheme
  readonly colors = Colors.ClustalX;

  public structure$ = this.structureService.structure$;

  protected _structure: Subscription;

  constructor(
    public structureService: StructureService,
    public location: Location,
  ) {
    // Subscribe to structure retrieval, in order to not loose emission
    this._structure = this.structure$.subscribe(() => {
      // Define sequence by extracting residue names
      this.sequence = this.structureService.residues.map(({ authCompId1 }) => authCompId1);
      // Define index by extracting residue identifier
      this.index = [...this.structureService.r2i.keys()];
    });
    // Define link to structure file
    const link = this.location.prepareExternalUrl('assets/8vap.A.cif');
    // Emit source
    this.source = this.structureService.source = { 
      type: 'remote', 
      label: '8VAP', 
      binary: false, 
      format: 'mmcif',
      link
    };
  }
  
  public ngOnDestroy(): void {
    this._structure.unsubscribe();
  }

}
