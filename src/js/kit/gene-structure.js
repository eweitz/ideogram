function getSpliceToggle(ideo) {
  const cls = 'class="_ideoSpliceToggle"';
  const inOrOut = ideo.omitIntrons ? 'in' : 'out';
  const title = `title="Click to splice ${inOrOut} introns"`;
  const checked = ideo.omitIntrons ? 'checked' : '';
  const inputAttrs =
    `type="checkbox" ${checked} style="position: relative; top: 1.5px;"`;
  const style =
    'style="position: relative; top: -5px; margin-right: 11px; ' +
    'float: right; cursor: pointer;"';
  const attrs = `${cls} ${style} ${title}`;

  const label = `<label ${attrs}><input ${inputAttrs}}/>Splice</label>`;
  return label;
}

export function getGeneStructureHtml(annot, ideo, isParalogNeighborhood) {
  let geneStructureHtml = '';
  if (ideo.config.showGeneStructureInTooltip && !isParalogNeighborhood) {
    const omitIntrons = ideo.omitIntrons;
    const gene = annot.name;
    const geneStructureSvg = getGeneStructureSvg(gene, ideo, omitIntrons);
    if (geneStructureSvg) {
      const toggle = getSpliceToggle(ideo);
      const divStyle = 'style="position: relative; left: 30px;"';
      geneStructureHtml =
        '<br/><br/>' +
        `<div><span ${divStyle}>Canonical transcript</span>${toggle}</div>` +
        `${geneStructureSvg}`;

      addGeneStructureListeners(ideo);
    }
  }
  return geneStructureHtml;
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

function addGeneStructureListeners(ideo) {
  setTimeout(function() {
    const toggler = document.querySelector('._ideoSpliceToggle');

    if (!toggler) return;

    const geneDom = document.querySelector('#ideo-related-gene');
    const gene = geneDom.textContent;
    toggler.addEventListener('change', (event) => {
      console.log('in toggler change handler, event:')
      console.log(event)
      toggleGeneStructure(gene, ideo);
      event.stopPropagation();
    });
  }, 100);
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

  let numExons = 0;

  for (let i = 0; i < sortedSubparts.length; i++) {
    const subpart = sortedSubparts[i];
    const subpartType = subpart[0];
    let color = intronColor;
    if (subpartType in colors) {
      color = colors[subpartType];
    }
    if (subpartType === 'exon') {
      numExons += 1;
    }
    let height = intronHeight;
    // const y = subpartType === 'exon' ? 0 : 2.5;
    if (subpartType in heights) {
      height = heights[subpartType];
    }
    const left = subpart[1] / bpPerPx;
    const length = subpart[2] / bpPerPx;
    const pos = `x="${left}" width="${length}" y="${y}" height="${height}"`;
    const lineHeight = y + height;
    const lineStroke = `stroke="${lineColors[subpartType]}"`;
    const lineAttrs = // "";
      `x1="${left}" x2="${left}" y1="${y}" y2="${lineHeight}" ${lineStroke}`;
    const stroke = `stroke-left="black" `;
    const cls = `class="${subpartType}" `;
    const subpartSvg = (
      `<rect ${cls} rx="1.5" fill="${color}" ${pos} ${stroke} />` +
      `<line ${lineAttrs} />`
    );
    geneStructureArray.push(subpartSvg);
  }

  const sharedStyle =
    'position: relative; width: 274px; margin: auto;';
  let transform = `style="${sharedStyle} left: 10px;"`;
  if (geneStructure.strand === '-') {
    transform =
      'transform="scale(-1 1)" ' +
      `style="${sharedStyle} left: -10px;"`;
  }

  const titleData = [
    `Transcript name: ${geneStructure.transcriptName}`,
    `Exons: ${numExons}`,
    `Biotype: ${geneStructure.biotype.replace(/_/g, ' ')}`,
    `Strand: ${geneStructure.strand}`
  ].join('&#013;'); // Newline, entity-encoded to render in browser default UI
  const geneStructureSvg =
    // `<svg><rect x="5" width="50" y="5" height="10" fill="grey"/></svg>` +
    `<svg class="_ideoGeneStructure" ` +
      `width="${(featureLengthPx + 20)}" height="40" ${transform}` +
    `>` +
      `<title>${titleData}</title>` +
      geneStructureArray.join('') +
      // `<rect ` +
      //   `class="_ideoGeneStructureToggle" ${toggleStyle} ${toggleTitle} ` +
      //   `x="5" width="50" y="0" height="10" fill="grey" `+
      // `/>` +
    '</svg>';

  return geneStructureSvg;
}
