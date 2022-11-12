import {d3} from '../lib';

const y = 15;


// Subtle visual delimiter; separates horizontally adjacent fields in UI
const pipe = `<span style='color: #CCC'>|</span>`;

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
  "3'-UTR": '#357089'
};

const lineColors = {
  "5'-UTR": '#70A099',
  'exon': '#BA8501',
  "3'-UTR": '#90C0B9'
};

const subpartClasses = {
  "5'-UTR": 'five-prime-utr',
  'exon': 'exon',
  "3'-UTR": 'three-prime-utr',
  'intron': 'intron'
};

const css =
  `<style>
  ._ideoGeneStructureContainerName {
    margin-left: 81px;
  }
  ._ideoGeneStructureContainerName.pre-mRNA {
    margin-left: 69px;
  }
  ._ideoGeneStructureContainer rect:hover + line {
    visibility: hidden;
  }
  ._ideoGeneStructureContainer {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
  ._ideoGeneStructureContainer:hover ._ideoSpliceToggle {
    visibility: visible;
  }
  ._ideoGeneStructureContainer ._ideoSpliceToggle {
    visibility: hidden;
  }
  ._ideoSpliceToggle {
    margin-left: 53px; background-color: #EEE;
  }
  ._ideoSpliceToggle.pre-mRNA {
    margin-left: 43px; background-color: #F8F8F8;
  }
  ._ideoHoveredSubpart {
    stroke: #D0D0DD !important; stroke-width: 3px;
  }
  </style>`;

/** Get DOM element for gene structure footer */
function getFooter() {
  return document.querySelector('._ideoGeneStructureFooter');
}

/** Write transcript details below the diagram */
function writeFooter(container) {
  const footer = getFooter();
  const svgDOM = container.querySelector('svg');
  const transcriptSummary = svgDOM.getAttribute('data-ideo-footer');
  footer.innerHTML = `&nbsp;<br/>${transcriptSummary}`;
}

/** Write newly-selected gene structure diagram, header, and footer */
function updateGeneStructure(ideo, offset=0) {
  const [structure, selectedIndex] = getSelectedStructure(ideo, offset);
  const isCanonical = (selectedIndex === 0);
  const menu = document.querySelector('#_ideoGeneStructureMenu');
  menu.options[selectedIndex].selected = true;
  const svg = getSvg(structure, ideo, ideo.spliceExons)[0];
  const container = document.querySelector('._ideoGeneStructureSvgContainer');
  container.innerHTML = svg;
  updateHeader(ideo.spliceExons, isCanonical);
  writeFooter(container);
  ideo.addedSubpartListeners = false;
  addHoverListeners(ideo);
}

/** Get gene symbol from transcript / gene structure name */
function getGeneFromStructureName(structureName) {
  const gene = structureName.split('-').slice(0, -1).join('-');
  return gene;
}

/** Get name of transcript currently selected in menu */
function getSelectedStructure(ideo, offset=0) {
  const menu = document.querySelector('#_ideoGeneStructureMenu');
  const numOptions = menu.options.length;
  const baseIndex = menu.selectedIndex;
  let selectedIndex = baseIndex + offset;
  if (selectedIndex >= numOptions) {
    selectedIndex = 0;
  } else if (selectedIndex < 0) {
    selectedIndex = numOptions - 1;
  }
  const structureName = menu.options[selectedIndex].value;
  const gene = getGeneFromStructureName(structureName);
  const geneStructure =
    ideo.geneStructureCache[gene].find(gs => gs.name === structureName);

  return [geneStructure, selectedIndex];
}

/**
 * Add event listeners to the transcript menu:
 * - On click, block upstream listeners from closing tooltip
 * - On change, write newly selected gene structure
 */
function addMenuListeners(ideo) {
  const menuId = '_ideoGeneStructureMenu';
  const menu = document.querySelector('#' + menuId);
  const container = document.querySelector('._ideoGeneStructureContainer');

  // Don't search this gene if clicking to expand the menu
  container.addEventListener('click', (event) => {
    if (event.target.id === menuId) {
      event.stopPropagation();
    }
  });

  document.addEventListener('keydown', (event) => {
    const key = event.key;
    if (['ArrowDown', 'ArrowUp'].includes(key)) {
      const offset = key === 'ArrowDown' ? 1 : -1;
      updateGeneStructure(ideo, offset);
    }
  });
}

