import {NgxFeaturesViewerComponent, NgxFeaturesViewerLabelDirective, Settings} from '@ngx-features-viewer';
import {ChangeDetectionStrategy, Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Traces} from "../../../../ngx-features-viewer/src/lib/trace";

// >sp|P04637|P53_HUMAN Cellular tumor antigen p53 OS=Homo sapiens OX=9606 GN=TP53 PE=1 SV=4
const P04637 = 'MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPMEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPMEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPMEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPMEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPMEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPMEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPMEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPMEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSP';

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
    'text-color': 'black',
    // Define margins
    'margin-top': 24,
    'margin-right': 0,
    'margin-bottom': 24,
    'margin-left': 80,
  };
  // Define input sequence
  readonly sequence = Array.from(P04637);

  traces: Traces = [{
    label: "Trace 1",
    options: {
      "grid": true,
      "grid-line-color": "gray",
      "grid-line-width": 0.5,
      "grid-y-values": [-1, 1],
      "content-size": 30,
      "line-height": 300,
      "zero-line": true,
      "zero-line-color": "black",
      "zero-line-width": 1,
    },
    features: [{
      label: "feature-2",
      type: "dssp",
      color: "red",
      start: 1,
      end: 200,
      opacity: 1,
      code: "H",
    }]
  }, {
    label: "Trace 2",
    options: {
      "grid": true,
      "grid-line-color": "gray",
      "grid-line-width": 0.5,
      "grid-y-values": [65, 130],
      "content-size": 100,
      "line-height": 100,
      "zero-line": true,
      "zero-line-color": "black",
      "zero-line-width": 1,
    },
    features: [{
      label: "feature-0",
      type: "continuous",
      values: Array.from({length: 47}, () => Math.floor(Math.random() * 100) + 30),
      min: 30,
      max: 130,
      color: "blue",
      curveType: "curveBasis",
      showArea: true,
    }, {
      label: "feature-1",
      type: "locus",
      color: "none",
      "stroke-color": "purple",
      "stroke-width": 4,
      height: 80,
      start: 1,
      end: 40,
    }, {
      label: "feature-1",
      type: "locus",
      color: "red",
      opacity: 0.4,
      "stroke-color": "red",
      "stroke-width": 4,
      height: 70,
      start: 20,
      end: 50,
    }]
  }]

  test($event: MouseEvent, trace: any) {
    console.log('test', $event, trace)
  }
}
