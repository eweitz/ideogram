import {
  adjustBrightness, ensureContrast, getTextSize, d3
} from '../lib';
import {density1d} from 'fast-kde';

const MINI_CURVE_HEIGHT = 12;
const MINI_CURVE_WIDTH = 48;

/** Copyedit machine-friendly tissue name to human-friendly GTEx convention */
function refineTissueName(rawName) {
  let name = rawName.replace(/_/g, ' ').toLowerCase();

  // Style abbreviations of "Brodmann area", and other terms
  // per GTEx conventions
  [
    'ba24', 'ba9', 'basal ganglia', 'omentum', 'suprapubic', 'lower leg',
    'cervical c-1'
  ].forEach(term => name = name.replace(term, '(' + term + ')'));
  ['ba24', 'ba9', 'ebv'].forEach(term => {
    name = name.replace(term, term.toUpperCase());
  });
  [
    'adipose', 'artery', 'brain', 'breast', 'cells', 'cervix', 'colon',
    'heart', 'kidney', 'muscle', 'nerve', 'skin', 'small intestine'
  ].forEach(term => {
    name = name.replace(term, term + ' -');
  });

  // Shorten from long full name to brief (but also standard) abbreviation
  name = name.replace('basal ganglia', 'BG');

  name = name[0].toUpperCase() + name.slice(1);
  return name;
}

/** Get maximum expression among tissues, or for an optional reference */
function getMaxExpression(tissueExpressions, refTissue) {
  let maxExpression = 0;

  for (let i = 0; i < tissueExpressions.length; i++) {
    const teObject = tissueExpressions[i];
    const thisMaxExp = teObject.expression.max;

    if (!refTissue) {
      // For default display of mini-curves
      if (thisMaxExp > maxExpression) {
        maxExpression = thisMaxExp;
      }
    } else {
      // Set a non-default tissue as reference, e.g. to frame other
      // mini-curves relative to hovered mini-curve.
      if (teObject.tissue === refTissue) {
        maxExpression = thisMaxExp;
        break;
      }
    }
  }

  return maxExpression;
}

/**
 * Set a `px` property in each item of tissueExpressions for key metrics
 *
 * @param {List<Object>} tissueExpressions
 * @param {Number} maxPx Maximum width
 * @param {Boolean} relative Whether offsets are relative to highest-median
 *   expression tissue (e.g. multiple mini-curves) or not (e.g. detail curve)
 * @param {Number} leftPx How much to much curves over from the left
 * @param {String} refTissue Tissue used as reference for maximum expression.
 *   refTissue maxExp becomes px.max, any greater exp. in other tissues gets
 *   truncated at right in its curve.
 * @returns {List<Object>} tissueExpressions, with a new `px` property in each
 *   for max, q3, median, q1, and min.
 */
function setPxOffset(
  tissueExpressions, maxPx, relative=true, leftPx=0, refTissue=null
) {
  const maxExpression = getMaxExpression(tissueExpressions, refTissue);
  let refMinExp = 0;
  if (refTissue) {
    const refTeObject =
      tissueExpressions.find(teObject => teObject.tissue === refTissue);
    refMinExp = refTeObject.expression.min;
  }

  const metrics = ['max', 'q3', 'median', 'q1', 'min'];

  tissueExpressions.map(teObject => {
    teObject.px = {};
    if (relative) {
      for (let i = 0; i < metrics.length; i++) {
        const metric = metrics[i];
        const exp = teObject.expression[metric];
        let px =
          maxPx * (exp - refMinExp)/(maxExpression - refMinExp) + leftPx;
        if (Math.round(px) > maxPx) {
          // Often occurs when `refTissue` is specified
          teObject.px[metric + 'Raw'] = px;
          px += (maxPx - px);
        }
        px += leftPx;
        teObject.px[metric] = px;
      }
    } else {
      // min = 50,   med = 100,    max = 200
      // px.min = 0, px.med = 250 * 100-50/(200 - 50), px.max = 250
      const minExp = teObject.expression.min;
      const maxExp = teObject.expression.max;
      for (let i = 0; i < metrics.length; i++) {
        const metric = metrics[i];
        const exp = teObject.expression[metric];
        const px = maxPx * (exp - minExp)/(maxExp - minExp) + leftPx;
        teObject.px[metric] = px;
      }
    }
    return teObject;
  });

  return tissueExpressions;
}

