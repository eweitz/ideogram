function addSpliceToggleListeners(ideo) {
  const container = document.querySelector('._ideoGeneStructureContainer');
  const toggler = document.querySelector('._ideoSpliceToggle');

  if (!container) return;

  const geneDom = document.querySelector('#ideo-related-gene');
  const gene = geneDom.textContent;
  toggler.addEventListener('change', (event) => {
    toggleGeneStructure(gene, ideo);
    addHoverListeners(ideo);
    event.stopPropagation();
  });
}

function nextIsOutOfSubpartBounds(i, subparts, key) {
  const isLeft = key === 'left';
  return (
    i === 0 && isLeft ||
    i === subparts.length - 1 && !isLeft
  );
}

/**
 * Swap genome-ordered subparts so they render with expected visual layering
 *
 * SVG elements render last-on-top, which often hides subparts UTRs at the
 * ends of transcripts when they're genomically ordered, as they are in e.g.
 * Ensembl.
 *
 * See also: swapEndDomSubpartsBack
 */
function swapEndSubpartsForward(sortedSubparts, strand) {
  const firstSubpart = sortedSubparts[0];
  if (
    strand === '-' && firstSubpart[0] === "3'-UTR" ||
    strand === '+' && firstSubpart[0] === "5'-UTR"
  ) {
    const secondSubpart = sortedSubparts[1];
    sortedSubparts.splice(0, 1, secondSubpart);
    sortedSubparts.splice(1, 1, firstSubpart);
  }

  return sortedSubparts;
}

/**
 * Restore SVG subparts to genome order, for proper keyboard navigation
 *
 * See also: swapEndSubpartsForward
 */
function swapEndDomSubpartsBack(strand, subparts) {
  const isPositiveStrand = strand === '+';
  const subpart2 = subparts[1];
  if (
    !isPositiveStrand && subpart2.classList.contains('three-prime-utr') ||
    isPositiveStrand && subpart2.classList.contains('five-prime-utr')
  ) {
    const subpart1 = subparts[0];
    subparts.splice(0, 1, subpart2);
    subparts.splice(1, 1, subpart1);
  }
  return subparts;
}

/**
 * Remove any hover stroke outlines, for subpart highlight edge cases like
 * mouseenter in subpart A while distant subpart B is navigated
 */
function removeHighlights() {
  const cls = '_ideoHoveredSubpart';
  const hovereds = document.querySelectorAll(`.${cls}`);
  hovereds.forEach(el => el.classList.remove(cls));
}

/** Go to previous subpart on left arrow; next on right */
function navigateSubparts(event) {
  const domSubparts = Array.from(document.querySelectorAll('rect.subpart'));

  const structure = document.querySelector('._ideoGeneStructure');
  const strand = structure.getAttribute('data-ideo-strand');
  const isPositiveStrand = strand === '+';

  const subparts = swapEndDomSubpartsBack(strand, domSubparts);

  if (subparts.length === 0) return; // E.g. paralog neighborhoods, lncRNA
  const cls = '_ideoHoveredSubpart';
  const subpart = document.querySelector(`.${cls}`);
  let i;
  subparts.forEach((el, index) => {
    if (el.classList.contains(cls)) {
      i = index;
    }
  });

  const options = {view: window, bubbles: false, cancelable: true};
  const mouseEnter = new MouseEvent('mouseenter', options);
  const mouseLeave = new MouseEvent('mouseleave', options);

  // Account for strand, so left key always goes left; right always right
  const left = isPositiveStrand ? 'ArrowLeft' : 'ArrowRight';
  const right = isPositiveStrand ? 'ArrowRight' : 'ArrowLeft';
  let key;
  if (event.key === left) {
    key = 'left';
  } else if (event.key === right) {
    key = 'right';
  }

  if (
    typeof key === 'undefined' ||
    nextIsOutOfSubpartBounds(i, subparts, key)
  ) {
    event.stopPropagation();
    event.preventDefault();
    return;
  }

  removeHighlights();
  const alt = event.altKey;
  const meta = event.metaKey;
  if (event.key === left) { // Jump back
    subpart.dispatchEvent(mouseLeave);
    let index = i - 1;
    if (alt) index = i - 10 < 0 ? 0 : i - 10;
    if (meta) index = 0;
    const prevSubpart = subparts[index];
    prevSubpart.dispatchEvent(mouseEnter);
  } else if (event.key === right) { // Jump forward
    subpart.dispatchEvent(mouseLeave);
    const last = subparts.length - 1;
    let index = i + 1;
    if (alt) index = i + 10 > last ? last : i + 10;
    if (meta) index = last;
    const nextSubpart = subparts[index];
    nextSubpart.dispatchEvent(mouseEnter);
  }
  event.stopPropagation();
  event.preventDefault();
}

