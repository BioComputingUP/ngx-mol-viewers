import {NgxFeaturesViewerComponent, NgxFeaturesViewerLabelDirective, Settings} from '@ngx-features-viewer';
import {ChangeDetectionStrategy, Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Traces} from "../../../../ngx-features-viewer/src/lib/trace";

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
    'line-height': 32,
    'content-size': 16,
    // Define color
    'background-color': 'transparent',
    'grid-line-color': 'rgb(213,255,0)',
    'text-color': 'white',
    // Define margins
    'margin-top': 24,
    'margin-right': 128,
    'margin-bottom': 24,
    'margin-left': 128,
  };
  // Define input sequence
  readonly sequence = Array.from(P04637.slice(0, 100));

  traces: Traces = [{
    label: "Trace 1",
    options: {
      "grid-line": true,
      "grid-line-color": "yellow",
      "grid-line-width": 1,
      "grid-y-values": [0, 50, 100],
      "content-size": 80,
      "line-height": 100
    },
    features: [{
      label: "feature-0",
      type: "continuous",
      values: Array.from({length: 100}, () => Math.floor(Math.random() * 100) + 1),
      min: 1,
      max: 100,
      color: "red",
    }, {
      label: "feature-1",
      type: "locus",
      color: "blue",
      start: 10,
      end: 20,
    }, {
      label: "feature-2",
      type: "locus",
      color: "green",
      start: 1,
      end: 10,
    }, {
      label: "feature-3",
      type: "continuous",
      color: "purple",
      values: Array.from({length: 100}, () => Math.floor(Math.random() * 100) + 1),
    }],
    nested: [{
      label: "Trace 2",
      features: [{
        label: "feature-0",
        type: "continuous",
        color: "orange",
        min: 0,
        max: 100,
        values: Array.from({length: 100}, () => Math.floor(Math.random() * 100) + 1),
      }],
      nested: [{
        label: "Trace 3",
        options: {"line-height": 100, "content-size": 100},
        features: [{
          label: "feature-0",
          type: "continuous",
          color: "green",
          min: 0,
          max: 100,
          values: Array.from({length: 100}, () => Math.floor(Math.random() * 100) + 1),
        }]
      }]
    }]
  }]

  test($event: MouseEvent, trace: any) {
    console.log('test', $event, trace)
  }
}
