import {NgxFeaturesViewerComponent, NgxFeaturesViewerLabelDirective, Settings} from '@ngx-features-viewer';
import {ChangeDetectionStrategy, Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Traces} from "../../../../ngx-features-viewer/src/lib/trace";
import { DSSPCode } from '../../../../ngx-features-viewer/src/lib/features/dssp';
import {FeatureType} from "../../../../ngx-features-viewer/src/lib/features/feature";

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
    'margin-left': 140,
  };
  // Define input sequence
  readonly sequence = Array.from(P04637.slice(0, 65));

  readonly traceOptions =  {
    "grid": false,
    "grid-line-color": "gray",
    "grid-line-width": 0.5,
    "grid-y-values": [],
    "content-size": 30,
    "line-height": 40,
    "zero-line": true,
    "zero-line-color": "black",
    "zero-line-width": 1,
  }

  traces: Traces = [{
    label: "Trace 1",
    options: this.traceOptions,
    features: [],
    nested: [{
        label: "Nested Trace",
        options: this.traceOptions,
        features: [],
      }
    ]
  }]

  constructor() {
    // Add to the first trace 20 DSSP regions, with an increasing start and end, different dssp codes, and a different color
    // for each dssp code
    this.traces[0].features = Array.from({length: 50}, (_, i) => ({
      type: 'dssp',
      start: i * 3 + 1,
      end: i * 3 + 3,
      opacity: 1,
      color: `rgb(${i * 10}, ${i * 5}, ${i * 3})`,
      code: ['H', 'E', 'C'][i % 3] as DSSPCode
    }));

    // @ts-ignore
    this.traces[0].nested! = Array.from( {length: 10}, (_, i) => ({
      label: "Nested Trace",
      options: this.traceOptions,
      features: Array.from({length: 50}, (_, i) => ({
        type: ['dssp', 'locus', 'pin'][i % 3] as FeatureType,
        position: i * 3 + 2,
        radius: 10,
        opacity: 1,
        start: i * 3 + 1,
        end: i * 3 + 3,
        color: `rgb(${i * 10}, ${i * 5}, ${i * 3})`,
        code: ['H', 'E', 'C'][i % 3] as DSSPCode
      }))
    }))
  }

  test($event: MouseEvent, trace: any) {
    console.log('test', $event, trace)
  }

  updateContentSize($event: Event, label: string | undefined) {
    if (label) {
      this.traces = this.traces.map((trace) => {
        if (trace.label === label) {
          if (trace.options) {
            trace.options['content-size'] = +($event.target as HTMLInputElement).value;
          }
        }
        return trace;
      });
    }
  }

  getTraceContentSize(label: string | undefined): number {
    const trace = this.traces.find((trace) => trace.label === label)!;
    return trace ? (trace.options ? trace.options['content-size']! : 0) : 0;
  }
}