function toggleSpliceByKeyboard(event) {
  if (event.key === 's') {
    const spliceToggle = document.querySelector('._ideoSpliceToggle input');
    if (!spliceToggle) return;
    spliceToggle.dispatchEvent(new MouseEvent('click'));
  }
}

/** Listen for keydown and click on / change to splice toggle input */
function addSpliceToggleListeners(ideo) {
  document.addEventListener('keydown', toggleSpliceByKeyboard);

  const container = document.querySelector('._ideoGeneStructureContainer');
  const toggler = document.querySelector('._ideoSpliceToggle');

  if (!container) return;

  toggler.addEventListener('change', (event) => {
    toggleSplice(ideo);
    addHoverListeners(ideo);
    event.stopPropagation();
  });
}

/** Helper for keyboard navigation */
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
 * See also: swapUTRsBack
 */
function swapUTRsForward(subparts, isPositiveStrand) {
  const swappedSubparts = subparts.slice();
  subparts.forEach((subpart, i) => {
    if (i === 0) return;
    const prevSubpart = subparts[i - 1];
    const utr5 = "5'-UTR";
    const utr3 = "3'-UTR";
    if (
      !isPositiveStrand && prevSubpart[0] === utr3 && subpart[0] === 'exon' ||
      isPositiveStrand && prevSubpart[0] === utr5 && subpart[0] === 'exon'
    ) {
      swappedSubparts[i] = prevSubpart;
      swappedSubparts[i - 1] = subpart;
    }
  });

  return swappedSubparts;
}

function has(element, cls) {
  return element.classList.contains(cls);
}

function shouldSwapBackDOM(subpart, nextSubpart, isPositiveStrand) {
  const utr5 = 'five-prime-utr';
  const utr3 = 'three-prime-utr';
  return (
    !isPositiveStrand && has(nextSubpart, utr3) && !has(subpart, utr3) ||
    isPositiveStrand && has(nextSubpart, utr5) && !has(subpart, utr5)
  );
}

function shouldSwapBackData(subpart, nextSubpart, isPositiveStrand) {
  const utr5 = "5'-UTR";
  const utr3 = "3'-UTR";
  return (
    !isPositiveStrand && nextSubpart[0] === utr3 && subpart[0] !== utr3 ||
    isPositiveStrand && nextSubpart[0] === utr5 && subpart[0] !== utr5
  );
}

/**
 * Restore SVG subparts to genome order, for proper keyboard navigation
 *
 * See also: swapUTRsForward
 */
function swapUTRsBack(subparts, isPositiveStrand) {
  const swappedSubparts = subparts.slice();
  subparts.forEach((subpart, i) => {
    if (i === swappedSubparts.length - 1) return;
    const nextSubpart = subparts[i + 1];
    let shouldSwapBack = shouldSwapBackDOM;
    if (Array.isArray(nextSubpart)) {
      shouldSwapBack = shouldSwapBackData;
    }
    if (shouldSwapBack(subpart, nextSubpart, isPositiveStrand)) {
      swappedSubparts.splice(i, 1, nextSubpart);
      swappedSubparts.splice(i + 1, 1, subpart);
    }
  });
  return swappedSubparts;
}
// function swapUTRsBack(subparts, isPositiveStrand) {
//   const subpart2 = subparts[1];
//   if (
//     !isPositiveStrand && subpart2.classList.contains('three-prime-utr') ||
//     isPositiveStrand && subpart2.classList.contains('five-prime-utr')
//   ) {
//     const subpart1 = subparts[0];
//     subparts.splice(0, 1, subpart2);
//     subparts.splice(1, 1, subpart1);
//   }
//   return subparts;
// }

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

  const subparts = swapUTRsBack(domSubparts, isPositiveStrand);

  if (subparts.length === 0) return; // E.g. paralog neighborhoods, lncRNA
  const cls = '_ideoHoveredSubpart';
  const subpart = document.querySelector(`.${cls}`);
  if (!subpart) {
    // Accounts for edge case when changing transcripts via menu
    event.stopPropagation();
    event.preventDefault();
    return;
  }
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

  // Don't fall off the end
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

  // Jump forward or back by 1, 10, or all subparts
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

