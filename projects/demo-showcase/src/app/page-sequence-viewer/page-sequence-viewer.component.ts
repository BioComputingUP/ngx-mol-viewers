import { NgxSequenceViewerComponent, Loci, Colors } from '@ngx-sequence-viewer';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

const P05067 = `
  >sp|P05067|A4_HUMAN Amyloid-beta precursor protein OS=Homo sapiens OX=9606 GN=APP PE=1 SV=3
  MLPGLALLLLAAWTARALEVPTDGNAGLLAEPQIAMFCGRLNMHMNVQNGKWDSDPSGTK
  TCIDTKEGILQYCQEVYPELQITNVVEANQPVTIQNWCKRGRKQCKTHPHFVIPYRCLVG`;

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
  templateUrl: './page-sequence-viewer.component.html',
  styleUrl: './page-sequence-viewer.component.scss'
})
export class PageSequenceViewerComponent {

  // Do not define any index

  // Define example sequence
  readonly sequence = P05067.replace(/[\r\n]+[\s\t]*/g, '\n').trim();

  // Define example loci
  readonly loci: Loci<number> = [
    { start: 12, end: 43, type: 'range', background: '#007A78', color: '#FFC745' },
    { start: 57, end: 58, type: 'range', background: '#BDE673', color: '#000000' }
  ]

  // Define color scheme
  readonly colors = Colors.ClustalX;

}