/** Get link to full detail about gene on GTEx */
function getFullDetail(gene) {
  const gtexUrl = `https://www.gtexportal.org/home/gene/${gene}`;
  const cls = 'class="_ideoGtexLink"';
  const gtexLink =
    `<a href="${gtexUrl}" ${cls} target="_blank">GTEx</a>`;
  const fullDetail = `<i>Full detail: ${gtexLink}</i>`;
  return fullDetail;
}

function getMoreOrLessToggle(gene, height, tissueExpressions, ideo) {

  const fullDetail = getFullDetail(gene);

  if (tissueExpressions.length <= 3) {
    return `<br/>${fullDetail}<br/><br/>`;
  }

  const pipeStyle =
    'style="margin: 0 6px; color: #CCC;"';
  const details =
    `<span ${pipeStyle}>|</span>${fullDetail}`;
  const moreOrLess =
    !ideo.showTissuesMore ? `Less...` : 'More...';
  const mlStyle = 'style="cursor: pointer;px;"';
  const left = `left: ${!ideo.showTissuesMore ? 1 : -50}px;`;
  const top = 'top: -1px;';
  const mltStyle =
    `style="position: relative; ${left} ${top} font-size: ${height}px"`
  const moreOrLessToggleHtml =
    `<div ${mltStyle}>` +
      `<a class="_ideoMoreOrLessTissue" ${mlStyle}>${moreOrLess}</a>` +
      `${!ideo.showTissuesMore ? details : ''}` +
    `</div>`;

  return moreOrLessToggleHtml;
}

/** Get x, y1, y2, and style for a metric line */
function getMetricLineAttrs(offsets, metric, y, height, isShifted=false) {
  let x = offsets[metric];
  let isTruncated = false;
  if (isShifted && x > MINI_CURVE_WIDTH) {
    x = MINI_CURVE_WIDTH + 1;
    isTruncated = true;
  }
  let metricHeight =
    !isTruncated ? offsets[metric + 'Height'] : MINI_CURVE_HEIGHT;

  if (isNaN(metricHeight)) {
    // Seen upon e.g. hovering over "Artery - Coronary" in STAT1
    metricHeight = MINI_CURVE_HEIGHT;
  }

  const top = height - metricHeight;
  const y1 = top + y + 0.5;
  const y2 = top + y + metricHeight;

  // E.g. brain mini-curve in AGT
  const isNarrow = offsets.max - offsets.min <= 8;
  const isMedian = metric === 'median';
  const isNarrowMedian = isNarrow && isMedian;
  const style = isNarrowMedian ? 'display: none' : '';

  // Whether to hide median at end of transition, e.g. when focus is
  // esophagus in ACE2 and testis median should be hidden
  const isTruncatedMedian = isTruncated && isMedian;

  const endStyle =
    isTruncatedMedian || isNarrowMedian ? 'display: none;' : '';

  return {x, y1, y2, style, endStyle};
}

/** Get a vertical line to show in distribution curve for median, Q1, or Q2 */
function getMetricLine(
  metric, offsets, color, y, height,
  dash=false
) {
  const classMetric = metric[0].toUpperCase() + metric.slice(1);
  const {x, y1, y2, style} = getMetricLineAttrs(offsets, metric, y, height);
  const styleAttr = style === '' ? '' : `style="${style}"`;
  const baseColor = adjustBrightness(color, 0.55);
  const strokeColor = ensureContrast(baseColor, color);
  const dasharray = dash ? 'stroke-dasharray="3" ' : '';
  const attrs =
    `x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" ${styleAttr} ` +
    dasharray +
    `class="_ideoExpression${classMetric}" `;
  const metricLine = `<line stroke="${strokeColor}" ${attrs} />`;
  return metricLine;
}

