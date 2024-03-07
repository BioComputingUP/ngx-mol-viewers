import { NgxFeaturesViewerComponent, Features } from '@ngx-features-viewer';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

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
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'page-features-viewer',
  // Handle dependencies
  imports: [CommonModule, NgxFeaturesViewerComponent],
  standalone: true,
  // Handle representation
  templateUrl: './page-features-viewer.component.html',
  styleUrl: './page-features-viewer.component.scss',
  // Handle changes
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageFeaturesViewerComponent {
  // Define default height (in pixel)
  readonly height = 64;
  // Define input sequence
  readonly sequence = P05067.split('');
  // Define input features
  readonly features: Features = [
    {
      id: 0,
      type: 'continuous',
      color: 'blue',
      values: this.sequence.map(() => Math.random()),
      height: 128
    },
    {
      id: 1,
      type: 'loci',
      color: 'red',
      values: [
        { start: 1, end: 3 },
        { start: 5, end: 6 }
      ],
      height: 96
    },
    {
      id: 2,
      type: 'pins',
      color: 'green',
      values: [
        { start: 5 },
        { start: 100, color: 'blue' },
        { start: 400, color: 'red' }
      ],
      parent: 1
    },
    {
      id: 3,
      type: 'loci',
      color: 'orange',
      values: [
        { start: 10, end: 20 },
        { start: 30, end: 70 }
      ],
      parent: 1
    },
    {
      id: 4,
      type: 'loci',
      color: 'purple',
      values: [
        { start: 100, end: 300 }
      ],
    },
    {
      id: 5,
      type: 'dssp',
      color: 'black',
      values: [
        { start: 30, end: 90, code: 'H', color: 'orange' },
        { start: 120, end: 300, code: 'E', color: 'purple' }
      ],
    },
  ];
}
