// Import custom components
import { NgxFeaturesViewerComponent } from '@ngx-features-viewer';
// import { NgxStructureViewerComponent } from 'ngx-structure-viewer';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Component } from '@angular/core';

// Define example sequence
// >sp|P05067|A4_HUMAN Amyloid-beta precursor protein OS=Homo sapiens OX=9606 GN=APP PE=1 SV=3
const P05067 = 'MLPGLALLLLAAWTARALEVPTDGNAGLLAEPQIAMFCGRLNMHMNVQNGKWDSDPSGTK' +
  'TCIDTKEGILQYCQEVYPELQITNVVEANQPVTIQNWCKRGRKQCKTHPHFVIPYRCLVG' +
  'EFVSDALLVPDKCKFLHQERMDVCETHLHWHTVAKETCSEKSTNLHDYGMLLPCGIDKFR' +
  'GVEFVCCPLAEESDNVDSADAEEDDSDVWWGGADTDYADGSEDKVVEVAEEEEVAEVEEE' +
  'EADDDEDDEDGDEVEEEAEEPYEEATERTTSIATTTTTTTESVEEVVREVCSEQAETGPC' +
  'RAMISRWYFDVTEGKCAPFFYGGCGGNRNNFDTEEYCMAVCGSAMSQSLLKTTQEPLARD' +
  'PVKLPTTAASTPDAVDKYLETPGDENEHAHFQKAKERLEAKHRERMSQVMREWEEAERQA' +
  'KNLPKADKKAVIQHFQEKVESLEQEAANERQQLVETHMARVEAMLNDRRRLALENYITAL' +
  'QAVPPRPRHVFNMLKKYVRAEQKDRQHTLKHFEHVRMVDPKKAAQIRSQVMTHLRVIYER' +
  'MNQSLSLLYNVPAVAEEIQDEVDELLQKEQNYSDDVLANMISEPRISYGNDALMPSLTET' +
  'KTTVELLPVNGEFSLDDLQPWHSFGADSVPANTENEVEPVDARPAADRGLTTRPGSGLTN' +
  'IKTEEISEVKMDAEFRHDSGYEVHHQKLVFFAEDVGSNKGAIIGLMVGGVVIATVIVITL' +
  'VMLKKKQYTSIHHGVVEVDAAVTPEERHLSKMQQNGYENPTYKFFEQMQN';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NgxFeaturesViewerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  // TODO Define demo title
  title = 'ngx-bio-tools';

  // Define sequence (features viewer)
  public readonly sequence = P05067.split('');

  // Define features (features viewer)
  public readonly features = [
    { id: 0, type: 'continuous' as const, color: 'blue', values: this.sequence.map(() => Math.random()), parent: undefined, height: 128 },
    { id: 1, type: 'loci' as const, color: 'red', values: [{ start: 1, end: 3 }, { start: 5, end: 6 }], parent: undefined, height: 96 },
    { id: 2, type: 'pins' as const, color: 'green', values: [{ start: 5 }, { start: 100, color: 'blue' }, { start: 400, color: 'red' }], parent: 1 },
    { id: 3, type: 'loci' as const, color: 'orange', values: [{ start: 10, end: 20 }, { start: 30, end: 70 }], parent: 1 },
    { id: 4, type: 'loci' as const, color: 'purple', values: [{ start: 100, end: 300 }], parent: undefined },
    { id: 5, type: 'dssp' as const, color: 'black', values: [{ start: 30, end: 90, code: 'H' as const, color: 'orange' }, { start: 120, end: 300, code: 'E' as const, color: 'purple' }], parent: undefined },
  ];
}
