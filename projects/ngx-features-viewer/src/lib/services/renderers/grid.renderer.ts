import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { BaseType } from 'd3';
import { InternalTrace, InternalTraces, GridLines } from '../../trace';
import { InitializeService } from '../initialize.service';
import { index, identity } from '../draw.service';

@Injectable({ providedIn: 'platform' })
export class GridRenderer {
  public 'group.grid'!: GridLines;

  constructor(private initializeService: InitializeService) {}

  public createGrid(traces: InternalTraces): void {
    const group = this.initializeService.focus
      // Create parent grid element
      .selectAll<SVGGElement, InternalTraces>('g.grid')
      .data<InternalTraces>([traces], index)
      .join('g')
      .attr('class', 'grid')
      .lower();

    this['group.grid'] = group
      .selectAll<SVGGElement | BaseType, InternalTrace>('g.grid-line-group')
      .data<InternalTrace>(traces, identity)
      .join('g')
      .attr('id', (d) => 'grid-' + d.id)
      .attr('class', 'grid-line-group')
      .join('line');

    this['group.grid'].each(function (trace) {
      const traceGroup = d3.select(this);
      // Remove all existing grid lines to force re-render on updates
      traceGroup.selectAll('line.grid-line').remove();
      traceGroup.selectAll('line.zero-line').remove();

      if (trace.options?.['grid']) {
        // In each group of grid lines, create the lines
        traceGroup
          .selectAll('line.grid-line')
          .data(trace.options?.['grid-y-values'] || [])
          .enter()
          .append('line')
          .attr('class', 'grid-line')
          .style('shape-rendering', 'crispedges')
          .attr('id', (d, i) => 'grid-line-' + i);
      }

      // Create initial zero-line if defined
      if (trace.options?.['zero-line']) {
        // Create zero line
        traceGroup
          .selectAll('line.zero-line')
          .data([true])
          .enter()
          .append('line')
          .attr('class', 'zero-line')
          .style('shape-rendering', 'crispedges')
          .attr('id', 'zero-line');
      }
    });
  }

  public updateGrid(): void {
    if (!this['group.grid']) return;
    const group: GridLines = this['group.grid'];

    const y = this.initializeService.scale.y;
    const settings = this.initializeService.settings;
    const x1 = this.initializeService.x1;
    const x2 = this.initializeService.x2;

    group.each(function (trace: InternalTrace) {
      const traceGroup = d3.select(this);

      // Get all the necessary values to compute the position of the grid lines
      const mt = y('' + trace.id) || 0;
      const lh = trace.options?.['line-height'] || settings['line-height'];
      const cs = trace.options?.['content-size'] || settings['content-size'];

      // top is calculated as the distance to the top, plus the lh/2 to get the mid-point of the line, plus the cs/2 to get the bottom of the line
      const bottom = mt + lh / 2 + cs / 2;
      const top = mt + lh / 2 - cs / 2;

      function rescaleY(yValue: number): number {
        // top and bottom are actually switched, as the y-axis is inverted
        return (
          bottom +
          ((yValue - trace.domain.min) /
            (trace.domain.max - trace.domain.min)) *
            (top - bottom)
        );
      }

      // Update grid lines
      traceGroup
        .selectAll('line.grid-line')
        .data(trace.options?.grid ? trace.options?.['grid-y-values'] || [] : [])
        .attr('x1', x1)
        .attr('x2', x2)
        .attr('y1', (d: any) => rescaleY(d))
        .attr('y2', (d: any) => rescaleY(d))
        .attr(
          'stroke',
          trace.options?.['grid-line-color'] || settings['grid-line-color']
        )
        .attr('stroke-width', trace.options?.['grid-line-width'] || 1);

      // Update zero-line if defined
      traceGroup
        .selectAll('line.zero-line')
        .data(trace.options?.['zero-line'] ? [true] : [])
        .attr('x1', x1)
        .attr('x2', x2)
        .attr('y1', rescaleY(0))
        .attr('y2', rescaleY(0))
        .attr('stroke', trace.options?.['zero-line-color'] || 'black')
        .attr('stroke-width', trace.options?.['zero-line-width'] || 1);
    });
  }
}
