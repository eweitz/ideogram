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

function getExpressionPlotHtml(gene, tissueExpressions, ideo) {
  tissueExpressions = setPxLength(tissueExpressions);

  const height = 12;

  const gtexUrl = `https://www.gtexportal.org/home/gene/${gene}`;
  const pipeStyle =
    'style="margin: 0 6px; color: #CCC;"';
  const gtexLink =
    `<a href="${gtexUrl}" target="_blank">GTEx</a>`;
  const details =
    `<span ${pipeStyle}>|</span><i>Full detail: ${gtexLink}</i>`;
  const moreOrLess =
    !ideo.showTissuesMore ? `Less...` : 'More...';
  const mlStyle = 'style="cursor: pointer;px;"';
  const numTissues = !ideo.showTissuesMore ? 10 : 3;
  const left = `left: ${!ideo.showTissuesMore ? 10 : -41}px;`;
  const top = 'top: -2px;';
  const mltStyle =
    `style="position: relative; ${left} ${top} font-size: ${height}px"`
  const moreOrLessToggleHtml =
    `<div ${mltStyle}>` +
      `<a class="_ideoMoreOrLessTissue" ${mlStyle}>${moreOrLess}</a>` +
      `${!ideo.showTissuesMore ? details : ''}` +
    `</div>`;

  let y;
  const rects = tissueExpressions.slice(0, numTissues).map((teObject, i) => {
    y = 1 + i * (height + 2);
    const tissue = refineTissueName(teObject.tissue);
    const color = `#${teObject.color}`;
    const borderColor = darken(color, 0.85);
    const tpm = teObject.medianExpression;
    const tippyTxt = `${tpm} median TPM in GTEx`;
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
      `x="90"`;

    return `<text ${textAttrs}>${tissue}</text><rect ${rectAttrs} />`;
  }).join('');

  const plotAttrs = `style="margin-top: 0px; margin-bottom: 15px;"`;
  const tippyTxt = 'Top tissues by median gene expression, per GTEx';
  const tippyAttr = `data-tippy-content="${tippyTxt}"`;
  const cls = 'class="_ideoTissuePlotTitle"'
  const titleAttrs = `${cls} style="margin-bottom: 4px;" ${tippyAttr}`;
  const plotHtml =
    `<div class="_ideoTissueExpressionPlot" ${plotAttrs}>
      <div ${titleAttrs}>Typically most expressed in:</div>
      <svg height="${y + height + 2}">${rects}</svg>
      ${moreOrLessToggleHtml}
    </div>`;
  return plotHtml;
}

function removePlot() {
  const plot = document.querySelector('._ideoTissueExpressionPlot');
  if (plot) {
    plot.remove();
  }
}

function showTissueExpressionPlot(ideo, fromMoreOrLess) {
  if (!fromMoreOrLess) {
    ideo.showTissues = !ideo.showTissues;
  }
  const showTissues = ideo.showTissues;
  if (!showTissues) {
    removePlot();
    return;
  }

  const geneDom = document.querySelector('#ideo-related-gene');
  const gene = geneDom.innerText;
  const tissueExpressions = ideo.tissueExpressionsByGene[gene];
  if (!tissueExpressions) return;
  const expressionPlotHtml =
    getExpressionPlotHtml(gene, tissueExpressions, ideo);

  const gsDom = document.querySelector('._ideoGeneStructureContainer');
  gsDom.insertAdjacentHTML('beforebegin', expressionPlotHtml);

  tippy(
    '._ideoTissuePlotTitle[data-tippy-content], ' +
    '._ideoExpressionTrace',
    getTippyConfig()
  );

  document.querySelector('._ideoMoreOrLessTissue')
    .addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      ideo.showTissuesMore = !ideo.showTissuesMore;
      removePlot();
      showTissueExpressionPlot(ideo, true);
    });
}

export function addTissueListeners(ideo) {
  const tissueIconDom = document.querySelector('._ideoGeneTissues');
  if (!tissueIconDom) return; // e.g., miRNA genes
  if (ideo.showTissuesMore === undefined) {
    ideo.showTissuesMore = true;
  }
  tissueIconDom.addEventListener('click', (event) => {
    event.stopPropagation();
    event.preventDefault();
    showTissueExpressionPlot(ideo);
  });
}

export function getTissueHtml(annot, ideo) {
  if (!ideo.tissueCache || !(annot.name in ideo.tissueCache.byteRangesByName)) {
    return '';
  }
  const tissueExpressions =
    ideo.tissueExpressionsByGene[annot.name].slice(0, 3);

  const topTissueFirstLetter = tissueExpressions.map(
    teObject => refineTissueName(teObject.tissue)
  )[0][0].toUpperCase();

  const tissueColor = `#${tissueExpressions[0].color}`;
  const tissueTooltip =
    `data-tippy-content="Explore reference tissue expression" `;
  const tissueStyle =
    'style="float: right; border-radius: 4px; ' +
    'margin-right: 8px; padding: 4px 0 3.5px 0; ' +
    `border: 1px solid #CCC; cursor: pointer;"`;
  const tissueAttrs =
    `class="_ideoGeneTissues" ${tissueStyle} ${tissueTooltip}`;
  const innerStyle =
    `style="border: 1px solid ${tissueColor}; border-radius: 4px; ` +
    'background-color: #EEE; padding: 3px 8px; "';

  const tissueHtml =
    `<span ${tissueAttrs}>` +
      `<span ${innerStyle}>${topTissueFirstLetter}</span>` +
    '</span>';

  return tissueHtml;
}
