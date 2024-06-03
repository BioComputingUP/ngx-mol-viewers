import { NgxFeaturesViewerLabelDirective, NgxFeaturesViewerComponent, Hierarchy, Settings } from '@ngx-features-viewer';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'page-features-viewer',
  // Handle dependencies
  imports: [
    NgxFeaturesViewerLabelDirective,
    NgxFeaturesViewerComponent,
    CommonModule,],
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
    'line-height': 24,
    'content-size': 16,
    // Define color
    'background-color': 'transparent',
    'trace-color': 'cyan',
    'grid-color': 'rgba(222, 226, 230, 0.5)',
    'text-color': 'white',
    // Define margins
    'margin-top': 24,
    'margin-right': 24,
    'margin-bottom': 24,
    'margin-left': 128,
  };
  // Define input sequence
  readonly sequence = Array.from(P04637.slice(0, 100));
  // Define input features
  readonly features: Hierarchy = [
    {
      label: 'Feature #1',
      type: 'continuous',
      values: Array.from({ length: 70 }, () => Math.floor(Math.random() * 100) + 1)
    },
    {
      label: 'Feature #2',
      type: 'loci',
      "trace-color": "red",
      values: [{ start: 1, end: 50 }, { start: 30, end: 60 }]
    },
    // Test trace
    {
      label: 'Feature #3',
      type: 'trace',
      position: 'overlap',
      values: [
        { type: 'loci', values: [{ start: 1, end: 10 }], "trace-color": "blue", },
        { type: 'loci', values: [{ start: 20, end: 40 }], "trace-color": "red", },
        { type: 'loci', values: [{ start: 60, end: 100 }], "trace-color": "yellow", },
        { type: 'continuous', values: Array.from({ length: 70 }, () => Math.floor(Math.random() * 100) + 1), "trace-color": "yellow", },
      ],
      "background-color": "transparent",
    },
    // Test nested
    {
      label: 'Feature #4',
      type: 'loci',
      values: [{ start: 27, end: 56 }, { start: 61, end: 72 }],
      nested: [
        {
          label: 'Feature #5',
          type: 'trace',
          values: [
            { type: 'loci', values: [{ start: 1, end: 5 }, { start: 6, end: 10 }] },
            { type: 'loci', values: [{ start: 10, end: 27 }] },
          ]
        },
        {
          label: 'Feature #6',
          type: 'continuous',
          values: Array.from({ length: 70 }, () => Math.floor(Math.random() * 100) + 1)
        }
      ]
    },
    {
      label: 'Feature #7',
      type: 'loci',
      values: [{ start: 81, end: 81 }, { start: 82, end: 82 }],
      nested: [
        {
          label: 'Feature #8',
          type: 'trace',
          values: [
            { type: 'loci', values: [{ start: 81, end: 81 }] },
            { type: 'loci', values: [{ start: 82, end: 82 }] },
          ]
        },
        {
          label: 'Feature #9',
          type: 'continuous',
          "trace-color": "greenyellow",
          values: Array.from({ length: 70 }, () => Math.floor(Math.random() * 100) + 1),
        }
      ]
    }
  ];

}