function addSubpartHoverListener(subpartDOM, ideo) {
  const subpart = subpartDOM;
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
        .replace('Transcript', '<br/>Transcript');
    footer.innerHTML = `<br/>${subpartText}${trimmedFoot}`;
  });

  // On hovering out, de-highlight and hide details
  subpart.addEventListener('mouseleave', event => {
    event.target.classList.remove('_ideoHoveredSubpart');
    const footer = getFooter();
    footer.innerHTML = ideo.originalTooltipFooter;
  });
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

  container.addEventListener('mouseenter', () => {
    document.addEventListener('keydown', navigateSubparts);
    if (ideo.addedMenuListeners) return;
    ideo.addedMenuListeners = true;
    writeFooter(container);
    const tooltip = document.querySelector('._ideogramTooltip');
    tooltip.addEventListener('change', () => {
      updateGeneStructure(ideo);
    });
  });
  container.addEventListener('mouseleave', () => {
    const footer = getFooter();
    footer.innerHTML = '';
    ideo.addedMenuListeners = false;
    document.removeEventListener('keydown', navigateSubparts);
  });

  if (ideo.addedSubpartListeners) return;
  ideo.addedSubpartListeners = true;

  subparts.forEach(subpart => {
    addSubpartHoverListener(subpart, ideo);
  });
}

export function addGeneStructureListeners(ideo) {
  addSpliceToggleListeners(ideo);
  addHoverListeners(ideo);
  addMenuListeners(ideo);
}

function getSpliceToggleHoverTitle(spliceExons) {
  return spliceExons ? 'Unsplice exons (s)' : 'Splice exons (s)';
}

function getSpliceToggle(ideo) {
  const spliceExons = ideo.spliceExons;
  const modifier = spliceExons ? '' : 'pre-';
  const cls = `class="_ideoSpliceToggle ${modifier}mRNA"`;
  const checked = spliceExons ? 'checked' : '';
  const text = getSpliceToggleHoverTitle(spliceExons);
  const title = `title="${text}"`;
  const inputAttrs =
    `type="checkbox" ${checked} ` +
    `style="display: none;"`;
  const style =
    'style="position: relative; top: -5px; ' +
    'user-select: none; ' + // Prevent distracting highlight on quick toggle
    'float: right; cursor: pointer; font-size: 16px; ' +
    'padding: 2px 4px; border: 1px solid #CCC; border-radius: 3px;"';
  const attrs = `${cls} ${style} ${title}`;

  // Scissors icon
  const label = `<label ${attrs}><input ${inputAttrs} />&#x2702;</label>`;
  return label;
}

/** Splice exons in transcript, removing introns; add positions */
function spliceOut(subparts) {
  const splicedSubparts = [];
  let prevEnd = 0;
  let prevStart = 0;
  for (let i = 0; i < subparts.length; i++) {
    const subpart = subparts[i];
    const [subpartType, start, length] = subpart;
    const isSpliceOverlap = start === prevStart;
    let prevRawStart, prevRawLength;
    if (i > 0) {
      [, prevRawStart, prevRawLength] = subparts[i - 1];
    }

    // e.g. 5'-UTRs of OXTR
    const isOtherOverlap = i > 0 && start === prevRawStart;

    // e.g. 3'-UTR of LDLR, or 3'-UTR of CD44
    const isOther3UTROverlap = i > 0 && start <= prevRawStart + prevRawLength;

    let splicedStart;
    if (isSpliceOverlap) {
      splicedStart = start;
    } else if (isOtherOverlap) {
      // e.g. 5'-UTRs of OXTR
      splicedStart = prevStart;
    } else if (isOther3UTROverlap) {
      splicedStart = prevStart + prevRawLength - length;
    } else {
      splicedStart = prevEnd;
    }
    const splicedEnd = splicedStart + length;
    const splicedSubpart = [subpartType, splicedStart, length + 1];
    splicedSubparts.push(splicedSubpart);
    prevEnd = splicedEnd;
    prevStart = splicedStart;
  }
  const splicedPositionedSubparts = addPositions(splicedSubparts);
  return splicedPositionedSubparts;
}

/** Insert introns to transcript; add positions */
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
  const splicedPositionedSubparts = addPositions(splicedSubparts);
  return splicedPositionedSubparts;
}

