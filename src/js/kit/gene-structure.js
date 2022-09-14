function addSpliceToggleListeners(ideo) {
  const container = document.querySelector('._ideoGeneStructureContainer');
  const toggler = document.querySelector('._ideoSpliceToggle');

  if (!container) return;

  const geneDom = document.querySelector('#ideo-related-gene');
  const gene = geneDom.textContent;
  toggler.addEventListener('change', (event) => {
    toggleGeneStructure(gene, ideo);
    event.stopPropagation();
  });
}

function addHoverListeners(ideo) {
  const subparts = document.querySelectorAll('._ideoGeneStructure rect');
  const container = document.querySelector('._ideoGeneStructureContainer');
  function getFooter() {
    return document.querySelector('._ideoGeneStructureFooter');
  }

  container.addEventListener('mouseenter', event => {
    const footer = getFooter();
    // ideo.originalTooltipFooter = footer.textContent;
    const svg = container.querySelector('svg');
    const transcriptSummary = svg.getAttribute('data-ideo-footer');
    footer.innerHTML = `&nbsp;<br/>${transcriptSummary}`;
  });
  container.addEventListener('mouseleave', event => {
    const footer = getFooter();
    footer.innerHTML = '';
  });

  subparts.forEach(subpart => {
    subpart.addEventListener('mouseenter', event => {
      const footer = getFooter();
      ideo.originalTooltipFooter = footer.innerHTML;
      const subpartText = subpart.getAttribute('data-subpart');
      const trimmedFoot =
        footer.innerHTML
          .replace('&nbsp;', '')
          .replace('<br>Transcript name', 'Transcript name');
      footer.innerHTML = `<br/>${subpartText}${trimmedFoot}`;
    });
    subpart.addEventListener('mouseleave', event => {
      const footer = getFooter();
      footer.innerHTML = ideo.originalTooltipFooter;
    });
  });
}

export function addGeneStructureListeners(ideo) {
  addSpliceToggleListeners(ideo);
  addHoverListeners(ideo);
}

function getSpliceToggle(ideo) {
  const cls = 'class="_ideoSpliceToggle"';
  const title = `title="Click to toggle introns"`;
  const checked = ideo.omitIntrons ? 'checked' : '';
  const inputAttrs =
    `type="checkbox" ${checked} ` +
    `style="position: relative; top: 1.5px; cursor: pointer;"`;
  const style =
    'style="position: relative; top: -5px; margin-left: 20px; ' +
    'float: right; cursor: pointer;"';
  const attrs = `${cls} ${style} ${title}`;

  const label = `<label ${attrs}><input ${inputAttrs} />Splice</label>`;
  return label;
}

/** Splice out introns from transcript, leaving only exons */
function spliceTranscript(subparts) {
  const splicedSubparts = [];
  let prevEnd = 0;
  let prevStart = 0;
  for (let i = 0; i < subparts.length; i++) {
    const subpart = subparts[i];
    const [subpartType, start, length] = subpart;
    const splicedStart = (start === prevStart) ? start : prevEnd;
    const splicedEnd = splicedStart + length;
    splicedSubparts.push([subpartType, splicedStart, length]);
    prevEnd = splicedEnd;
    prevStart = splicedStart;
  }
  return splicedSubparts;
}

function toggleGeneStructure(gene, ideo) {
  ideo.omitIntrons = 'omitIntrons' in ideo ? !ideo.omitIntrons : true;
  const svg = getGeneStructureSvg(gene, ideo, ideo.omitIntrons);
  document.querySelector('._ideoGeneStructure').innerHTML = svg;
}

