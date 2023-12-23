import {getTippyConfig, darken} from '../lib';
import tippy from 'tippy.js';

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

function setPxLength(tissueExpressions) {
  const maxPxLength = 80;
  let maxExpression = 0;

  tissueExpressions.map(teObject => {
    const expression = teObject.medianExpression;
    if (expression > maxExpression) {
      maxExpression = expression;
    }
    const pxLength = maxPxLength * expression/maxExpression;
    teObject.pxLength = pxLength;
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

function getExpressionPlotHtml(gene, tissueExpressions, ideo) {
  tissueExpressions = setPxLength(tissueExpressions);

  const height = 12;

  const moreOrLessToggleHtml =
    getMoreOrLessToggle(gene, height, tissueExpressions, ideo);
  const numTissues = !ideo.showTissuesMore ? 10 : 3;

  let y;
  const rects = tissueExpressions.slice(0, numTissues).map((teObject, i) => {
    y = 1 + i * (height + 2);
    const tissue = refineTissueName(teObject.tissue);
    const color = `#${teObject.color}`;
    const borderColor = darken(color, 0.85);
    const tpm = teObject.medianExpression;
    const numSamples = teObject.samples;
    const tippyTxt =
      `Median TPM: <b>${tpm}</b><br/>` +
      `Samples: <b>${numSamples}</b><br/>` +
      `<span style='font-size: 9px;'>Source: GTEx</span>`;
    const tippyAttr = `data-tippy-content="${tippyTxt}"`;
    const rectAttrs =
      `height="${height - 0.5}" ` +
      `width="${teObject.pxLength}" ` +
      `x="${85 - teObject.pxLength}" ` +
      `y="${y}" ` +
      `fill="${color}" ` +
      `stroke="${borderColor}" stroke-width="1px" ` +
      'class="_ideoExpressionTrace" ' +
      tippyAttr;

    const textAttrs =
      `y="${y + height - 1.5}" ` +
      `style="font-size: ${height}px;" ` +
      'x="90" ' +
      'class="_ideoExpressionTissueName"';

    return `<text ${textAttrs}>${tissue}</text><rect ${rectAttrs} />`;
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

  tippy(
    '._ideoExpressionTrace',
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
