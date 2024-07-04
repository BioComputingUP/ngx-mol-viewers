import {
  NgxFeaturesViewerComponent,
  NgxFeaturesViewerLabelDirective,
  NgxFeaturesViewerTooltipDirective,
  SelectionContext,
  Sequence,
  Settings,
  Trace
} from '@ngx-features-viewer';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// >sp|P04637|P53_HUMAN Cellular tumor antigen p53 OS=Homo sapiens OX=9606 GN=TP53 PE=1 SV=4
const P04637 = 'MEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFS';

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
  // readonly sequence = Array.from(P04637);
  readonly sequence: Sequence = {length: P04637.length};

  traces: Trace[];

  constructor() {
    // Define settings for outer Features Viewer component
    const outer = {
      // Define height
      'line-height': 64,
      'content-size': 32,
      // Define color
      'background-color': 'transparent',
      'grid-line-color': 'rgb(213,255,0)',
      'text-color': 'black',
      // Define margins
      'margin-top': 0,
      'margin-right': 0,
      'margin-bottom': 30,
      'margin-left': 140,
    };
    // Define settings for inner Features Viewer component
    const inner = {
      ...outer,
      'margin-left': 80,
      'margin-right': 0,
      'margin-top': 24,
      'margin-bottom': 30,
    };
    // Store settings
    this.settings = {outer, inner};

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
        "zero-line": false,
        "zero-line-color": "black",
        "zero-line-width": 1,
      },
      features: [{
        label: "feature-1",
        type: "dssp",
        color: "red",
        start: 1,
        end: 30,
        opacity: 1,
        code: "H",
      }, {
        label: "feature-2",
        type: "dssp",
        color: "blue",
        start: 31,
        end: 55,
        opacity: 1,
        code: "H",
      }, {
        label: "feature-3",
        type: "dssp",
        color: "orange",
        start: 56,
        end: 80,
        opacity: 1,
        code: "C",
      }, {
        label: "feature-4",
        type: "dssp",
        color: "orange",
        start: 81,
        end: 90,
        opacity: 1,
        code: "T",
      }, {
        label: "feature-5",
        type: "pin",
        adjustToWidth: true,
        color: "orange",
        position: 105,
        opacity: 1,
        radius: 8,
      }],
      nested: [{
        label: "Trace 1.1",
        options: {
          "grid": false,
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
          label: "feature-1",
          type: "dssp",
          color: "violet",
          start: 1,
          end: 30,
          opacity: 1,
          code: "H",
        }, {
          label: "feature-2",
          type: "dssp",
          color: "red",
          start: 31,
          end: 55,
          opacity: 1,
          code: "H",
        }, {
          label: "feature-3",
          type: "dssp",
          color: "green",
          start: 56,
          end: 80,
          opacity: 1,
          code: "C",
        }, {
          label: "feature-3",
          type: "dssp",
          color: "blue",
          start: 81,
          end: 90,
          opacity: 1,
          code: "T",
        }]
      }]
    }, {
      label: "Trace 2",
      options: {
        "grid": true,
        "grid-line-color": "gray",
        "grid-line-width": 0.5,
        "grid-y-values": [65, 130],
        "content-size": 80,
        "line-height": 100,
        "zero-line": true,
        "zero-line-color": "black",
        "zero-line-width": 1,
      },
      features: [{
        label: "feature-0",
        type: "continuous",
        values: Array.from({length: 240}, () => Math.floor(Math.random() * 100) + 30),
        min: 30,
        max: 130,
        color: "blue",
        curveType: "curveStep",
        opacity: 0.3,
        showArea: true,
      }]
    }, {
      label: "Trace 3",
      options: {
        "grid": true,
        "grid-line-color": "gray",
        "grid-line-width": 0.5,
        "grid-y-values": [65, 130],
        "content-size": 80,
        "line-height": 100,
        "zero-line": true,
        "zero-line-color": "black",
        "zero-line-width": 1,
      },
      features: [{
        label: "feature-1",
        type: "locus",
        color: "transparent",
        "stroke-color": "purple",
        "stroke-width": 4,
        height: 40,
        start: 1,
        end: 50,
      }, {
        label: "feature-2",
        type: "poly",
        color: "red",
        opacity: 1,
        position: 73,
        sides: 3,
        radius: 30
      }, {
        label: "feature-2",
        type: "poly",
        color: "red",
        opacity: 1,
        position: 74,
        sides: 4,
        radius: 12
      }, {
        label: "feature-2",
        type: "poly",
        color: "red",
        opacity: 1,
        position: 75,
        sides: 5,
        radius: 12
      }, {
        label: "feature-2",
        type: "poly",
        color: "red",
        opacity: 1,
        position: 76,
        sides: 6,
        radius: 12
      }, {
        label: "feature-2",
        type: "poly",
        color: "purple",
        opacity: .5,
        position: 77,
        "stroke-width": 2,
        sides: 7,
        radius: 30
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

  onFeatureSelected($event: SelectionContext | undefined) {
    //console.log(`Feature selected: ${JSON.stringify($event)}`);
  }
}
