import {getTippyConfig, adjustBrightness, ensureContrast} from '../lib';
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

function setPxOffset(tissueExpressions) {
  const maxPx = 80;
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
    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];
      const expression = teObject.expression[metric];
      const px = maxPx * expression/maxExpression;
      teObject.px[metric] = px;
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

function getBoxPlot(offsets, y, height, color, tippyAttr) {
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

  // Get median line
  const medianX = offsets.median;
  const medianBaseColor = adjustBrightness(color, 0.55);
  const medianColor = ensureContrast(medianBaseColor, color);
  const medianAttrs =
    `x1="${medianX}" y1="${y}" x2="${medianX}" y2="${y + height - 0.5}" ` +
    `class="_ideoExpressionMedian" ${tippyAttr}`;
  const medianLine = `<line stroke="${medianColor}" ${medianAttrs} />`;

  const whiskers = {min: whiskerMin, max: whiskerMax};

  return [whiskers, medianLine];
}

function getViolin(teObject, y, height, color, borderColor) {

  const quantiles = teObject.expression.quantiles;
  const offsets = teObject.px;
  const samples = teObject.samples;
  const spreadQuantiles = [];
  const numQuantiles = quantiles.length;
  console.log('quantiles', quantiles)
  quantiles.map((quantileCount, j) => {
    for (let k = 0; k < quantileCount; k++) {
      spreadQuantiles.push(j);
    }
  });
  console.log('spreadQuantiles', spreadQuantiles)
  const sampleThreshold = 70; // GTEx sample threshold
  const bandwidth = samples >= sampleThreshold ? 0.7 : 1.5;
  const numBins = 64;
  const kde = density1d(
    spreadQuantiles, {bins: numBins, bandwidth}
  );
  const rawKdeArray = Array.from(kde);
  console.log('rawKdeArray', rawKdeArray)
  const kdeArray = rawKdeArray
    .filter(point => 0 <= point.x && point.x <= 10);
  if (kdeArray.length === 0) return '';
  const maxKernelY = Math.max(...kdeArray.map(p => p.y));
  console.log('kdeArray', kdeArray);
  const minKernelX = kdeArray[0].x;
  const maxKernelX = kdeArray.slice(-1)[0].x;
  const kdeWidth = maxKernelX - minKernelX;
  const offsetsWidth = offsets.max - offsets.min;

  const pixelsPerKernel = offsetsWidth/kdeWidth;

  const bottom = height + y;
  const rawPoints = kdeArray.map(point => {
    // const pointX = (offsets.max - 10) * (point.x / numQuantiles);
    // const pointX = offsetsWidth * ((point.x / numQuantiles)) + offsets.min - 10;
    // if (point.x)
    const pointX = (point.x - minKernelX) * pixelsPerKernel + offsets.min;
    let pointY = bottom - height * (point.y / maxKernelY);
    // pointY = pointY > (bottom) ? (bottom) : pointY;
    return `${pointX},${pointY}`;
  })
  const point1 = rawPoints[0];
  rawPoints.push(offsets.min + ',' + bottom);
  rawPoints.push(point1);
  const points = rawPoints.join(' ');


  console.log('offsets', offsets);
  console.log('kdeArray', kdeArray);
  console.log('pixelsPerKernel', pixelsPerKernel);
  console.log('points', points);
  const violinAttrs =
    `fill="${color}" ` +
    `stroke="${borderColor}" ` +
    `points="${points}"`;

  const violin = `<polyline ${violinAttrs} />`;

  return violin;
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

    const expression = teObject.expression;
    const quantiles = expression.quantiles;

    const median = expression.median;
    const q1 = expression.q1;
    const q3 = expression.q3;
    const max = expression.max;
    const min = expression.min;
    const numSamples = teObject.samples;
    const offsets = teObject.px;
    const width = offsets.q3 - offsets.q1;
    const x = offsets.q1;

    const tippyTxt =
      `Expression:<br/>` +
      `Min.: <b>${min}</b> (${Math.round(offsets.min)} px)<br/>` +
      `Q1: <b>${q1}</b> (${Math.round(offsets.q1)} px)<br/>` +
      `Median: <b>${median}</b> (${Math.round(offsets.median)} px)<br/>` +
      `Q3: <b>${q3}</b> (${Math.round(offsets.q3)} px)<br/>` +
      `Max.: <b>${max}</b> (${Math.round(offsets.max)} px)<br/>` +
      `Samples: <b>${numSamples}</b><br/>` +
      `<span style='font-size: 9px;'>Source: GTEx</span>`;
    const tippyAttr = `data-tippy-content="${tippyTxt}"`;

    const [whiskers, medianLine] = getBoxPlot(
      offsets, y, height, color, tippyAttr
      );

    console.log('')
    console.log('expression', expression)
    const violin = getViolin(
      teObject, y, height, color, borderColor
    );
    console.log('medianLine', medianLine)

    const boxAttrs =
      `height="${height - 0.5}" ` +
      `width="${width}" ` +
      `x="${x}" ` +
      `y="${y}" ` +
      `fill="${color}" ` +
      `stroke="${borderColor}" stroke-width="1px" `
      ;

    const containerAttrs =
      `height="${height - 0.5}" ` +
      `width="80px" ` +
      'fill="#FFF" ' +
      'opacity="0" ' +
      `x="0" ` +
      `y="${y}" ` +
      'class="_ideoExpressionTrace"';

    const textAttrs =
      `y="${y + height - 1.5}" ` +
      `style="font-size: ${height}px;" ` +
      'x="90"';

    return (
      `<g>' +
      <text ${textAttrs}>${tissue}</text>` +
      // whiskers.min +
      // `<rect ${boxAttrs} />` +
      violin +
      medianLine +
      // whiskers.max +
      `<rect ${containerAttrs} />` +
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
    });
    trace.addEventListener('mouseleave', () => {
      medianLine.dispatchEvent(new Event('mouseleave'));
    });
  });

  tippy(
    '._ideoExpressionMedian',
    getTippyConfig()
  );
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
