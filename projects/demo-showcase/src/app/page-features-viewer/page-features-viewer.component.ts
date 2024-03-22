import { NgxFeaturesViewerComponent, Hierarchy, Settings } from '@ngx-features-viewer';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// // Define example sequence
// // >sp|P05067|A4_HUMAN Amyloid-beta precursor protein OS=Homo sapiens OX=9606 GN=APP PE=1 SV=3
// const P05067 = 'MLPGLALLLLAAWTARALEVPTDGNAGLLAEPQIAMFCGRLNMHMNVQNGKWDSDPSGTK' +
//   'TCIDTKEGILQYCQEVYPELQITNVVEANQPVTIQNWCKRGRKQCKTHPHFVIPYRCLVG' +
//   'EFVSDALLVPDKCKFLHQERMDVCETHLHWHTVAKETCSEKSTNLHDYGMLLPCGIDKFR' +
//   'GVEFVCCPLAEESDNVDSADAEEDDSDVWWGGADTDYADGSEDKVVEVAEEEEVAEVEEE' +
//   'EADDDEDDEDGDEVEEEAEEPYEEATERTTSIATTTTTTTESVEEVVREVCSEQAETGPC' +
//   'RAMISRWYFDVTEGKCAPFFYGGCGGNRNNFDTEEYCMAVCGSAMSQSLLKTTQEPLARD' +
//   'PVKLPTTAASTPDAVDKYLETPGDENEHAHFQKAKERLEAKHRERMSQVMREWEEAERQA' +
//   'KNLPKADKKAVIQHFQEKVESLEQEAANERQQLVETHMARVEAMLNDRRRLALENYITAL' +
//   'QAVPPRPRHVFNMLKKYVRAEQKDRQHTLKHFEHVRMVDPKKAAQIRSQVMTHLRVIYER' +
//   'MNQSLSLLYNVPAVAEEIQDEVDELLQKEQNYSDDVLANMISEPRISYGNDALMPSLTET' +
//   'KTTVELLPVNGEFSLDDLQPWHSFGADSVPANTENEVEPVDARPAADRGLTTRPGSGLTN' +
//   'IKTEEISEVKMDAEFRHDSGYEVHHQKLVFFAEDVGSNKGAIIGLMVGGVVIATVIVITL' +
//   'VMLKKKQYTSIHHGVVEVDAAVTPEERHLSKMQQNGYENPTYKFFEQMQN';

// // >sp|P04637|P53_HUMAN Cellular tumor antigen p53 OS=Homo sapiens OX=9606 GN=TP53 PE=1 SV=4
// const P04637 = 'MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSP' +
//   'DDIEQWFTEDPGPDEAPRMPEAAPPVAPAPAAPTPAAPAPAPSWPLS' +
//   'SSVPSQKTYQGSYGFRLGFLHSGTAKSVTCTYSPALNKMFCQLAKTC' +
//   'PVQLWVDSTPPPGTRVRAMAIYKQSQHMTEVVRRCPHHERCSDSDGL' +
//   'APPQHLIRVEGNLRVEYLDDRNTFRHSVVVPYEPPEVGSDCTTIHYN' +
//   'YMCNSSCMGGMNRRPILTIITLEDSSGNLLGRNSFEVRVCACPGRDR' +
//   'RTEEENLRKKGEPHHELPPGSTKRALPNNTSSSPQPKKKPLDGEYFT' +
//   'LQIRGRERFEMFRELNEALELKDAQAGKEPGGSRAHSSHLKSKKGQS' +
//   'TSRHKKLMFKTEGPDSD';

// // Define function for generating locus
// function locus(start: number, end?: number, color?: string) {
//   // Return locus
//   return { start, end: end !== undefined ? end : start, color };
// }

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
  // Define input settings
  readonly settings: Settings = {
    // Define height
    "line-height": 24,
    "content-size": 16,
    // Define color
    "background-color": '',
    "trace-color": "",
    // Define margins
    "margin-top": 24,
    "margin-right": 24,
    "margin-bottom": 24,
    "margin-left": 128,
  };
  // Define input sequence
  readonly sequence = ['M', 'E', 'E', 'P', 'Q'];
  // Define input features
  readonly features: Hierarchy = [
    {
      label: 'Feature #1', 
      type: 'continuous', 
      values: [1.2, 2.7, 5.4, 2.8, 3.7 ]
    },
    {
      label: 'Feature #2', 
      type: 'loci', 
      values: [{start: 1, end: 3}, {start: 4, end: 5}]
    },
    // Test trace
    {
      label: 'Feature #3', 
      type: 'trace', 
      position: 'overlap', 
      values: [
        {type: 'loci', values: [{start: 3, end: 5}]},
        {type: 'loci', values: [{start: 1, end: 4}]},
        {type: 'continuous', values: [3.2, 1.1, 0.7, 0.9, 2.2]},
      ]
    },
    // Test nested
    {
      label: 'Feature #4', 
      type: 'loci', 
      values: [{start: 1, end: 2}, {start: 3, end: 4}], 
      nested: [
        { 
          label: 'Feature #5', 
          type: 'trace', 
          values: [
            {type: 'loci', values: [{start: 1, end: 1}, {start: 2, end: 5}]},
            {type: 'loci', values: [{start: 2, end: 4}]},
          ] 
        },
        {
          label: 'Feature #6',
          type: 'continuous',
          values: [0.2, 1.1, 3.7, 2.8, 2.9],
        }
      ]
    }
  ];

}
