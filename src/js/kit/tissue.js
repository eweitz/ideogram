import {
  getTippyConfig, adjustBrightness, ensureContrast, getTextSize
} from '../lib';
import tippy from 'tippy.js';
import { density1d } from 'fast-kde';

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

function setPxOffset(tissueExpressions, maxPx=80, relative=true) {
  let maxExpression = 0;

  const metrics = ['max', 'q3', 'median', 'q1', 'min'];

  for (let i = 0; i < tissueExpressions.length; i++) {
    const teObject = tissueExpressions[i];
    if (teObject.expression.max > maxExpression) {
      maxExpression = teObject.expression.max;
    }
  }

  tissueExpressions.map(teObject => {
    teObject.px = {};
    if (relative) {
      for (let i = 0; i < metrics.length; i++) {
        const metric = metrics[i];
        const expression = teObject.expression[metric];
        const px = maxPx * expression/maxExpression;
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
        const px = maxPx * (exp - minExp)/(maxExp - minExp);
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
  const gtexLink =
    `<a href="${gtexUrl}" target="_blank">GTEx</a>`;
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
  const left = `left: ${!ideo.showTissuesMore ? 10 : -41}px;`;
  const top = 'top: -2px;';
  const mltStyle =
    `style="position: relative; ${left} ${top} font-size: ${height}px"`
  const moreOrLessToggleHtml =
    `<div ${mltStyle}>` +
      `<a class="_ideoMoreOrLessTissue" ${mlStyle}>${moreOrLess}</a>` +
      `${!ideo.showTissuesMore ? details : ''}` +
    `</div>`;

  return moreOrLessToggleHtml;
}

function getMetricLine(
  metric, offsets, color, y, height,
  dash=false
) {
  const classMetric = metric[0].toUpperCase() + metric.slice(1);
  const x = offsets[metric];
  const metricHeight = offsets[metric + 'Height'];
  const top = height - metricHeight;
  const y1 = top + y + 0.5;
  const y2 = top + y + metricHeight;
  const baseColor = adjustBrightness(color, 0.55);
  const strokeColor = ensureContrast(baseColor, color);
  const dasharray = dash ? 'stroke-dasharray="3" ' : '';
  const attrs =
    `x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" ` +
    dasharray +
    `class="_ideoExpression${classMetric}" `;
  const metricLine = `<line stroke="${strokeColor}" ${attrs} />`;
  return metricLine;
}

function getBoxPlot(offsets, y, height, color) {
  const whiskerColor = adjustBrightness(color, 0.65);
  const whiskerY = y + 6;

  // Get minimum whisker
  const minX1 = offsets.min;
  const minX2 = offsets.q1;
  const whiskerMinAttrs =
    `x1="${minX1}" y1="${whiskerY}" x2="${minX2}" y2="${whiskerY}"`;
  const whiskerMin = `<line stroke="${whiskerColor}" ${whiskerMinAttrs} />`;

  // Get maximum whisker
  const maxX1 = offsets.q3;
  const maxX2 = offsets.max;
  const whiskerMaxAttrs =
    `x1="${maxX1}" y1="${whiskerY}" x2="${maxX2}" y2="${whiskerY}"`;
  const whiskerMax = `<line stroke="${whiskerColor}" ${whiskerMaxAttrs} />`;

  const whiskers = {min: whiskerMin, max: whiskerMax};

  // Get vertical lines for median, Q1, Q3
  const medianLine = getMetricLine(
    'median', offsets, color, y, height, false
  );
  const q1Line = getMetricLine(
    'q1', offsets, color, y, height, true
  );
  const q3Line = getMetricLine(
    'q3', offsets, color, y, height, true
  );

  return [whiskers, medianLine, q1Line, q3Line];
}

/**
 * Get a distribution curve of expression, via kernel density estimation (KDE)
 */
function getCurve(teObject, y, height, color, borderColor, numKdeBins=64) {
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
  const offsetsWidth = offsets.max - offsets.min;
  const pixelsPerKernel = offsetsWidth/kdeWidth;

  const bottom = height + y;

  // Convert KDE x,y points to pixel coordinates, each a segment of the curve;
  // and set heights for each metric plotted in detailed distribution
  let prevPixelX = 0;
  const rawPoints = kdeArray.map((point, i) => {
    const pixelX = (point.x - minKernelX) * pixelsPerKernel + offsets.min;
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

  // Tie up loose ends of the curved diagram
  rawPoints.push(offsets.max + ',' + bottom);
  rawPoints.push(offsets.min + ',' + bottom);
  const originPoint = rawPoints[0];
  rawPoints.push(originPoint);
  const points = rawPoints.join(' ');

  const curveAttrs =
    `fill="${color}" ` +
    `stroke="${borderColor}" ` +
    `points="${points}" `;

  const curve = `<polyline ${curveAttrs} />`;

  return [curve, offsets];
}

/**
 * Remove detailed distribution curve; unhide RNA & protein diagrams, footer
 */
function removeDetailedCurve() {
  const container = document.querySelector('._ideoDistributionContainer');
  container.remove();

  const structureDom = document.querySelector('._ideoGeneStructureContainer');
  structureDom.style.display = '';
  const footer = document.querySelector('._ideoTooltipFooter');
  footer.style.display = '';
}

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

  const style = 'style="font-size: 10px"';

  const fontObject = {
    config: {weight: 400, annotLabelSize: 10}
  };

  const nameAttrs =
    `x="${mid - 70}" y="${y + 45}" ${style}"`;
  const sampleAttrs =
    `x="${mid - 70}" y="${y + 58}" ${style}"`;

  const minTextWidth = getTextSize(minExp, fontObject).width;
  const minTickAttrs =
    `x1="${min}" x2="${min}" y1="${y - 3}" y2="${y + 5}" ${stroke}`;
  const minTextAttrs = `x="${min}" ${style}`;
  const minText =
    `<line ${minTickAttrs} />` +
    `<text ${minTextAttrs} y="${y + 15}" >Min.</text>` +
    `<text ${minTextAttrs} y="${y + 26}" >${minExp}</text>`;

  const maxTextWidth = getTextSize(maxExp, fontObject).width;
  const maxTickAttrs =
    `x1="${max}" x2="${max}" y1="${y - 3}" y2="${y + 5}" ${stroke}`;
  const maxText =
    `<line ${maxTickAttrs} />` +
    `<text ${style} x="${max - 20}" y="${y + 15}">Max.</text>` +
    `<text ${style} x="${max - maxTextWidth}" y="${y + 26}">${maxExp}</text>`;

  const medianTextWidth = getTextSize(medianExp, fontObject).width;

  const medianTickAttrs =
    `x1="${median}" x2="${median}" y1="${y - 3}" y2="${y + 5}" ${stroke}`;

  let medLeft = 16;
  let medExpLeft = medianTextWidth - 12;
  const isMedianOverflow = median - medianTextWidth < 0;
  if (isMedianOverflow) {
    medLeft = 0;
    medExpLeft = 0;
  }
  let medianX = median - medLeft;
  let medianExpX = median - medExpLeft;

  const isMinMedSoftCollide = minTextWidth + 5 >= medianX;
  if (isMinMedSoftCollide) {
    medianX = median;
    medianExpX = median;
  }

  const medianText =
    `<line ${medianTickAttrs} />` +
    `<text ${style} x="${medianX}" y="${y + 15}">Median</text>` +
    `<text ${style} x="${medianExpX}" y="${y + 26}">${medianExp}</text>`;

  const isMinMedCollide = minTextWidth + 5 >= medianX;
  const refinedMinText = isMinMedCollide ? '' : minText;

  return (
    `<g>` +
    refinedMinText +
    maxText +
    medianText +
    `<text ${nameAttrs}>Expression distribution (TPM)</text>` +
    `<text ${sampleAttrs}>Samples: ${teObject.samples} | Source: GTEx</text>` +
    `</g>`
  );
}

function addDetailedCurve(traceDom, ideo) {
  const gene = traceDom.getAttribute('data-gene');
  const tissue = traceDom.getAttribute('data-tissue');
  const tissueExpressions = ideo.tissueExpressionsByGene[gene];

  let teObject = tissueExpressions.find(t => t.tissue === tissue);
  const maxWidthPx = 250; // Same width as RNA & protein diagrams
  teObject = setPxOffset([teObject], maxWidthPx, false)[0];

  const y = 0;
  const height = 40;

  const color = `#${teObject.color}`;
  const borderColor = adjustBrightness(color, 0.85);

  const [distributionCurve, offsetsWithHeight] = getCurve(
    teObject, y, height, color, borderColor, 256
  );

  const [whiskers, medianLine, q1Line, q3Line] = getBoxPlot(
    offsetsWithHeight, y, height, color
  );
  const metricTicks = getMetricTicks(teObject, height);

  // Hide RNA & protein diagrams, footer
  const structureDom = document.querySelector('._ideoGeneStructureContainer');
  structureDom.style.display = 'none';
  const footer = document.querySelector('._ideoTooltipFooter');
  footer.style.display = 'none';

  const borderPad = '-1 -1'; // Avoids truncating curve border / stroke

  const style = 'style="position: relative; top: -2px"';
  const container =
    `<div class="_ideoDistributionContainer" ${style}>` +
    `<svg viewbox="${borderPad} ${maxWidthPx + 5} ${height + 65}">` +
    metricTicks +
    distributionCurve +
    medianLine +
    q1Line +
    q3Line +
    `</svg>` +
    '</div>';

  structureDom.insertAdjacentHTML('beforebegin', container);
}

function getExpressionPlotHtml(gene, tissueExpressions, ideo) {
  tissueExpressions = setPxOffset(tissueExpressions);

  const height = 12;

  const moreOrLessToggleHtml =
    getMoreOrLessToggle(gene, height, tissueExpressions, ideo);
  const numTissues = !ideo.showTissuesMore ? 10 : 3;

  let y;
  const rects = tissueExpressions.slice(0, numTissues).map((teObject, i) => {
    y = 1 + i * (height + 2);
    const tissue = refineTissueName(teObject.tissue);
    const color = `#${teObject.color}`;
    const borderColor = adjustBrightness(color, 0.85);

    const offsets = teObject.px;
    const width = offsets.q3 - offsets.q1;
    const x = offsets.q1;

    const [distributionCurve, offsetsWithHeight] = getCurve(
      teObject, y, height, color, borderColor
    );

    const [whiskers, medianLine] = getBoxPlot(
      offsetsWithHeight, y, height, color
    );

    const boxAttrs =
      `height="${height - 0.5}" ` +
      `width="${width}" ` +
      `x="${x}" ` +
      `y="${y}" ` +
      `fill="${color}" ` +
      `stroke="${borderColor}" stroke-width="1px" `;

    // Invisible; enables tooltip upon hover anywhere in diagram area,
    // not merely the (potentially very small) diagram itself
    const containerAttrs =
      `height="${height + 2}" ` +
      `width="80px" ` +
      'fill="#FFF" ' +
      'opacity="0" ' +
      `x="0" ` +
      `y="${y}" ` +
      `data-gene="${gene}" ` +
      `data-tissue="${teObject.tissue}"`;

    const textAttrs =
      `y="${y + height - 1.5}" ` +
      `style="font-size: ${height}px;" ` +
      'x="90"';

    return (
      '<g>' +
      `<text ${textAttrs}>${tissue}</text>` +
      // whiskers.min +
      // `<rect ${boxAttrs} />` +
      distributionCurve +
      medianLine +
      // whiskers.max +
      `<rect ${containerAttrs} class="_ideoExpressionTrace" />` +
      '</g>'
    );
  }).join('');

  const plotAttrs = `style="margin-top: 15px; margin-bottom: -15px;"`;
  const cls = 'class="_ideoTissuePlotTitle"';
  const titleAttrs = `${cls} style="margin-bottom: 4px;"`;
  const plotHtml =
    '<div>' +
      `<div class="_ideoTissueExpressionPlot" ${plotAttrs}>
        <div ${titleAttrs}>Reference expression by tissue:</div>
        <svg height="${y + height + 2}">${rects}</svg>
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

  document.querySelectorAll('._ideoExpressionTrace').forEach(trace => {
    const medianLine = trace.parentNode.querySelector('._ideoExpressionMedian');
    trace.addEventListener('mouseenter', () => {
      medianLine.dispatchEvent(new Event('mouseenter'));
      addDetailedCurve(trace, ideo);
    });
    trace.addEventListener('mouseleave', () => {
      medianLine.dispatchEvent(new Event('mouseleave'));
      removeDetailedCurve(trace, ideo);
    });
  });

  // tippy(
  //   '._ideoExpressionMedian',
  //   getTippyConfig()
  // );
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