function getSpliceStateText(spliceExons, isCanonical=true) {
  let modifier = '';
  let titleMod = 'without';
  if (!spliceExons) {
    modifier = 'pre-';
    titleMod = 'with';
  }
  const canonOrAlt = isCanonical ? 'Canonical' : 'Alternative';
  const title = `${canonOrAlt} transcript per Ensembl, ${titleMod} introns`;
  const name = `${canonOrAlt} ${modifier}mRNA`;
  return {title, name};
}


/** Draw introns in initial splice toggle from mRNA to pre-mRNA */
function drawIntrons(prelimSubparts, matureSubparts, ideo) {
  // Hypothetical example data, in shorthand
  // pres = [u5_1, e1, i1, e2, i2, e3, i3, e4, i4, e5, i5, e6, u3_1]
  // mats = [u5_1, e1, e2, e3, e4, e5, e6, u3_1]

  let numInserted = 0;
  const subpartEls = document.querySelectorAll('.subpart');
  prelimSubparts.forEach((prelimSubpart, i) => {
    const matureIndex = i - numInserted;
    const matureSubpart = matureSubparts[matureIndex];
    if (matureSubpart[0] !== prelimSubpart[0]) {
      const summary = prelimSubpart[3].summary;
      const otherAttrs = `y="15" height="20" fill="#FFFFFF00" ${summary}`;
      const intronRect =
        `<rect class="subpart intron" ${otherAttrs} />`;
      subpartEls[matureIndex].insertAdjacentHTML('beforebegin', intronRect);
      numInserted += 1;
    }
  });

  document.querySelectorAll('.intron').forEach(subpartDOM => {

    addSubpartHoverListener(subpartDOM, ideo);
  });
}

function updateHeader(spliceExons, isCanonical) {
  // Update title for gene structure diagram
  const nameDOM =
  document.querySelector('._ideoGeneStructureContainerName');
  const toggleDOM = document.querySelector('._ideoSpliceToggle');

  if (nameDOM && toggleDOM) {
    [nameDOM, toggleDOM].forEach(el => el.classList.remove('pre-mRNA'));
    if (!spliceExons) {
      [nameDOM, toggleDOM].forEach(el => el.classList.add('pre-mRNA'));
    }
    const {title, name} = getSpliceStateText(spliceExons, isCanonical);
    nameDOM.textContent = name;
    nameDOM.title = title;
  }
}

function toggleSplice(ideo) {
  ideo.spliceExons = !ideo.spliceExons;
  const spliceExons = ideo.spliceExons;
  const [structure, selectedIndex] = getSelectedStructure(ideo);
  const isCanonical = (selectedIndex === 0);
  const [, prelimSubparts, matureSubparts] =
    getSvg(structure, ideo, spliceExons);

  const addedIntrons = document.querySelectorAll('.intron').length > 0;
  if (!spliceExons && !addedIntrons) {
    drawIntrons(prelimSubparts, matureSubparts, ideo);
  } else {
    document.querySelectorAll('.intron').forEach(el => el.remove());
  }
  document.querySelectorAll('.subpart-line').forEach(el => el.remove());

  const subparts = spliceExons ? matureSubparts : prelimSubparts;

  d3.select('._ideoGeneStructure').selectAll('.subpart')
    .data(subparts)
    .transition()
    .duration(750)
    .attr('x', (d, i) => subparts[i][3].x)
    .attr('width', (d, i) => subparts[i][3].width)
    .on('end', (d, i) => {
      if (i !== subparts.length - 1) return;

      // Restore subpart boundary lines
      document.querySelectorAll('.subpart').forEach((subpartDOM, i) => {
        const subpart = subparts[i];
        const line = getSubpartBorderLine(subpart);
        subpartDOM.insertAdjacentHTML('afterend', line);
      });

      updateHeader(spliceExons, isCanonical);
    });
}

/** Merge subpart type, pixel-x position, and pixel width to each subpart */
function addPositions(subparts) {
  const lastSubpart = subparts.slice(-1)[0];
  const featureLengthBp = lastSubpart[1] + lastSubpart[2];

  const featureLengthPx = 250;

  const bpPerPx = featureLengthBp / featureLengthPx;

  for (let i = 0; i < subparts.length; i++) {
    const subpart = subparts[i];
    if (subpart.length !== 3) continue;
    // Define subpart position, tooltip footer
    const lengthBp = subpart[2];
    const x = subpart[1] / bpPerPx;
    const width = lengthBp / bpPerPx;
    const type = subpart[0];

    subparts[i].push({type, x, width});
  }

  return subparts;
}