/**
 * Get vertical lines for median, Q1, Q3, to overlay in distribution curve plot
 *
 * Median line is solid, and shown in both mini-curve and detailed curve.
 * Q1 and Q3 lines are dashed, and only shown in detailed curve.
 */
function getMetricLines(offsets, y, height, color) {
  const medianLine = getMetricLine('median', offsets, color, y, height, false);
  const q1Line = getMetricLine('q1', offsets, color, y, height, true);
  const q3Line = getMetricLine('q3', offsets, color, y, height, true);

  return [medianLine, q1Line, q3Line];
}

function getCurveShape(teObject, y, height, numKdeBins=64, isShifted=false) {
  const quantiles = teObject.expression.quantiles;
  const offsets = teObject.px;
  const samples = teObject.samples;
  const spreadQuantiles = [];

  // `quantiles` is an array encoding a histogram.
  // To get a kernel density estimation (KDE) -- i.e., a curve that smooths the
  // crude bars of the histogram -- we need to "spread" or "flatten" the
  // histogram array so e.g.
  // [0, 5, 4, 1] (= 0 samples in quantile 1, 5 samples in quantile 2, etc.)
  // becomes
  // [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3]
  quantiles.map((quantileCount, j) => {
    for (let k = 0; k < quantileCount; k++) {
      spreadQuantiles.push(j);
    }
  });

  const sampleThreshold = 70; // GTEx sample threshold

  // Small bandwidth : sharp curve :: large bandwidth : smooth curve
  //
  // Increasing bandwidth when there are few samples helps avoid sharp curves
  // that are mere artifacts of having few points, which would be problematic
  // as it almost certainly misrepresents the underlying population.
  const bandwidth = samples >= sampleThreshold ? 0.7 : 1.5;

  const numBins = numKdeBins; // The number of lines in the KDE curve
  const kde = density1d(
    spreadQuantiles, {bins: numBins, bandwidth}
  );
  const rawKdeArray = Array.from(kde);
  const kdeArray = rawKdeArray
    .filter(point => 0 <= point.x && point.x <= 10);

  if (kdeArray.length === 0) return '';

  // Get scaling factor to convert kernel coordinates to pixels
  const maxKernelY = Math.max(...kdeArray.map(p => p.y));
  const minKernelX = kdeArray[0].x;
  const maxKernelX = kdeArray.slice(-1)[0].x;
  const kdeWidth = maxKernelX - minKernelX;
  const thisMax = ('maxRaw' in offsets) ? offsets.maxRaw : offsets.max;
  const offsetsWidth = thisMax - offsets.min;
  const pixelsPerKernel = offsetsWidth/kdeWidth;

  const bottom = height + y;

  // Convert KDE x,y points to pixel coordinates, each a segment of the curve;
  // and set heights for each metric plotted in detailed distribution
  let prevPixelX = 0;
  const rawPoints = kdeArray.map((point, i) => {
    let pixelX = (point.x - minKernelX) * pixelsPerKernel + offsets.min;
    if (isShifted && pixelX > MINI_CURVE_WIDTH) {
      pixelX = MINI_CURVE_WIDTH;
    }
    const segmentHeight = height * (point.y / maxKernelY);
    const pixelY = bottom - segmentHeight;

    if (i > 0) {
      ['q1', 'median', 'q3'].forEach(metric => {
        const metricX = offsets[metric];
        if (prevPixelX < metricX && metricX <= pixelX) {
          offsets[metric + 'Height'] = segmentHeight;
        }
      });
    }

    prevPixelX = pixelX;

    return `${pixelX},${pixelY}`;
  });

  let refinedMax = offsets.max;
  let refinedMin = offsets.min;
  if (isShifted) {
    if (offsets.max > MINI_CURVE_WIDTH) refinedMax = MINI_CURVE_WIDTH;
    if (offsets.min > MINI_CURVE_WIDTH) refinedMin = MINI_CURVE_WIDTH;
  }

  // Tie up loose ends of the curved diagram
  rawPoints.push(refinedMax + ',' + bottom);
  rawPoints.push(refinedMin + ',' + bottom);
  const originPoint = rawPoints[0];
  rawPoints.push(originPoint);
  const points = rawPoints.join(' ');

  return [points, offsets];
}

