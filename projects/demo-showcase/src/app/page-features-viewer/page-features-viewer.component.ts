import { NgxFeaturesViewerComponent, NgxFeaturesViewerLabelDirective, NgxFeaturesViewerTooltipDirective, Settings, Trace } from '@ngx-features-viewer';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// >sp|P04637|P53_HUMAN Cellular tumor antigen p53 OS=Homo sapiens OX=9606 GN=TP53 PE=1 SV=4
const P04637 = 'MEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFS';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'page-features-viewer',
  // Handle dependencies
  imports: [
    NgxFeaturesViewerTooltipDirective,
    NgxFeaturesViewerLabelDirective,
    NgxFeaturesViewerComponent,
    CommonModule,
  ],
  standalone: true,
  // Handle representation
  templateUrl: './page-features-viewer.component.html',
  styleUrl: './page-features-viewer.component.scss',
  // Handle changes
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageFeaturesViewerComponent {

  public settings: {
    outer: Settings,   // Define parameters for outer Features Viewer component
    inner: Settings    // Define parameters for inner Features Viewer component
  };

  // Define input sequence
  readonly sequence = Array.from(P04637);

  readonly traces: Trace[];

  // test($event: MouseEvent, trace: unknown) {
  //   console.log('test', $event, trace)
  // }

  constructor() {
    // Define settings for outer Features Viewer component
    const outer = {
      // Define height
      'line-height': 32,
      'content-size': 16,
      // Define color
      'background-color': 'transparent',
      'grid-line-color': 'rgb(213,255,0)',
      'text-color': 'black',
      // Define margins
      'margin-top': 0,
      'margin-right': 0,
      'margin-bottom': 24,
      'margin-left': 80,
    };
    // Define settings for inner Features Viewer component
    const inner = {
      ...outer,
      'margin-left': 80,
      'margin-right': 0,
      'margin-top': 24,
      'margin-bottom': 24,
    };
    // Store settings
    this.settings = { outer, inner };

    // Set traces
    this.traces = [{
      label: "Trace 1",
      options: {
        "grid": true,
        "grid-line-color": "gray",
        "grid-line-width": 0.5,
        "grid-y-values": [-1, 1],
        // "content-size": 30,
        // "line-height": 300,
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
        "content-size": 16,
        "line-height": 32,
        "zero-line": true,
        "zero-line-color": "black",
        "zero-line-width": 1,
      },
      features: [{
        label: "feature-0",
        type: "continuous",
        values: Array.from({ length: 47 }, () => Math.floor(Math.random() * 100) + 30),
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
        // height: 80,
        start: 1,
        end: 40,
      }, {
        label: "feature-1",
        type: "locus",
        color: "red",
        opacity: 0.4,
        "stroke-color": "red",
        "stroke-width": 4,
        // height: 70,
        start: 20,
        end: 50,
      }]
    }]
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
