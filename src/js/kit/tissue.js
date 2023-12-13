import {getTextSize} from '../lib';

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

  name = name[0].toUpperCase() + name.slice(1);
  return name;
}

function setPxLength(tissueExpressions) {
  const maxPxLength = 85;
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

function getExpressionPlotHtml(tissueExpressions) {
  tissueExpressions = setPxLength(tissueExpressions);

  const rects = tissueExpressions.map((teObject, i) => {
    const height = 12;
    const y = i * (height + 2);
    const tissue = refineTissueName(teObject.tissue);

    const rectAttrs =
      `height="${height}" ` +
      `width="${teObject.pxLength}" ` +
      `x="${85 - teObject.pxLength}" ` +
      `y="${y}" ` +
      `fill="#${teObject.color}"`;
    const textAttrs =
      `y="${y + height - 2}" ` +
      `style="font-size: 11px;" ` +
      `x="${90} "`;

    return `<text ${textAttrs}>${tissue}</text><rect ${rectAttrs} />`;
  }).join('');

  const plotAttrs = `style="margin-top: 15px"`;
  const plotHtml =
    `<div ${plotAttrs}>
      <div>Tissue expression, per GTEx:</div>
      <br/>
      <svg>${rects}</svg>
    </div>`;
  return plotHtml;
}

export function addTissueListeners(ideo) {
  const tissueIconDom = document.querySelector('._ideoGeneTissues');
  tissueIconDom.addEventListener('click', (event) => {
    const geneDom = document.querySelector('#ideo-related-gene');
    const gene = geneDom.innerText;
    const tissueExpressions = ideo.tissueExpressionsByGene[gene];
    const expressionPlotHtml = getExpressionPlotHtml(tissueExpressions);

    const geneDomParent = geneDom.parentElement;
    geneDomParent.insertAdjacentHTML('afterend', expressionPlotHtml);
    event.stopPropagation();
    event.preventDefault();
  });
}

export function getTissueHtml(annot, ideo) {
  if (!ideo.tissueCache || !(annot.name in ideo.tissueCache.byteRangesByName)) {
    return '';
  }
  const tissueExpressions =
    ideo.tissueExpressionsByGene[annot.name].slice(0, 3);

  const tissueNames = tissueExpressions.map(
    teObject => refineTissueName(teObject.tissue)
  );

  const openLi = '<li style="list-style-type: inherit">';
  const joinedTissueNames =
    '<ul style="padding-inline-start: 20px;">' +
      `${openLi}${tissueNames.join(`</li>${openLi}`)}</li>` +
    '</ul>';

  const tissueColor = `#${tissueExpressions[0].color}`;
  const tissueText = `Most expressed in:${joinedTissueNames}`;
  const tissueTooltip =
    `data-tippy-content='${tissueText}' `;
  const tissueStyle =
    'style="float: right; border-radius: 4px; ' +
    'margin-right: 8px; padding: 4px 0 3.5px 0; ' +
    `border: 1px solid #CCC;"`;

  const tissueAttrs =
    `class="_ideoGeneTissues" ${tissueStyle} ${tissueTooltip}`;
  const innerStyle =
    `style="border: 1px solid ${tissueColor}; border-radius: 4px; ` +
    'background-color: #EEE; padding: 3px 8px; "';
  const topTissueFirstLetter = tissueNames[0][0].toUpperCase();
  const tissueHtml =
    `<span ${tissueAttrs}>` +
      `<span ${innerStyle}>${topTissueFirstLetter}</span>` +
    '</span>';

  return tissueHtml;
}