/**
 * Get a distribution curve of expression, via kernel density estimation (KDE)
 */
function getCurve(teObject, y, height, color, borderColor, numKdeBins=64) {
  const [points, offsets] = getCurveShape(teObject, y, height, numKdeBins);

  const curveAttrs =
    `fill="${color}" ` +
    `stroke="${borderColor}" ` +
    `points="${points}" ` +
    'class="tissue-curve" ' +
    `data-tissue-curve="${teObject.tissue}"`;

  const curve = `<polyline ${curveAttrs} />`;

  return [curve, offsets];
}

/**
 * Remove detailed distribution curve; unhide RNA & protein diagrams, footer
 */
function removeDetailedCurve() {
  const container = document.querySelector('._ideoDistributionContainer');
  if (!container) return;
  container.remove();

  const structureDom = document.querySelector('._ideoGeneStructureContainer');
  if (structureDom) {
    structureDom.style.display = '';
  }
  const footer = document.querySelector('._ideoTooltipFooter');
  footer.style.display = '';
}

/**
 * Get small vertical lines ("ticks") for min, max, and median in detailed
 * distribution curve
 */
function getMetricTicks(teObject, height) {
  const min = teObject.px.min;
  const minExp = teObject.expression.min;
  const max = teObject.px.max;
  const maxExp = teObject.expression.max;
  const median = teObject.px.median;
  const medianExp = teObject.expression.median;
  const mid = max/2;
  const y = height + 5;
  const stroke = `stroke="#CCC" stroke-width="1px"`;

  const fontObject = {
    config: {weight: 400, annotLabelSize: 12}
  };

  const textY = y + 16;
  const expTextY = y + 27;
  const tickY1 = y - 3;
  const tickY2 = y + 5;

  const maxRawText = 'Max';
  const maxTextWidth = getTextSize(maxRawText, fontObject).width;
  const maxExpTextWidth = getTextSize(maxExp, fontObject).width;
  const maxTextX = max - maxTextWidth / 2;
  const maxExpTextX = max - maxExpTextWidth / 2;
  const maxTickAttrs =
    `x1="${max}" x2="${max}" y1="${tickY1}" y2="${tickY2}" ${stroke}`;
  const maxText =
    `<line ${maxTickAttrs} />` +
    `<text x="${maxTextX}" y="${textY}">${maxRawText}.</text>` +
    `<text x="${maxExpTextX}" y="${expTextY}">${maxExp}</text>`;

  const minRawText = 'Min';
  const minTextWidth = getTextSize(minRawText, fontObject).width;
  const minExpTextWidth = getTextSize(minExp, fontObject).width;
  let minTextX = min - minTextWidth / 2;
  let minExpTextX = min - minExpTextWidth / 2;
  const minTextEndX = min + minTextWidth;
  const minTickAttrs =
    `x1="${min}" x2="${min}" y1="${tickY1}" y2="${tickY2}" ${stroke}`;

  const medianRawText = 'Median';
  const medianTextWidth = getTextSize(medianRawText, fontObject).width;
  const medianExpTextWidth = getTextSize(medianExp, fontObject).width;
  const medianTextX = median - medianTextWidth / 2;
  const medianExpTextX = median - medianExpTextWidth / 2;
  const medianTickAttrs =
    `x1="${median}" x2="${median}" y1="${tickY1}" y2="${tickY2}" ${stroke}`;

  let medianX = medianTextX;
  let medianExpX = medianExpTextX;

  // Align "Median" to right of tick if text would clash with "Min."
  const isMinMedSoftCollide = minTextEndX >= medianX;
  if (isMinMedSoftCollide) {
    medianX = median;
    medianExpX = median;
  }

  // If right-aligning "Median" doesn't fix clash,
  // then left-align "Min." and nudge "Median" right
  const isMinMedCollide = minTextEndX >= medianX;

  // Examples: "More..." tissues in PCSK9 and (especially) TTN
  if (isMinMedCollide) {
    medianX += 1.5;
    medianExpX += 1.5;
    minTextX = min - minTextWidth - 1.5;
    minExpTextX = min - minExpTextWidth - 1.5;
  }

  const medianText =
    `<line ${medianTickAttrs} />` +
    `<text x="${medianX}" y="${textY}">Median</text>` +
    `<text x="${medianExpX}" y="${expTextY}">${medianExp}</text>`;

  const minText =
    `<line ${minTickAttrs} />` +
    `<text x="${minTextX}" y="${textY}" >${minRawText}.</text>` +
    `<text x="${minExpTextX}" y="${expTextY}" >${minExp}</text>`;

  const nameAttrs =
    `x="${mid - 40}" y="${y + 46}"`;
  const sampleAttrs =
    `x="${mid - 70}" y="${y + 59}"`;

  return (
    `<g>` +
    minText +
    maxText +
    medianText +
    `<text ${nameAttrs}>Expression (TPM)</text>` +
    `<text ${sampleAttrs}>Samples: ${teObject.samples} | Source: GTEx</text>` +
    `</g>`
  );
}

