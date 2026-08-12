import * as d3 from 'd3';
import { FeatureStrategy, FeatureRenderOptions } from './feature-strategy.interface';
import { DSSP, DSSPPaths, dsspShape } from '../../features/dssp';
import { Feature } from '../../features/feature';

export class DSSPStrategy implements FeatureStrategy {
  render(
    container: d3.Selection<SVGGElement, any, any, any>,
    featureData: Feature,
    options: FeatureRenderOptions
  ): void {
    const feature = featureData as DSSP;
    const {
      scale, settings, trace, featureIdx, currentDomainStart, currentDomainEnd, center, top, bottom, coilPoints
    } = options;

    function rescaleY(yValue: number): number {
      return (
        bottom +
        ((yValue - trace.domain.min) / (trace.domain.max - trace.domain.min)) * (top - bottom)
      );
    }

    function randomBetween(min: number, max: number): number {
      return Math.random() * (max - min) + min;
    }

    const cs = trace.options?.['content-size'] || settings['content-size'];
    const featureStart = feature.start - 0.5;
    const featureEnd = feature.end + 0.5;

    const startPoint = Math.max(featureStart, currentDomainStart);
    const endPoint = Math.min(featureEnd, currentDomainEnd);

    const shapeToDraw = dsspShape(feature.code);
    const shapePath = DSSPPaths[shapeToDraw as keyof typeof DSSPPaths];

    const totalFeatureWidth = scale.x(endPoint) - scale.x(startPoint);
    const widthPerResidue = totalFeatureWidth / (endPoint - startPoint);

    const magicNumbers = {
      helix: { bitWidth: 0.25, xScale: 0.5, yScale: 0.119, center: -4 },
      turn: { bitWidth: 0.8, xScale: 0.033, yScale: 0.035, center: +5.8 },
      sheet: { bitWidth: 4, xScale: 0, yScale: 0, center: 0 },
      coil: { bitWidth: 0.3, xScale: 0, yScale: 0, center: 0 },
    };

    const magic = magicNumbers[shapeToDraw as keyof typeof magicNumbers];
    const bitWidth = cs * magic.bitWidth;
    const numBits = Math.floor(totalFeatureWidth / bitWidth + 1);
    const bitOccupancy = bitWidth / widthPerResidue;

    const xPositions = Array.from(
      { length: numBits },
      (_, i) => startPoint + i * bitOccupancy
    ).filter((x) => x >= startPoint && x <= endPoint);

    if (xPositions.length < 2 && xPositions.length > 0) {
      xPositions.push(endPoint);
    }

    const xScale = bitWidth * magic.xScale;
    const yScale = cs * magic.yScale;

    if (shapeToDraw === 'helix' || shapeToDraw === 'turn') {
      container
        .selectAll<SVGPathElement, number>('path.dssp-path')
        .data(xPositions)
        .join(
          (enter) =>
            enter
              .append('path')
              .attr('class', `dssp-path ${shapeToDraw}`)
              .attr('d', shapePath)
              .attr('stroke', d3.color(feature.color || 'white')!.darker(0.5).formatHex())
              .attr('stroke-width', shapeToDraw === 'helix' ? 0.1 : 0.7)
              .attr('fill', feature.color || 'black')
              .attr('transform-origin', 'center center'),
          (update) => update,
          (exit) => exit.remove()
        )
        .attr('fill-opacity', (_, i) =>
          feature.opacity !== undefined
            ? i % 2 === 0
              ? feature.opacity - 0.2
              : feature.opacity
            : i % 2 === 0
            ? 0.5
            : 0.7
        )
        .attr('transform', (xPosition, i) => {
          const flippedXScale = i % 2 === 0 ? xScale : -1 * xScale;
          return `translate(${scale.x(xPosition)}, ${
            center + magic.center
          }) scale(${flippedXScale}, ${yScale})`;
        });

      // clip path update
      const clipId = `clip-path-${trace.id}-feature-${featureIdx}`;
      container
        .attr('clip-path', `url(#${clipId})`)
        .selectAll(`clipPath#${clipId}`)
        .data([feature])
        .join(
          (enter) => {
            const defs = enter.append('defs');
            const clip = defs.append('clipPath').attr('id', clipId);
            clip.append('rect')
                .attr('width', totalFeatureWidth)
                .attr('height', cs)
                .attr('x', scale.x(startPoint))
                .attr('y', top);
            return defs;
          },
          (update) => {
            update.select('rect')
              .attr('width', totalFeatureWidth > 0 ? totalFeatureWidth : 0)
              .attr('height', cs)
              .attr('x', scale.x(startPoint))
              .attr('y', top);
            return update;
          },
          (exit) => exit.remove()
        );
    } else {
      // Clear paths / clip-paths if switching shape
      container.selectAll('path.dssp-path').remove();
      container.selectAll('defs').remove();
      container.attr('clip-path', null);
    }

    if (shapeToDraw === 'sheet') {
      if (endPoint < startPoint) {
        container.selectAll<SVGPolygonElement, number>('polygon').remove();
        return;
      }

      const arrowWidth = cs / 2;
      const sheetWidth = totalFeatureWidth - arrowWidth;
      const sheetHeight = cs / 2;
      const sheetX = scale.x(startPoint);
      const sheetY = center - sheetHeight / 2;

      const arrowHeight = cs;
      const arrowX = scale.x(endPoint) - arrowWidth;
      const arrowY = center - arrowHeight / 2;

      const points = [
        [sheetX, sheetY],
        [sheetX + sheetWidth, sheetY],
        [sheetX + sheetWidth, arrowY],
        [arrowX + arrowWidth, arrowY + arrowHeight / 2],
        [sheetX + sheetWidth, arrowY + arrowHeight],
        [sheetX + sheetWidth, sheetY + sheetHeight],
        [sheetX, sheetY + sheetHeight],
      ];

      const pointsString = points.map((point) => point.join(',')).join(' ');

      container
        .selectAll<SVGPolygonElement, DSSP>('polygon.sheet')
        .data([feature])
        .join(
          (enter) => enter.append('polygon').attr('class', 'sheet'),
          (update) => update,
          (exit) => exit.remove()
        )
        .attr('stroke', d3.color(feature.color || 'white')!.darker(0.5).formatHex())
        .attr('stroke-width', 2)
        .attr('fill', feature.color || 'white')
        .attr('fill-opacity', feature.opacity || 0.5)
        .attr('points', pointsString);
    } else {
      container.selectAll('polygon.sheet').remove();
    }

    if (shapeToDraw === 'coil') {
      const featureKey = `${trace.id}-feature-${featureIdx}`;

      if (coilPoints && !coilPoints.has(featureKey)) {
        coilPoints.set(featureKey, []);
      }

      const sw = Math.min(16, Math.max(3, cs / 8));
      const line = d3
        .line<[number, number]>()
        .curve(d3.curveBasis)
        .x(([x]) => scale.x(x))
        .y(([, y]) => rescaleY(y));

      container
        .selectAll<SVGPathElement, DSSP>('path.coil')
        .data([feature])
        .join(
          (enter) => enter.append('path').attr('class', 'coil'),
          (update) => update,
          (exit) => exit.remove()
        )
        .attr('stroke', feature.color || 'black')
        .attr('stroke-opacity', feature.opacity || 0.5)
        .attr('stroke-width', sw)
        .attr('stroke-linecap', 'square')
        .attr('stroke-dasharray', `${sw}, ${sw * 1.5}`)
        .attr('fill', 'none')
        .attr('d', () => {
          if (!coilPoints) return '';
          const yValues = coilPoints.get(featureKey)!;
          const totalXPoints = xPositions.length + 1;
          for (let i = yValues.length; i < totalXPoints; i++) {
            const y = randomBetween(trace.domain.min, trace.domain.max);
            yValues.splice(yValues.length - 1, 0, y);
          }
          for (let i = yValues.length - 1; i >= totalXPoints; i--) {
            yValues.splice(i, 1);
          }
          yValues[0] = (trace.domain.max + trace.domain.min) / 2;
          yValues[yValues.length - 1] = (trace.domain.max + trace.domain.min) / 2;

          coilPoints.set(featureKey, yValues);

          const xyPoints: [number, number][] = xPositions.map((x, i) => [x, yValues[i]]);
          xyPoints.push([endPoint, yValues[yValues.length - 1]]);
          return line(xyPoints) || '';
        });
    } else {
      container.selectAll('path.coil').remove();
    }
  }
}