/** Get text shown below diagram upon hovering over an exon, intron, or UTR */
function getSubpartSummary(subpartType, total, index, strand, lengthBp) {
  if (strand === '-') index = total - index + 1;
  const numOfTotal = total > 1 ? `${index} of ${total} ` : '';
  const prettyType = subpartType[0].toUpperCase() + subpartType.slice(1);
  const html = `${prettyType} ${numOfTotal}${pipe} ${lengthBp} bp`;
  const summary = `data-subpart="${html}"`;
  return summary;
}

/** Get subtle line to visually demarcate subpart boundary */
function getSubpartBorderLine(subpart) {
  const subpartType = subpart[0];
  // Define subpart border
  const x = subpart[3].x;
  const height = heights[subpartType];
  const lineHeight = y + height;
  const lineStroke = `stroke="${lineColors[subpartType]}"`;
  const lineAttrs = // "";
    `x1="${x}" x2="${x}" y1="${y}" y2="${lineHeight}" ${lineStroke}`;
  return `<line class="subpart-line" ${lineAttrs} />`;
}

// function getSvgList(gene, ideo, spliceExons=false) {
//   if (
//     'geneStructureCache' in ideo === false ||
//     gene in ideo.geneStructureCache === false
//   ) {
//     return [null];
//   }

//   const svgList = ideo.geneStructureCache[gene].map(geneStructure => {
//     return getSvg(geneStructure, ideo, spliceExons);
//   });

//   return svgList;
// }

