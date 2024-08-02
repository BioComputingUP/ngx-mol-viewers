import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  NgxFeaturesViewerComponent,
  NgxFeaturesViewerLabelDirective,
  NgxFeaturesViewerTooltipDirective,
  SelectionContext,
  Sequence,
  Settings,
  Trace,
} from '@ngx-features-viewer';
import { delay, map, Observable, of, shareReplay } from 'rxjs';
import { ThemeSelectorService } from '../theme-selector/theme-selector.service';

// >sp|P04637|P53_HUMAN Cellular tumor antigen p53 OS=Homo sapiens OX=9606 GN=TP53 PE=1 SV=4
const P04637 = 'MEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQETFSMEEPQSDPSVEPPLSQE';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector : 'page-features-viewer',
  // Handle dependencies
  imports : [
    NgxFeaturesViewerTooltipDirective,
    NgxFeaturesViewerLabelDirective,
    NgxFeaturesViewerComponent,
    CommonModule,
  ],
  standalone : true,
  // Handle representation
  templateUrl : './page-features-viewer.component.html',
  styleUrl : './page-features-viewer.component.scss',
  // Handle changes
  changeDetection : ChangeDetectionStrategy.OnPush,
})
export class PageFeaturesViewerComponent {

  public settings: Settings = {
    // Define height
    'line-height' : 48,
    'content-size' : 32,
    // Define color
    'background-color' : 'transparent',
    'plot-background-color' : 'transparent',
    'grid-line-color' : 'rgb(213,255,0)',
    'text-color' : 'black',
    // Define margins
    'margin-top' : 0,
    'margin-right' : 90,
    'margin-bottom' : 0,
    'margin-left' : 270,
    'sequence-show' : true,
    'sequence-background-color' : undefined,
    'sequence-background-height' : '100%',
    'x-axis-show' : true,
  };

  public settings$: Observable<Settings>;

  // Define input sequence
  // readonly sequence = Array.from(P04637);
  readonly sequence: Sequence = P04637;

  traces: Trace[];

  readonly curvePoints = Array.from({length : 240}, () => Math.floor(Math.random() * 100) + 30);
  public traceButtonClicked: string | null = null;
  public featureSelected: SelectionContext | null = null;

  x$: Observable<boolean> = of(true).pipe(delay(3000));

