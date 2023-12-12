/** Copyedit machine-friendly tissue name to human-friendly GTEx convention */
function refineName(rawName) {
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

export function getTissueHtml(annot, ideo) {
  if (!ideo.tissueCache || !(annot.name in ideo.tissueCache.byteRangesByName)) {
    return '';
  }
  const tissueExpressions =
    ideo.tissueExpressionsByGene[annot.name].slice(0, 3);

  const tissueNames = tissueExpressions.map(
    teObject => refineName(teObject.tissue)
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