/**
 * Write a large, detailed distribution curve to the DOM.
 *
 * This is shown upon hovering over a mini-curve.  The detailed curve shows
 * more metrics than the mini-curve, in a zoomed-in view that makes it easier
 * to discern the overall shape and local features of gene expression
 * distribution in the tissue.
 */
function addDetailedCurve(traceDom, ideo) {
  const gene = traceDom.getAttribute('data-gene');
  const tissue = traceDom.getAttribute('data-tissue');
  const tissueExpressions = ideo.tissueExpressionsByGene[gene];

  let teObject = tissueExpressions.find(t => t.tissue === tissue);
  const maxWidthPx = 225; // Same width as RNA & protein diagrams
  const leftPx = 35;
  teObject = setPxOffset(
    [teObject], maxWidthPx, false, leftPx
  )[0];

  const y = 0;
  const height = 50;

  const color = `#${teObject.color}`;
  const borderColor = adjustBrightness(color, 0.85);

  const numBins = 256;
  const [distributionCurve, offsetsWithHeight] = getCurve(
    teObject, y + 1, height, color, borderColor, numBins
  );

  const [medianLine, q1Line, q3Line] = getMetricLines(
    offsetsWithHeight, y, height, color
  );
  const metricTicks = getMetricTicks(teObject, height);

  // Hide RNA & protein diagrams, footer
  let ledgeDom;
  const structureDom = document.querySelector('._ideoGeneStructureContainer');
  const footer = document.querySelector('._ideoTooltipFooter');
  if (structureDom) { // Account for e.g. ncRNA, like MALAT1
    ledgeDom = structureDom;
    structureDom.style.display = 'none';
    footer.style.display = 'none';
  } else {
    ledgeDom = footer;
    const plotContainer = document.querySelector('._ideoTissuePlotContainer');
    plotContainer.setAttribute('style', 'margin-bottom: 20px');
  }

  const svgHeight = 119.5; // Keeps tooltip bottom flush with prior state
  const style = `style="position: relative; height: ${svgHeight}px"`;
  const svgStyle = 'style="position: absolute; top: 2px; left: -5px;"';
  const container =
    `<div class="_ideoDistributionContainer" ${style}>` +
    `<svg width="280px" height="${svgHeight}px" ${svgStyle}>` +
    metricTicks +
    distributionCurve +
    medianLine +
    q1Line +
    q3Line +
    `</svg>` +
    '</div>';

  ledgeDom.insertAdjacentHTML('beforebegin', container);
}