/**
 * Add handlers for hover events in transcript container and beneath, e.g.:
 *
 * - Show transcript details on hovering near transcript
 * - Show subpart (i.e. exon, 3'-UTR, 5'-UTR) details on hovering over subpart
 * - Highlight subpart on hovering over subpart
 * - Navigate to previous or next subpart on pressing left or right arrow keys
 */
function addHoverListeners(ideo) {
  const subparts = document.querySelectorAll('rect.subpart');
  if (subparts.length === 0) return; // E.g. paralog neighborhoods, lncRNA

  ideo.subparts = subparts;

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
    document.addEventListener('keydown', navigateSubparts);
  });
  container.addEventListener('mouseleave', event => {
    const footer = getFooter();
    footer.innerHTML = '';
    document.removeEventListener('keydown', navigateSubparts);
  });

  subparts.forEach((subpart, i) => {

    // On hovering over subpart, highlight it and show details
    subpart.addEventListener('mouseenter', event => {
      removeHighlights();

      // Highlight hovered subpart, adding an aura around it
      event.target.classList.add('_ideoHoveredSubpart');

      // Show details
      const footer = getFooter();
      ideo.originalTooltipFooter = footer.innerHTML;
      const subpartText = subpart.getAttribute('data-subpart');
      const trimmedFoot =
        footer.innerHTML
          .replace('&nbsp;', '')
          .replace('<br>Transcript name', 'Transcript name');
      footer.innerHTML = `<br/>${subpartText}${trimmedFoot}`;
    });

    // On hovering out, de-highlight and hide details
    subpart.addEventListener('mouseleave', event => {
      event.target.classList.remove('_ideoHoveredSubpart');
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
function spliceOut(subparts) {
  const splicedSubparts = [];
  let prevEnd = 0;
  let prevStart = 0;
  for (let i = 0; i < subparts.length; i++) {
    const subpart = subparts[i];
    const [subpartType, start, length] = subpart;
    const isUTR = start === prevStart;
    const splicedStart = isUTR ? start : prevEnd;
    const splicedEnd = splicedStart + length;
    splicedSubparts.push([subpartType, splicedStart, length + 1]);
    prevEnd = splicedEnd;
    prevStart = splicedStart;
  }
  return splicedSubparts;
}

/** Splice in introns to transcript, making introns explicit subparts */
function spliceIn(subparts) {
  const splicedSubparts = [];
  let prevEnd = 0;
  for (let i = 0; i < subparts.length; i++) {
    const subpart = subparts[i];
    const [start, length] = subpart.slice(1);
    if (start > prevEnd) {
      const intronStart = prevEnd;
      const intronLength = start - prevEnd - 1;
      splicedSubparts.push(['intron', intronStart, intronLength]);
    }
    prevEnd = start + length;
    splicedSubparts.push(subpart);
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
  });

  if (omitIntrons) {
    sortedSubparts = spliceOut(sortedSubparts);
  } else {
    sortedSubparts = spliceIn(sortedSubparts);
  }


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
    'intron': 20,
    "3'-UTR": 20
  };

  const colors = {
    "5'-UTR": '#155069',
    'exon': '#DAA521',
    "intron": '#FFFFFF00',
    "3'-UTR": '#357089',
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
    'intron': 0,
    "3'-UTR": 0
  }
  const totalBySubpart = {
    "5'-UTR": 0,
    'exon': 0,
    'intron': 0,
    "3'-UTR": 0
  }
  const classes = {
    "5'-UTR": 'five-prime-utr',
    'exon': 'exon',
    "3'-UTR": 'three-prime-utr',
    'intron': 'intron'
  }

  // Subtle visual delimiter; separates horizontally adjacent fields in UI
  const pipe = `<span style='color: #CCC'>|</span>`;

  sortedSubparts = swapEndSubpartsForward(sortedSubparts, strand);

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
    const cls = `class="subpart ${classes[subpartType]}" `;

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
  const geneStructureSvg =
    `<svg class="_ideoGeneStructure" ` +
      `data-ideo-strand="${strand}" data-ideo-footer="${footerData}" ` +
      `width="${(featureLengthPx + 20)}" height="40" ${transform}` +
    `>` +
      geneStructureArray.join('') +
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
          '._ideoGeneStructureContainer rect:hover + line {' +
            'visibility: hidden;' +
          '}' +
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
          '._ideoHoveredSubpart {' +
            'stroke: #D0D0DD !important; stroke-width: 3px;' +
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