function getGeneStructureSvg(gene, ideo, omitIntrons=false) {
  if (
    'geneStructureCache' in ideo === false ||
    gene in ideo.geneStructureCache === false
  ) {
    return null;
  }

  const geneStructure = ideo.geneStructureCache[gene];
  const strand = geneStructure.strand;

  const subparts = geneStructure.subparts;
  let sortedSubparts = subparts.sort((a, b) => {
    return a[1] - b[1];
    // if (a[0] === 'exon' && b[0] !== 'exon') return -1;
    // if (a[0] !== 'exon' && b[0] === 'exon') return 1;
  });

  if (omitIntrons) sortedSubparts = spliceTranscript(sortedSubparts);

  const lastSubpart = sortedSubparts.slice(-1)[0];
  const featureLengthBp = lastSubpart[1] + lastSubpart[2];

  const featureLengthPx = 250;

  const bpPerPx = featureLengthBp / featureLengthPx;

  const y = 15;
  const intronHeight = 1;
  const intronColor = 'black';
  const heights = {
    "5'-UTR": 20,
    'exon': 20,
    "3'-UTR": 20
  };

  const colors = {
    "5'-UTR": '#155069',
    'exon': '#DAA521',
    "3'-UTR": '#357089'
  };

  const lineColors = {
    "5'-UTR": '#003049',
    'exon': '#BA8501',
    "3'-UTR": '#155069'
  };

  const geneStructureArray = [];

  const intronPosAttrs =
    `x="0" width="${featureLengthPx}" y="${y + 10}" height="${intronHeight}"`;
  const intronRect =
    `<rect fill="black" ${intronPosAttrs}/>`;

  geneStructureArray.push(intronRect);

  // Set up counters for e.g. "Exon 2 of 4" ("<subpart> <num> of <total>")
  const numBySubpart = {
    "5'-UTR": 0,
    'exon': 0,
    "3'-UTR": 0
  }
  const totalBySubpart = {
    "5'-UTR": 0,
    'exon': 0,
    "3'-UTR": 0
  }

  // Subtle visual delimiter; separates horizontally adjacent fields in UI
  const pipe = `<span style='color: #CCC'>|</span>`;

  // Get counts for e.g. "4" in "Exon 2 of 4"
  for (let i = 0; i < sortedSubparts.length; i++) {
    const subpart = sortedSubparts[i];
    const subpartType = subpart[0];
    if (subpartType in totalBySubpart) {
      totalBySubpart[subpartType] += 1;
    }
  }

  for (let i = 0; i < sortedSubparts.length; i++) {
    const subpart = sortedSubparts[i];
    const subpartType = subpart[0];
    let color = intronColor;
    if (subpartType in colors) {
      color = colors[subpartType];
    }
    let height = intronHeight;
    // const y = subpartType === 'exon' ? 0 : 2.5;
    if (subpartType in heights) {
      height = heights[subpartType];
    }

    // Define subpart position, tooltip footer
    const lengthBp = subpart[2];
    const left = subpart[1] / bpPerPx;
    const length = lengthBp / bpPerPx;
    const pos = `x="${left}" width="${length}" y="${y}" height="${height}"`;
    const cls = `class="${subpartType}" `;

    let data = ''; // TODO: Handle introns better, refine CDS vs. UTR in exons
    if (subpartType in numBySubpart) {
      const total = totalBySubpart[subpartType];
      numBySubpart[subpartType] += 1;
      let subpartNumber = numBySubpart[subpartType];
      if (strand === '-') subpartNumber = total - subpartNumber + 1;
      const numOfTotal = total > 1 ? `${subpartNumber} of ${total} ` : '';
      const prettyType = subpartType[0].toUpperCase() + subpartType.slice(1);
      const html = `${prettyType} ${numOfTotal}${pipe} ${lengthBp} bp`;
      data = `data-subpart="${html}"`;
    }

    // Define subpart border
    const lineHeight = y + height;
    const lineStroke = `stroke="${lineColors[subpartType]}"`;
    const lineAttrs = // "";
      `x1="${left}" x2="${left}" y1="${y}" y2="${lineHeight}" ${lineStroke}`;

    const subpartSvg = (
      `<rect ${cls} rx="1.5" fill="${color}" ${pos} ${data}/>` +
      `<line ${lineAttrs} />`
    );
    geneStructureArray.push(subpartSvg);
  }

  const sharedStyle =
    'position: relative; width: 274px; margin: auto;';
  let transform = `style="${sharedStyle} left: 10px;"`;
  if (strand === '-') {
    transform =
      'transform="scale(-1 1)" ' +
      `style="${sharedStyle} left: -10px;"`;
  }

  const footerData =
  `<br/>Transcript name: ${geneStructure.transcriptName}<br/>` + [
    `Exons: ${totalBySubpart['exon']}`,
      `Biotype: ${geneStructure.biotype.replace(/_/g, ' ')}`,
      `Strand: ${strand}`
    ].join(` ${pipe} `);

  //.join('&#013;'); // Newline, entity-encoded to render in browser default UI
  const geneStructureSvg =
    // `<svg><rect x="5" width="50" y="5" height="10" fill="grey"/></svg>` +
    `<svg class="_ideoGeneStructure" data-ideo-footer="${footerData}" ` +
      `width="${(featureLengthPx + 20)}" height="40" ${transform}` +
    `>` +
      geneStructureArray.join('') +
      // `<rect ` +
      //   `class="_ideoGeneStructureToggle" ${toggleStyle} ${toggleTitle} ` +
      //   `x="5" width="50" y="0" height="10" fill="grey" `+
      // `/>` +
    '</svg>';

  return geneStructureSvg;
}

export function getGeneStructureHtml(annot, ideo, isParalogNeighborhood) {
  let geneStructureHtml = '';
  if (ideo.config.showGeneStructureInTooltip && !isParalogNeighborhood) {
    const omitIntrons = ideo.omitIntrons;
    const gene = annot.name;
    const geneStructureSvg = getGeneStructureSvg(gene, ideo, omitIntrons);
    if (geneStructureSvg) {
      const cls = 'class="_ideoGeneStructureContainer"';
      const toggle = getSpliceToggle(ideo);
      const divStyle = 'style="margin-left: 75px;"';
      const name = 'Canonical transcript';
      geneStructureHtml =
        '<br/><br/>' +
        '<style>' +
          '._ideoGeneStructureContainer {' +
            'display: flex;' +
            'justify-content: center;' +
            'align-items: center;' +
            'flex-direction: column;' +
          '}' +
          '._ideoGeneStructureContainer:hover ._ideoSpliceToggle {' +
            'visibility: visible;' +
          '} ' +
          '._ideoGeneStructureContainer ._ideoSpliceToggle {' +
            'visibility: hidden;' +
          '}' +
          '</style>' +
        `<div ${cls}>` +
        `<div><span ${divStyle}>${name}</span>${toggle}</div>` +
        `${geneStructureSvg}` +
        `<div class="_ideoGeneStructureFooter"></div>` +
        `</div>`;
    }
  }
  return geneStructureHtml;
}