function getMiniCurveY(i, height) {
  const y = 1 + i * (height + 2);
  return y;
}

/** Get mini distribution curves and  */
function getExpressionPlotHtml(gene, tissueExpressions, ideo) {
  const maxWidth = MINI_CURVE_WIDTH;
  tissueExpressions = setPxOffset(tissueExpressions, maxWidth, true, 0);

  const height = MINI_CURVE_HEIGHT;

  const moreOrLessToggleHtml =
    getMoreOrLessToggle(gene, height, tissueExpressions, ideo);
  const numTissues = !ideo.showTissuesMore ? 10 : 3;

  let y;
  const rects = tissueExpressions.slice(0, numTissues).map((teObject, i) => {
    y = getMiniCurveY(i, height);
    const tissue = refineTissueName(teObject.tissue);
    const color = `#${teObject.color}`;
    const borderColor = adjustBrightness(color, 0.85);

    const [distributionCurve, offsetsWithHeight] = getCurve(
      teObject, y, height, color, borderColor
    );

    const [medianLine] = getMetricLines(offsetsWithHeight, y, height, color);

    const dataTissue = `data-tissue="${teObject.tissue}"`;

    // Invisible; enables tooltip upon hover anywhere in diagram area,
    // not merely the (potentially very small) diagram itself
    const containerAttrs =
      `height="${height + 2}" ` +
      `width="${maxWidth}px" ` +
      'fill="#FFF" ' +
      'opacity="0" ' +
      `x="0" ` +
      `y="${y}" ` +
      `data-gene="${gene}" ` +
      dataTissue;

    const textAttrs =
      `y="${y + height}" ` +
      `style="font-size: ${height}px;" ` +
      `x="${maxWidth + 10}" ` +
      dataTissue;

    return (
      `<g data-group-tissue="${teObject.tissue}">` +
      `<text ${textAttrs}>${tissue}</text>` +
      distributionCurve +
      medianLine +
      `<rect ${containerAttrs} class="_ideoExpressionTrace" />` +
      '</g>'
    );
  }).join('');

  let containerStyle = '';
  const hasStructure = gene in ideo.geneStructureCache;
  if (!hasStructure) { // e.g. MALAT1
    containerStyle = 'style="margin-bottom: 10px;"';
  }

  const plotAttrs = `style="margin-top: 15px; margin-bottom: -15px;"`;
  const cls = 'class="_ideoTissuePlotTitle"';
  const titleAttrs = `${cls} style="margin-bottom: 4px;"`;
  const style = `style="position: relative; left: 10px"`;
  const plotHtml =
    `<div class="_ideoTissuePlotContainer" ${containerStyle}>` +
      `<div class="_ideoTissueExpressionPlot" ${plotAttrs}>
        <div ${titleAttrs}>Reference expression by tissue</div>
        <svg width="275" height="${y + height + 2}" ${style}>${rects}</svg>
        ${moreOrLessToggleHtml}
      </div>` +
    '</div>';
  return plotHtml;
}

function updateTissueExpressionPlot(ideo) {
  const plot = document.querySelector('._ideoTissueExpressionPlot');
  const plotParent = plot.parentElement;

  const gene = document.querySelector('#ideo-related-gene').innerText;
  const tissueExpressions = ideo.tissueExpressionsByGene[gene];

  const newPlotHtml = getExpressionPlotHtml(gene, tissueExpressions, ideo);

  plotParent.innerHTML = newPlotHtml;
  addTissueListeners(ideo);
}

function colorTissueText(traceDom, color) {
  const tissue = traceDom.getAttribute('data-tissue');
  const tissueTextDom = document.querySelector(`text[data-tissue="${tissue}"]`);
  tissueTextDom.setAttribute('fill', color);
}

