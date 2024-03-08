import { NgxFeaturesViewerComponent, Features } from '@ngx-features-viewer';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Loci } from '@ngx-structure-viewer';

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

// >sp|P04637|P53_HUMAN Cellular tumor antigen p53 OS=Homo sapiens OX=9606 GN=TP53 PE=1 SV=4
const P04637 = 'MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSP' +
  'DDIEQWFTEDPGPDEAPRMPEAAPPVAPAPAAPTPAAPAPAPSWPLS' +
  'SSVPSQKTYQGSYGFRLGFLHSGTAKSVTCTYSPALNKMFCQLAKTC' +
  'PVQLWVDSTPPPGTRVRAMAIYKQSQHMTEVVRRCPHHERCSDSDGL' +
  'APPQHLIRVEGNLRVEYLDDRNTFRHSVVVPYEPPEVGSDCTTIHYN' +
  'YMCNSSCMGGMNRRPILTIITLEDSSGNLLGRNSFEVRVCACPGRDR' +
  'RTEEENLRKKGEPHHELPPGSTKRALPNNTSSSPQPKKKPLDGEYFT' +
  'LQIRGRERFEMFRELNEALELKDAQAGKEPGGSRAHSSHLKSKKGQS' +
  'TSRHKKLMFKTEGPDSD';

// Define function for generating locus
function locus(start: number, end?: number, color?: string) {
  // Return locus
  return { start, end: end !== undefined ? end : start, color };
}

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
  readonly height = 36;
  // Define input sequence
  readonly sequence = P04637.split('');
  // Define input features
  readonly features: Features = [
    // {
    //   id: 0,
    //   label: '',
    //   type: 'continuous',
    //   color: 'blue',
    //   values: this.sequence.map(() => Math.random()),
    //   height: 128
    // },
    // {
    //   id: 1,
    //   type: 'loci',
    //   color: 'red',
    //   values: [
    //     { start: 1, end: 3 },
    //     { start: 5, end: 6 }
    //   ],
    //   height: 96
    // },
    // {
    //   id: 2,
    //   type: 'pins',
    //   color: 'green',
    //   values: [
    //     { start: 5 },
    //     { start: 100, color: 'blue' },
    //     { start: 400, color: 'red' }
    //   ],
    //   parent: 1
    // },
    // {
    //   id: 3,
    //   type: 'loci',
    //   color: 'orange',
    //   values: [
    //     { start: 10, end: 20 },
    //     { start: 30, end: 70 }
    //   ],
    //   parent: 1
    // },
    // {
    //   id: 4,
    //   type: 'loci',
    //   color: 'purple',
    //   values: [
    //     { start: 100, end: 300 }
    //   ],
    // },
    // {
    //   id: 5,
    //   type: 'dssp',
    //   color: 'black',
    //   values: [
    //     { start: 30, end: 90, code: 'H', color: 'orange' },
    //     { start: 120, end: 300, code: 'E', color: 'purple' }
    //   ],
    // },
    {
      id: 0,
      type: 'loci',
      label: 'Linear Interacting Peptide (LIP)',
      color: '#9900ff',
      values: [
        locus(1, 93), locus(94, 95), locus(106, 115), locus(132, 141),
        locus(145, 154), locus(232, 239), locus(251, 258), locus(265, 277),
        locus(319, 325), locus(326, 356), locus(357, 357), locus(358, 393),
      ]
    },
    {
      id: 1,
      type: 'loci',
      label: 'Binding mode',
      color: '#ff00e6',
      values: [
        locus(27, 39, '#ff00e6'), locus(70, 87, '#ff00e6'),
        locus(298, 324, '#6094e5'), locus(357, 381, '#6094e5'),
      ],
    },
    {
      id: 2,
      type: 'continuous',
      label: 'AlphaFold',
      color: '#bf60ff',
      values: new Array(this.sequence.length).fill(0.0).map(() => Math.random()),
    },
    {
      id: 3,
      type: 'loci',
      label: 'AlphaFold-lip',
      color: '#bf60ff',
      values: [
        locus(14, 28), locus(74, 88), locus(90, 95), locus(319, 341), locus(348, 357)
      ],
      // Define parent loci
      parent: 2
    },
    {
      id: 4,
      type: 'loci',
      label: 'Interactions (PDB)',
      color: '#2069db',
      values: [
        locus(8, 8), locus(11, 13), locus(15, 15), locus(17, 30), locus(36, 39), locus(41, 41), locus(43, 57),
        locus(60, 61), locus(66, 66), locus(70, 70), locus(88, 90), locus(93, 97), locus(99, 101), locus(103, 107),
        locus(109, 116), locus(118, 124), locus(126, 126), locus(128, 129), locus(131, 131), locus(138, 140),
        locus(145, 146), locus(148, 151), locus(156, 157), locus(162, 162), locus(164, 188), locus(190, 192),
        locus(197, 202), locus(204, 204), locus(206, 207), locus(209, 215), locus(221, 221), locus(224, 228),
        locus(230, 231), locus(233, 233), locus(237, 244), locus(246, 249), locus(259, 265), locus(267, 267),
        locus(273, 273), locus(275, 277), locus(280, 280), locus(282, 285), locus(287, 290), locus(292, 292),
        locus(323, 338), locus(340, 352), locus(354, 354), locus(356, 356), locus(360, 360), locus(362, 362),
        locus(364, 373), locus(375, 375), locus(377, 377), locus(379, 388), locus(390, 390), locus(392, 393),
      ]
    },
  ];

  constructor() {
    // Generate child features
    const parent = this.features[4];
    // Define number of child nodes
    const n = parent.values.length;
    // Generate 20 children
    for (let i = 0; i < 20; i++) {
      // Define random number of child loci
      const m = Math.floor(Math.random() * n);
      // Get random loci
      const loci = parent.values.filter(() => Math.random() > (m / n));
      // Define child component
      this.features.push({
        id: i + 5,
        type: 'loci',
        color: '#bf60ff',
        label: 'P' + Math.random().toString(36).slice(2, 7).toUpperCase(),
        values: loci as never,
        // Set parent loci
        parent: 4,
      });
    }
  }
}
