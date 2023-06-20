/**
 * @fileoverview Functions to render 2D protein structure, i.e. linear domains
 *
 * The protein diagrams are shown in the Gene Leads tooltip.
 */

import {addPositions, getGeneFromStructureName, pipe} from './gene-structure';
import {getColors} from './protein-color';

/** Get subtle line to visually demarcate domain boundary */
function getDomainBorderLines(x, y, width, height, lineColor) {
  const lineHeight = y + height;
  const lineStroke = `stroke="${lineColor}"`;
  const leftLineAttrs =
    `x1="${x}" x2="${x}" y1="${y}" y2="${lineHeight}" ${lineStroke}`;

  const x2 = x + width;
  const rightLineAttrs =
    `x1="${x2}" x2="${x2}" y1="${y}" y2="${lineHeight}" ${lineStroke}`;

  const startBorder = `<line class="subpart-line" ${leftLineAttrs} />`;
  const endBorder = `<line class="subpart-line" ${rightLineAttrs} />`;

  return startBorder + endBorder;
}

/** Get start and length for coding sequence (CDS), in pixels and base pairs */
function getCdsCoordinates(subparts, isPositiveStrand) {
  // Test case: XRCC3 (-, multiple 5'-UTRs), RAD51D (big 3'-UTR)
  if (!isPositiveStrand) subparts = subparts.slice().reverse();

  // Start of CDS is end of last 5'-UTR, for default case (positive strand)
  const startUtr = isPositiveStrand ? "5'-UTR" : "3'-UTR";
  const lastStartUtr = subparts.filter(s => s[0] === startUtr).slice(-1)[0];
  let startPx, startBp;
  if (lastStartUtr) {
    startPx = lastStartUtr[3].x + lastStartUtr[3].width;
    startBp = lastStartUtr[1] + lastStartUtr[2];
  } else {
    // For transcipts without an annotated start UTR, e.g. EGFR-205
    startPx = 0;
    startBp = 0;
  }

  // End of CDS is start of first 3'-UTR, for default case
  const endUtr = isPositiveStrand ? "3'-UTR" : "5'-UTR";
  const firstEndUtr = subparts.filter(s => s[0] === endUtr).slice(-1)[0];
  let stopPx, stopBp;
  if (firstEndUtr) {
    stopPx = firstEndUtr[3].x;
    stopBp = firstEndUtr[1];
  } else {
    // For transcipts without an annotated last UTR, e.g. EGFR-205
    const lastSubpart = subparts.slice(-1)[0];
    stopPx = lastSubpart[3].x + lastSubpart[3].width;
    stopBp = lastSubpart[1] + lastSubpart[2];
  }

  const lengthBp = stopBp - startBp;
  const lengthPx = stopPx - startPx;

  const cdsCoordinates = {
    px: {start: startPx, length: lengthPx},
    bp: {start: startBp, length: lengthBp}
  };
  return cdsCoordinates;
}

/** Get SVG for an inidividual protein domain */
function getDomainSvg(domain, cds, isPositiveStrand) {
  let domainType = domain[0];
  const domainPx = domain[3];

  let x = cds.px.start + domainPx.x;
  const width = domainPx.width;
  if (!isPositiveStrand) {
    x = cds.px.length + cds.px.start - (domainPx.x + domainPx.width);
  };

  // Perhaps make these configurable, later
  let y = 45;
  let height = 10;
  if (domainType.startsWith('_UT_')) {
    domainType = domainType.slice(4);
    y = 40;
    height = 20;
    // return;
  }

  const lengthAa = `${domain[2]}&nbsp;aa`;
  const title = `data-subpart="${domainType} ${pipe} ${lengthAa}"`;
  const data = title;

  const pos = `x="${x}" width="${width}" y="${y}" height="${height}"`;
  const cls = `class="subpart domain" `;

  const [color, lineColor] = getColors(domainType);

  const line = getDomainBorderLines(x, y, width, height, lineColor);
  const domainSvg =
    `<rect ${cls} rx="1.5" fill="${color}" ${pos} ${data}/>` +
    line;

  return domainSvg;
}

/** Return whether protein SVG should be shown */
function isEligibleforProteinSvg(gene, ideo) {
  return (
    ideo.config.showProteinInTooltip &&
    !(
      'proteinCache' in ideo === false ||
      gene in ideo.proteinCache === false ||
      ('spliceExons' in ideo === false || ideo.spliceExons === false)
    )
  );
}

/** Get SVG showing 2D protein features, e.g. domains from InterPro */
export function getProteinSvg(structureName, subparts, isPositiveStrand, ideo) {
  const features = [];
  const gene = getGeneFromStructureName(structureName, ideo);

  const isEligible = isEligibleforProteinSvg(gene, ideo);
  if (!isEligible) return '';


  const entry = ideo.proteinCache[gene].find(d => {
    return d.transcriptName === structureName;
  });
  if (!entry) return '<br/>';
  const protein = entry.protein;
  const cds = getCdsCoordinates(subparts, isPositiveStrand);

  const domains = addPositions(subparts, protein);

  for (let i = 0; i < domains.length; i++) {
    const domain = domains[i];
    const domainSvg = getDomainSvg(domain, cds, isPositiveStrand);
    features.push(domainSvg);
  }

  const proteinSvg =
    `<g id="_ideoProtein">${features.join('')}</g>`;

  return proteinSvg;
}