export function addTissueListeners(ideo) {
  const moreOrLess = document.querySelector('._ideoMoreOrLessTissue');
  if (moreOrLess) {
    moreOrLess.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      ideo.showTissuesMore = !ideo.showTissuesMore;
      updateTissueExpressionPlot(ideo);
    });
  }

  const traces = document.querySelectorAll('._ideoExpressionTrace')
  traces.forEach(trace => {
    trace.addEventListener('mouseenter', () => {
      colorTissueText(trace, '#338');
      focusMiniCurve(trace, ideo);
      addDetailedCurve(trace, ideo);
    });
    trace.addEventListener('mouseleave', () => {
      colorTissueText(trace, '#000');
      focusMiniCurve(traces[0], ideo, true);
      removeDetailedCurve(trace, ideo);
    });
  });
}

/**
 * Update mini-curve shapes to focus on hovered tissue
 *
 * This helps compare the focused tissue to other tissues.  Without this,
 * often almost all curves are too small, and their distributions can't be
 * richly compared, because one or a few tissues have a maximum drastically
 * larger than others.  With this feature, expression in those non-dominant
 * tissues (which are often the majority, and biologically relevant) can be
 * compared in detail.
 *
 * The focused tissue becomes the new coordinate reference for all mini-curves.
 * The new reference tissue (refTissue) gets scaled and translated to occupy
 * the full width available to mini-curves (MINI_CURVE_WIDTH).  Other curves get
 * transformed to be viewed from the perspective of the focused tissue.
 **/
function focusMiniCurve(traceDom, ideo, reset=false) {
  const gene = traceDom.getAttribute('data-gene');
  const refTissue = reset ? null : traceDom.getAttribute('data-tissue');

  const numTissues = !ideo.showTissuesMore ? 10 : 3;
  let tissueExpressions = ideo.tissueExpressionsByGene[gene];

  const maxPx = MINI_CURVE_WIDTH;
  const relative = true;
  const leftPx = 0;
  tissueExpressions =
    setPxOffset(tissueExpressions, maxPx, relative, leftPx, refTissue)
      .slice(0, numTissues);

  const height = MINI_CURVE_HEIGHT;
  tissueExpressions.forEach((teObject, i) => {
    const thisTissue = teObject.tissue;
    const thisTeObject = tissueExpressions.find(te => te.tissue === thisTissue);
    const y = getMiniCurveY(i, height);

    const isShifted = !reset;
    const [newPoints, newOffsets] =
      getCurveShape(thisTeObject, y, height, 64, isShifted);
    tissueExpressions[i].points = newPoints;

    const medianLineAttrs =
      getMetricLineAttrs(newOffsets, 'median', y, height, isShifted);
    tissueExpressions[i].medianLine = medianLineAttrs;
  });

  d3.select('._ideoTissueExpressionPlot').selectAll('polyline')
    .data(tissueExpressions)
    .transition()
    .duration(500)
    .attr('points', (_, i) => tissueExpressions[i].points);

  d3.select('._ideoTissueExpressionPlot').selectAll('._ideoExpressionMedian')
    .data(tissueExpressions)
    .attr('style', (_, i) => tissueExpressions[i].medianLine.style)
    .transition()
    .duration(500)
    .attr('x1', (_, i) => tissueExpressions[i].medianLine.x)
    .attr('x2', (_, i) => tissueExpressions[i].medianLine.x)
    .attr('y1', (_, i) => tissueExpressions[i].medianLine.y1)
    .attr('y2', (_, i) => tissueExpressions[i].medianLine.y2)
    .attr('style', (_, i) => tissueExpressions[i].medianLine.endStyle);
}

export function getTissueHtml(annot, ideo) {
  if (!ideo.tissueCache || !(annot.name in ideo.tissueCache.byteRangesByName)) {
    // e.g. MIR23A
    return '<br/>';
  }

  if (ideo.showTissuesMore === undefined) {
    ideo.showTissuesMore = true;
  }

  const gene = annot.name;
  const tissueExpressions = ideo.tissueExpressionsByGene[gene];
  if (!tissueExpressions) return;
  const tissueHtml =
    getExpressionPlotHtml(gene, tissueExpressions, ideo);

  return tissueHtml;
}