/** Get SVG, and prelimnary and mature subparts for given gene structure */
function getSvg(geneStructure, ideo, spliceExons=false) {
  const strand = geneStructure.strand;

  const rawSubparts = geneStructure.subparts;
  let subparts;

  let prelimSubparts = spliceIn(rawSubparts);
  let matureSubparts = spliceOut(rawSubparts);
  if (spliceExons) {
    subparts = matureSubparts;
  } else {
    subparts = prelimSubparts;
  }

  const spliceToggle = document.querySelector('._ideoSpliceToggle');
  if (spliceToggle) {
    const title = getSpliceToggleHoverTitle(spliceExons);
    spliceToggle.title = title;
  }

  const featureLengthPx = 250;

  const intronHeight = 1;
  const intronColor = 'black';
  const geneStructureArray = [];

  const intronPosAttrs =
    `x="0" width="${featureLengthPx}" y="${y + 10}" height="${intronHeight}"`;
  const intronRect =
    `<rect fill="black" ${intronPosAttrs}/>`;

  geneStructureArray.push(intronRect);

  // Set up counters for e.g. "Exon 2 of 4" ("<subpart> <num> of <total>")
  const indexBySubpart = {
    "5'-UTR": 0,
    'exon': 0,
    'intron': 0,
    "3'-UTR": 0
  };
  const totalBySubpart = {
    "5'-UTR": 0,
    'exon': 0,
    'intron': 0,
    "3'-UTR": 0
  };

  const isPositiveStrand = strand === '+';
  subparts = swapUTRsForward(subparts, isPositiveStrand);

  prelimSubparts = swapUTRsForward(prelimSubparts, isPositiveStrand);
  matureSubparts = swapUTRsForward(matureSubparts, isPositiveStrand);

  // Container for positional data: x, width
  // const prelimPositions = getPositions(prelimSubparts);
  // const maturePositions = getPositions(matureSubparts);

  // matureSubparts = matureSubparts.filter(p => p[0] !== 'intron');
  // const positions = spliceExons ? trimmedMatures : prelimPositions;

  // Get counts for e.g. "4" in "Exon 2 of 4"
  for (let i = 0; i < subparts.length; i++) {
    const subpart = subparts[i];
    const subpartType = subpart[0];
    if (subpartType in totalBySubpart) {
      totalBySubpart[subpartType] += 1;
    }
  }

  for (let i = 0; i < subparts.length; i++) {
    const subpart = subparts[i];
    // const position = positions[i];
    const subpartType = subpart[0];
    let color = intronColor;
    if (subpartType in colors) {
      color = colors[subpartType];
    }

    const height = heights[subpartType];

    // Define subpart position, tooltip footer
    const lengthBp = subpart[2];
    const x = subpart[3].x;
    const width = subpart[3].width;

    const pos = `x="${x}" width="${width}" y="${y}" height="${height}"`;
    const cls = `class="subpart ${subpartClasses[subpartType]}" `;

    // TODO: Handle introns better, refine CDS vs. UTR in exons
    const total = totalBySubpart[subpartType];
    indexBySubpart[subpartType] += 1;
    const subpartIndex = indexBySubpart[subpartType];
    const summary =
      getSubpartSummary(subpartType, total, subpartIndex, strand, lengthBp);
    if (!spliceExons) {
      prelimSubparts[i][3].summary = summary;
    } else if (subpartType !== 'intron') {
      matureSubparts[i][3].summary = summary;
    }

    const subpartSvg = (
      `<rect ${cls} rx="1.5" fill="${color}" ${pos} ${summary}/>` +
      getSubpartBorderLine(subpart)
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

  const footerDetails = [
    `${totalBySubpart['exon']} exons`,
    `${strand} strand`
  ];
  const biotypeText = geneStructure.biotype.replace(/_/g, ' ');
  if (biotypeText !== 'protein coding') {
    footerDetails.push(biotypeText);
  }

  const structureName = geneStructure.name;
  const gene = getGeneFromStructureName(structureName);
  const menu = getMenu(gene, ideo, structureName).replaceAll('"', '\'');
  const footerData = menu + footerDetails.join(` ${pipe} `);
  const geneStructureSvg =
    `<svg class="_ideoGeneStructure" ` +
      `data-ideo-gene-structure-name="${structureName}" ` +
      `data-ideo-strand="${strand}" data-ideo-footer="${footerData}" ` +
      `width="${(featureLengthPx + 20)}" height="40" ${transform}` +
    `>` +
      geneStructureArray.join('') +
    '</svg>';

  return [geneStructureSvg, prelimSubparts, matureSubparts];
}

function getMenu(gene, ideo, selectedName) {
  if (
    'geneStructureCache' in ideo === false ||
    gene in ideo.geneStructureCache === false
  ) {
    return null;
  }

  const structures = ideo.geneStructureCache[gene];

  const options = structures.map(structure => {
    const name = structure.name;
    let selected = '';
    if (selectedName && selectedName === structure.name) {
      selected = ' selected';
    }
    return `<option value="${name}" ${selected}>${name}</option>`;
  }).join('');

  const id = '_ideoGeneStructureMenu';
  // const style = 'style="display: inline"';
  const style = 'style="' +
    'float: right; ' +
    'position: relative; top: -3px;' +
    '"';
  const menu =
    `<div style="margin-bottom: 8px; clear: both;">` +
      `<label for="${id}" style="margin-right: 5px">Transcript:</label> ` +
      `<select id="${id}" name="${id}" ${style}>${options}</select>` +
    `</div>`;
  return menu;
}

export function getGeneStructureHtml(annot, ideo, isParalogNeighborhood) {
  let geneStructureHtml = '';
  const gene = annot.name;
  if (
    ideo.config.showGeneStructureInTooltip && !isParalogNeighborhood &&
    !(
      'geneStructureCache' in ideo === false ||
      gene in ideo.geneStructureCache === false
    )
  ) {
    ideo.addedSubpartListeners = false;
    if ('spliceExons' in ideo === false) ideo.spliceExons = true;
    const spliceExons = ideo.spliceExons;
    const structure = ideo.geneStructureCache[gene][0];
    const geneStructureSvg = getSvg(structure, ideo, spliceExons)[0];
    const cls = 'class="_ideoGeneStructureContainer"';
    const toggle = getSpliceToggle(ideo);
    const rnaClass = spliceExons ? '' : ' pre-mRNA';
    const spanClass = `class="_ideoGeneStructureContainerName${rnaClass}"`;
    const {name, title} = getSpliceStateText(spliceExons);
    const spanAttrs = `${spanClass} title="${title}"`;
    geneStructureHtml =
      '<br/><br/>' +
      css +
      `<div ${cls}>` +
      `<div><span ${spanAttrs}>${name}</span>${toggle}</div>` +
      `<span class="_ideoGeneStructureSvgContainer">` +
        geneStructureSvg +
      `</span>` +
      `<div class="_ideoGeneStructureFooter"></div>` +
      `</div>`;

  }
  return geneStructureHtml;
}