  constructor(public themeSelectorService: ThemeSelectorService) {
    // Define theme retrieval pipeline
    const theme$ = this.themeSelectorService.theme$;
    // Define the settings observable
    this.settings$ = theme$.pipe(
      // Get theme from document
      map(() => document.documentElement.getAttribute('data-bs-theme') as 'dark' | 'light'),
      // Map theme to settings
      map((theme) => {
        // Case theme is dark
        if (theme === 'dark') {
          // Then return dark parameters
          return {
            ...this.settings,
            'background-color' : '#272c31',
            'plot-background-color' : '#272c31',
            'text-color' : 'white',
          };
        }
        if (theme === 'light') {
          // Then return dark parameters
          return {
            ...this.settings,
            'background-color' : '#f3f3f3',
            'plot-background-color' : '#efefef',
            'text-color' : 'black',
          };
        }
        // Otherwise, return light parameters
        return this.settings;
      }),
      // Cache results
      shareReplay(1),
    );

    // Set traces
    this.traces = [{
      label : "DSSP Trace",
      options : {
        "grid" : false,
        'margin-top' : 0,
        'margin-bottom' : 50,
        "grid-line-color" : "rgb(223, 213, 245)",
        "grid-line-width" : 1,
        "grid-y-values" : [-1, 1],
        // "content-size": 30,
        // "line-height": 300,
        "zero-line" : true,
        "zero-line-color" : "rgb(223, 213, 245)",
        "zero-line-width" : 1,
      },
      features : [{
        label : "feature-1",
        type : "dssp",
        color : "red",
        start : 1,
        end : 30,
        opacity : 1,
        code : "H",
      }, {
        label : "feature-2",
        type : "dssp",
        color : "blue",
        start : 31,
        end : 55,
        opacity : 1,
        code : "H",
      }, {
        label : "feature-3",
        type : "dssp",
        color : "orange",
        start : 56,
        end : 92,
        opacity : 1,
        code : "C",
      }, {
        label : "feature-4",
        type : "dssp",
        color : "orange",
        start : 93,
        end : 105,
        opacity : 1,
        code : "T",
      }, {
        label : "feature-5",
        type : "dssp",
        color : "pink",
        start : 106,
        end : 140,
        opacity : 1,
        code : "E",
      }, {
        label : "feature-3",
        type : "dssp",
        color : "red",
        start : 141,
        end : 217,
        opacity : 1,
        code : "C",
      }],
    }, {
      label : "Continuous Step",
      expanded : false,
      options : {
        "grid" : true,
        "grid-line-color" : "gray",
        "grid-line-width" : 0.5,
        "grid-y-values" : [65, 130],
        "content-size" : 100,
        'margin-top' : 0,
        "line-height" : 100,
        "zero-line" : true,
        "zero-line-color" : "black",
        "zero-line-width" : 1,
      },
      features : [{
        label : "feature-0",
        type : "continuous",
        values : this.curvePoints,
        min : 30,
        max : 130,
        color : "blue",
        curveType : "curveStep",
        opacity : 0.7,
        showArea : true,
      }],
      nested : [{
        label : "Continuous Basis",
        expanded : false,
        options : {
          "grid" : true,
          "grid-line-color" : "gray",
          "grid-line-width" : 0.5,
          "grid-y-values" : [65, 130],
          "content-size" : 100,
          'margin-top' : 0,
          "line-height" : 100,
          "zero-line" : true,
          "zero-line-color" : "black",
          "zero-line-width" : 1,
        },
        features : [{
          label : "feature-0",
          type : "continuous",
          values : this.curvePoints,
          min : 30,
          max : 130,
          color : "purple",
          curveType : "curveBasis",
          opacity : 0.3,
          showArea : true,
        }],
        nested : [{
          label : "Continuous Basis 2",
          expanded : true,
          options : {
            "grid" : true,
            "grid-line-color" : "gray",
            "grid-line-width" : 0.5,
            "grid-y-values" : [65, 130],
            "content-size" : 100,
            'margin-top' : 0,
            "line-height" : 100,
            "zero-line" : true,
            "zero-line-color" : "black",
            "zero-line-width" : 1,
          },
          features : [{
            label : "feature-0",
            type : "continuous",
            values : this.curvePoints,
            min : 30,
            max : 130,
            color : "purple",
            curveType : "curveBasis",
            opacity : 0.3,
            showArea : true,
          }],
        }],
      }, {
        label : "Continuous Linear No Area",
        options : {
          "grid" : true,
          "grid-line-color" : "gray",
          "grid-line-width" : 0.5,
          "grid-y-values" : [65, 130],
          "content-size" : 100,
          'margin-top' : 0,
          "line-height" : 100,
          "zero-line" : true,
          "zero-line-color" : "black",
          "zero-line-width" : 1,
        },
        features : [{
          label : "feature-0",
          type : "continuous",
          values : this.curvePoints,
          'stroke-width' : 2,
          min : 30,
          max : 130,
          color : "orange",
          curveType : "curveLinear",
          opacity : 0.3,
          showArea : false,
        }],
      }],
    }, {
      label : "Loci Trace",
      options : {
        "grid" : false,
        "margin-top" : 0,
        "margin-bottom" : 0,
        "content-size" : 100,
        "line-height" : 100,
        "zero-line" : true,
        "zero-line-color" : "gray",
        "zero-line-width" : 1,
      },
      features : [{
        label : "feature-1",
        type : "locus",
        color : "purple",
        opacity : 0.5,
        'text-color' : 'white',
        "stroke-color" : "purple",
        "stroke-width" : 4,
        height : 40,
        start : 1,
        end : 50,
      }, {
        label : "feature-2",
        type : "locus",
        color : "red",
        opacity : 0.7,
        "stroke-color" : "firebrick",
        "stroke-width" : 4,
        height : 40,
        start : 55,
        end : 120,
      }, {
        label : "feature-3",
        type : "locus",
        color : "pink",
        opacity : 0.7,
        "stroke-color" : "orange",
        "stroke-width" : 4,
        height : 40,
        start : 140,
        end : 216,
      }],
    }, {
      label : "Poly Fixed",
      options : {
        "grid" : false,
        "margin-top" : 0,
        "margin-bottom" : 0,
        "content-size" : 100,
        "line-height" : 100,
        "zero-line" : true,
        "zero-line-color" : "gray",
        "zero-line-width" : 1,
      },
      features : [{
        label : "triangle",
        type : "poly",
        color : "blue",
        opacity : .7,
        position : 5,
        adjustToWidth : false,
        sides : 3,
        radius : 30,
      }, {
        label : "square",
        type : "poly",
        color : "red",
        opacity : .7,
        position : 40,
        adjustToWidth : false,
        sides : 4,
        radius : 12,
      }, {
        label : "pentagon",
        type : "poly",
        color : "yellow",
        opacity : .7,
        position : 83,
        adjustToWidth : false,
        sides : 5,
        radius : 12,
      }, {
        label : "hexagon",
        type : "poly",
        color : "green",
        adjustToWidth : false,
        opacity : .7,
        position : 120,
        sides : 6,
        radius : 12,
      }, {
        label : "heptagon",
        type : "poly",
        color : "purple",
        opacity : .7,
        position : 177,
        adjustToWidth : false,
        "stroke-width" : 2,
        sides : 7,
        radius : 30,
      }],
      nested : [
        {
          label : "Poly Adaptive",
          options : {
            "grid" : false,
            "margin-top" : 0,
            "margin-bottom" : 0,
            "content-size" : 100,
            "line-height" : 100,
            "zero-line" : true,
            "zero-line-color" : "gray",
            "zero-line-width" : 1,
          },
          features : [{
            label : "triangle",
            type : "poly",
            color : "blue",
            opacity : 1,
            position : 5,
            adjustToWidth : true,
            sides : 3,
            radius : 30,
          }, {
            label : "square",
            type : "poly",
            color : "red",
            opacity : 1,
            position : 40,
            adjustToWidth : true,
            sides : 4,
            radius : 12,
          }, {
            label : "pentagon",
            type : "poly",
            color : "yellow",
            opacity : 1,
            position : 83,
            adjustToWidth : true,
            sides : 5,
            radius : 12,
          }, {
            label : "hexagon",
            type : "poly",
            color : "green",
            adjustToWidth : true,
            opacity : 1,
            position : 120,
            sides : 6,
            radius : 12,
          }, {
            label : "heptagon",
            type : "poly",
            color : "purple",
            opacity : .5,
            position : 177,
            adjustToWidth : true,
            "stroke-width" : 2,
            sides : 7,
            radius : 30,
          },
          ],
        },
      ],
    }, {
      label : "Pins Fixed",
      options : {
        "grid" : false,
        "margin-top" : 0,
        "margin-bottom" : 0,
        "content-size" : 100,
        "line-height" : 100,
        "zero-line" : true,
        "zero-line-color" : "gray",
        "zero-line-width" : 1,
      },
      features : [{
        label : "pin-1",
        type : "pin",
        color : "blue",
        opacity : .7,
        position : 5,
        adjustToWidth : false,
        radius : 30,
      }, {
        label : "pin-2",
        type : "pin",
        color : "red",
        opacity : .7,
        position : 40,
        adjustToWidth : false,
        radius : 12,
      }, {
        label : "pin-3",
        type : "pin",
        color : "yellow",
        opacity : .7,
        position : 83,
        adjustToWidth : false,
        radius : 12,
      }, {
        label : "pin-4",
        type : "pin",
        color : "green",
        adjustToWidth : false,
        opacity : .7,
        position : 120,
        radius : 12,
      }, {
        label : "pin-5",
        type : "pin",
        color : "purple",
        opacity : .7,
        position : 177,
        adjustToWidth : false,
        "stroke-width" : 2,
        radius : 30,
      }],
      nested : [{
        label : "Pins Adaptive",
        options : {
          "grid" : false,
          "margin-top" : 0,
          "margin-bottom" : 0,
          "content-size" : 100,
          "line-height" : 100,
          "zero-line" : true,
          "zero-line-color" : "gray",
          "zero-line-width" : 1,
        },
        features : [{
          label : "pin-1",
          type : "pin",
          color : "blue",
          opacity : .7,
          position : 5,
          adjustToWidth : true,
          radius : 30,
        }, {
          label : "pin-2",
          type : "pin",
          color : "red",
          opacity : .7,
          position : 40,
          adjustToWidth : true,
          radius : 12,
        }, {
          label : "pin-3",
          type : "pin",
          color : "yellow",
          opacity : .7,
          position : 83,
          adjustToWidth : true,
          radius : 12,
        }, {
          label : "pin-4",
          type : "pin",
          color : "green",
          adjustToWidth : true,
          opacity : .7,
          position : 120,
          radius : 12,
        }, {
          label : "pin-5",
          type : "pin",
          color : "purple",
          opacity : .7,
          position : 177,
          adjustToWidth : true,
          "stroke-width" : 2,
          radius : 30,
        }],
      }],
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
    this.featureSelected = $event || null;
  }

  onTraceButtonClick(trace: Trace) {
    this.traceButtonClicked = trace.label || 'Label not defined';
  }

  test(trace: any) {
    console.log(trace);
  }

  includes(trace: any) {
    return trace.label.includes('Trace');
  }
}
