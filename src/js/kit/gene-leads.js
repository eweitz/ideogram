export function _toggleDEDetail(showDetail) {
  const detailDisplay = showDetail ? '' : 'none';
  const summaryDisplay = showDetail ? 'none' : '';
  document.querySelector('._ideoDEDetail').style.display = detailDisplay;
  document.querySelector('._ideoDESummary').style.display = summaryDisplay;
}

/** Parse differential expression items, return as table for tooltip */
function parseDE(items) {

  if (items.length < 1) return '';

  const rows = '<tbody><tr>' + items.map(item => {
    return (
      `<td>${item.group}</td>` +
      `<td>${item.log2fc}</td>` +
      `<td>${item.adjustedPval}</td>` +
      `<td>${item.scoresRank}</td>`
    );
  }).join('</tr><tr>') + '</tr></tbody>';

  const thCells = ['Group', 'log2(FC)', 'Adj. p-value', 'Rank in group'];
  const head =
    `<thead><th>${thCells.join('</th><th>')}</th></thead>`;

  const prettyGroups = items.map(item => item.group + '<br/>').join('');
  // eslint-disable-next-line max-len
  // const style='style="text-decoration: underline; text-decoration-style: dotted"';
  const title = 'title="Gene was in top 2% of DE scores for each group"';
  const preamble = `<span ${title}>Differentially expressed in</span>:<br/>`;
  // const moreStyle = 'style="' +
  //   'padding: 3px; border-radius: 3px; border: 1px solid #CCC; ' +
  //   'margin-left: 5px;' +
  // '"';
  // const moreAttrs = `${moreStyle} class="_ideoDifferentialExpressionMore"`;
  // const more = `<span ${moreAttrs}>...</span>`;
  const onMouseEnterDE = `onMouseEnter="Ideogram.toggleDEDetail(true);"`;
  const onMouseLeaveDE = `onMouseLeave="Ideogram.toggleDEDetail(false);"`;
  const summary = `<div class="_ideoDESummary">${prettyGroups}</div>`;

  const detailStyle = 'style="display: none; margin-top: 15px;"';
  const detail =
    `<div class="_ideoDEDetail" ${detailStyle}>` +
      `<table>${head + rows}</table>` +
    `</div>`;
  const result =
    `<br/><br/>` +
    `<div class="_ideoDESection" ${onMouseEnterDE} ${onMouseLeaveDE}>` +
      preamble + summary + detail +
      '<style>' +
        '._ideoDEDetail table { width: 375px; margin: 0 auto;}' +
        '._ideoDEDetail tr { padding: 2px; }' +
      '</style>' +
    '</div>';
  // const result = `<br/><br/>${detail}`;

  return result;
}

/** Called immediately before displaying features along chromosomes */
export function onDrawGeneLeadsAnnots(ideo) {
  if (ideo.config.relatedGenesMode !== 'leads') return;

  const deInnerFields =
    ideo.rawAnnots.innerKeysByField['differentialExpression'];

  const chrAnnots = ideo.annots;

  for (let i = 0; i < chrAnnots.length; i++) {
    const annots = chrAnnots[i].annots;

    for (let j = 0; j < annots.length; j++) {
      const annot = annots[j];
      const numMentions = annot.publicationMentions;
      const s = numMentions > 1 ? 's' : '';
      const pubDesc = `Mentioned ${numMentions} time${s} in linked publication`;
      const deDesc = parseDE(annot.differentialExpression, deInnerFields);

      const desc = pubDesc + deDesc;

      ideo.annotDescriptions.annots[annot.name].description = desc;
    }

  }
}
