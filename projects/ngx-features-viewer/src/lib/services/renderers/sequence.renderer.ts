import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { Sequence, sequenceColors } from '../../sequence';
import { InitializeService } from '../initialize.service';

import { SequenceContainer } from '../../trace';

@Injectable({ providedIn: 'platform' })
export class SequenceRenderer {
  public sequenceCharWidth = 0.0;
  public featureLabelCharWidth = 0.0;
  
  public 'group.residues'!: SequenceContainer;
  public 'group.dots'!: SequenceContainer;

  constructor(private initializeService: InitializeService) {}

  public calculateCharWidth() {
    const settings = this.initializeService.settings;
    
    // Get the width of the character 'A' in the sequence
    const text = this.initializeService.draw
      .append('text')
      .attr('class', 'sequence')
      .text('A');
    const bbox = text.node()!.getBBox();
    this.sequenceCharWidth = bbox.width;
    text.remove();

    // Get the width of the character 'A' in the feature label
    const text2 = this.initializeService.draw
      .append('text')
      .attr('class', 'feature')
      .text('A');
    const bbox2 = text2.node()!.getBBox();
    this.featureLabelCharWidth = bbox2.width;
    text2.remove();

    // Get the width of the character 'A' in the x-axis
    const text3 = this.initializeService.draw
      .append('text')
      .attr('class', 'tick')
      .text('A');
    const bbox3 = text3.node()!.getBBox();
    const xAxisXCharHeight = bbox3.height;
    text3.remove();

    // Update the margin bottom to accommodate at least the height of the character of the x-axis
    if (settings['x-axis-show'] !== false) {
      settings['margin-bottom'] = Math.max(
        settings['margin-bottom'],
        xAxisXCharHeight + 6
      );
    }
  }

  public createSequence(sequence: Sequence) {
    // Initialize residues group
    const group = this.initializeService.draw
      // Select previous residues group
      .selectAll<SVGGElement, Sequence>('g.sequence')
      // Bind residues group to sequence
      .data<Sequence>([sequence])
      // Create current residues group
      .join('g')
      .attr('class', 'sequence');

    // Create residues container inside the sequence group
    this['group.residues'] = group.append('g').attr('class', 'residues');
    this['group.dots'] = group.append('g').attr('class', 'dots');
  }

  public updateSequence() {
    // Get the sequence and from the sequence the residues
    const sequence = this.initializeService.sequence;
    const settings = this.initializeService.settings;
    const residues = parseSequence(sequence);

    // The list of residues can be empty in the case the sequence is a length only
    if (residues.length === 0 || settings['sequence-show'] === false) {
      return;
    }

    // Get scale (x, y axis)
    const { x, y } = this.initializeService.scale;
    // Get line height
    const lh = settings['line-height'];
    const cs = settings['content-size'];
    // Define container/cell width and (maximum) text width
    const cellWidth = x(1) - x(0);
    // Get maximum character width
    const charWidth = this.sequenceCharWidth;
    // Define residues group
    const residuesContainer = this['group.residues'];
    const dotsContainer = this['group.dots'];

    const domainStart = x.domain()[0] + 0.5;
    const domainEnd = x.domain()[1];

    if (charWidth + 0.5 > cellWidth) {
      // Remove residues if dots are to be shown
      residuesContainer.selectAll('*').remove();

      // Calculate number of dots needed
      const domainLength = domainEnd - domainStart;

      // Calculate how many cells are needed for each dot
      const spacing = 2;
      const bits = (domainLength * cellWidth) / charWidth / spacing;
      const bitSize = domainLength / bits + 1;

      const xPositions = d3
        .range(domainStart, domainEnd, bitSize)
        .map((i) => x(i + bitSize / 2));

      // Create or update dots
      dotsContainer
        .selectAll('text.dot')
        .data(xPositions)
        .join('text')
        .attr('class', 'dot')
        .text('.')
        .attr('x', (d) => d)
        .attr('y', y('sequence') + lh / 2)
        .attr('width', charWidth)
        .attr('height', lh)
        .attr('dominant-baseline', 'central')
        .style('text-anchor', 'middle');
    } else {
      // Ensure dots are removed if residues are to be shown
      this['group.dots'].selectAll('*').remove();

      const domainStartFloor = Math.floor(domainStart + 0.5);
      const domainEndCeil = Math.min(Math.ceil(domainEnd), residues.length);

      const visibleResidues = residues.slice(
        Math.max(0, domainStartFloor - 1),
        domainEndCeil
      );

      // Create the visible residues inside the residues container as rect with the color of the residue
      if (settings['sequence-background-color']) {
        const color = (d: any) =>
          sequenceColors[settings['sequence-background-color']!][d as never] ||
          sequenceColors[settings['sequence-background-color']!].X;
        let height;
        let yValue: number = y('sequence');

        switch (settings['sequence-background-height']) {
          case '100%':
            height = '100%';
            break;
          case 'content-size':
            height = cs;
            yValue += (lh - cs) / 2;
            break;
          case 'line-height':
            height = lh;
            break;
          default:
            height = cs;
        }

        residuesContainer
          .selectAll('rect.residue')
          .data(visibleResidues)
          .join('rect')
          .attr('class', 'residue')
          .attr('x', (d, i) => x(i + domainStartFloor - 0.5))
          .attr('y', yValue)
          .attr('width', cellWidth)
          .attr('height', height)
          .attr('fill', color)
          .attr('fill-opacity', settings['sequence-background-opacity'] || 0.5);
      }

      // Create the visible residues inside the residues container as text elements
      residuesContainer
        .selectAll('text.residue')
        .data(visibleResidues)
        .join('text')
        .attr('class', 'residue')
        .text((d) => '' + d)
        .attr('x', (d, i) => x(i + domainStartFloor))
        .attr('y', y('sequence') + lh / 2)
        .attr('dominant-baseline', 'central')
        .style('text-anchor', 'middle');
    }

    const textColor = settings['text-color'];
    // Update the residue and dots color always
    residuesContainer.selectAll('text.residue').attr('fill', textColor);
    dotsContainer.selectAll('text.dot').attr('fill', textColor);
  }
}

function parseSequence(sequence: Sequence): string[] {
  const residues: string[] = [];
  // Case sequence is an array
  if (Array.isArray(sequence)) {
    // Update residues list
    residues.push(...sequence);
  }
  // Case sequence is a string
  else if (typeof sequence === 'string') {
    // Update residues list
    residues.push(...sequence.split(''));
  }
  return residues;
}
