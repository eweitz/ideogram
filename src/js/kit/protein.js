/**
 * @fileoverview Functions to render 2D protein structure, i.e. linear domains
 *
 * The protein diagrams are shown in the Gene Leads tooltip.
 */

import {addPositions, getGeneFromStructureName, pipe} from './gene-structure';

/** Get subtle line to visually demarcate domain boundary */
function getDomainBorderLines(x, y, width, lineColor) {
  const height = 10;
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


// Default
const grey = '#BBB';
const greyLines = '#666';

const darkGrey = '#888';
const darkGreyLine = '#AAA';

const magenta = '#922D5E';
const magentaLines = '#B24D7E';
const red = '#F00';
const redLines = '#D00';
const faintRed = '#CAA';
const faintRedLines = '#866';
const blue = '#AAF';
const blueLines = '#33D';
const deepBlue = '#55A';
const deepBlueLines = '#AAF';
const green = '#7D7';
const greenLines = '#5B5';
const seafoam = '#93E9BE';
const seafoamLines = '#53AC7E';
const orange = '#FFA500';
const orangeLines = '#DD8000';

// Purples
const darkPurple = '#51087E';
const darkPurpleLine = '#8138AE';
const purple = '#880ED4';
const purpleLine = '#5800A4';
const purple2 = '#A020F0';
const purple2Line = '#7000C0';
const lightPurple = '#B24BF3';
const lightPurpleLine = '#921BC3';
const veryLightPurple = '#D7A1F9';
const veryLightPurpleLine = '#A771C9';

const pink = '#FFC0CB';
const pinkLine = '#CF909B';

const lightBrown = '#DACDBA';
const lightBrownLine = '#BAAB9A';
const brown = '#964B00';
const brownLine = '#C67B30';

function getColors(domainType) {
  if (domainType.includes('conserved site')) {
    // https://www.google.com/search?q=pymol+conserved+site+color&tbm=isch
    return [magenta, magentaLines];
  } else if (
    domainType.includes('active site') ||
    domainType.includes('hydroxylation site')
  ) {
    return [red, redLines];
  } else if (
    domainType.includes('catalytic domain') ||
    domainType.includes('kinase domain') ||
    domainType === 'PIK-related kinase, FAT' ||
    domainType.includes('trypsin domain') ||
    domainType === 'High mobility group box domain' ||
    domainType.includes('Peptidase M2') ||
    domainType.includes('CUB domain') ||
    domainType === 'Transforming growth factor-beta, C-terminal' ||
    domainType === 'C-5 cytosine methyltransferase' ||
    domainType.includes('(G-protein), alpha subunit')
  ) {
    return [faintRed, faintRedLines];
  } else if (
    domainType.includes('binding site') ||
    domainType === 'EF-hand domain' ||
    domainType === 'Zinc finger, nuclear hormone receptor-type' ||
    domainType.includes('Serpin domain') ||
    domainType === 'Peptidase C14,  p20 domain' ||
    domainType === 'PWWP domain' ||
    domainType === 'GPCR, rhodopsin-like, 7TM'
  ) {
    return [blue, blueLines];
  } else if (
    domainType.includes('binding domain') ||
    domainType.includes('zinc-binding') ||
    domainType.includes('DNA-binding') ||
    domainType === 'G protein-coupled receptor, rhodopsin-like' ||
    domainType.includes('Homeobox domain') ||
    domainType.includes('Ion transport domain') ||
    domainType.includes('BRCT domain') ||
    domainType.includes('transactication domain') ||
    domainType.includes('EF-hand') ||
    domainType === 'Laminin G domain' ||
    domainType === 'Peptidase C14, caspase non-catalytic subunit p10' ||
    domainType === 'ADD domain' ||
    domainType === 'PDZ domain'
  ) {
    return [deepBlue, deepBlueLines];
  } else if (
    domainType === 'SH2 domain' ||
    domainType.includes('Furin-like') ||
    domainType.includes('heparin-binding') ||
    domainType === 'SRCR domain' ||
    domainType === 'EGF-like domain' ||
    domainType.includes('EGF domain') ||
    domainType === 'Basic leucine zipper domain, Maf-type' ||
    domainType.includes('Interleukin') && domainType.includes('propeptide') ||
    domainType === 'Sirtuin family'
  ) {
    return [green, greenLines];
  } else if (
    domainType === 'SH3 domain' ||
    domainType.includes('copper-binding') ||
    domainType === 'Sushi/SCR/CCP domain' ||
    domainType.includes('Receptor L-domain') ||
    domainType.includes('Coagulation factor 5/8') ||
    domainType === 'Basic-leucine zipper domain' ||
    domainType.includes('Interleukin') && domainType.includes('family') ||
    domainType === 'Sirtuin family, catalytic core domain'
  ) {
    return [seafoam, seafoamLines];
  }

  else if (domainType === 'Immunoglobulin-like domain') {
    return [pink, pinkLine];
  } else if (
    domainType === 'Immunoglobulin' ||
    domainType === 'Calponin homology domain' ||
    domainType.includes('ATPase') ||
    domainType.includes('globular domain')
  ) {
    return [veryLightPurple, veryLightPurpleLine];
  } else if (
    domainType === 'Immunoglobulin C1-set' ||
    domainType.includes('GTPase')
  ) {
    return [lightPurple, lightPurpleLine];
  } else if (
    domainType === 'Immunoglobulin C2-set' ||
    domainType.includes('immunoglobulin C2-set') ||
    domainType.includes('protein interaction')
  ) {
    return [purple, purpleLine];
  } else if (domainType === 'Immunoglobulin V-set domain') {
    return [darkPurple, darkPurpleLine];
  } else if (domainType === 'Immunoglobulin I-set') {
    return [purple2, purple2Line];
  }

  else if (
    domainType.includes('repeat') ||
    domainType === 'Armadillo' ||
    domainType === 'Fibronectin type III' ||
    domainType.includes('Apple domain')
  ) {
    return [orange, orangeLines];
  } else if (
    domainType.includes('Kringle') ||
    domainType.includes('Peptidase M12A') ||
    domainType === 'TGF-beta, propeptide' ||
    domainType === 'PIK-related kinase' ||
    domainType.includes('(PIK) domain')
  ) {
    return [lightBrown, lightBrownLine];
  } else if (
    domainType.includes('transmembrane domain') ||
    domainType.includes('Collectrin')
  ) {
    return [brown, brownLine];
  }

  else if (
    domainType === 'CARD domain' ||
    domainType === 'Death effector domain' ||
    domainType === 'Death domain' ||
    domainType === 'Ubiquitin-associated domain' ||
    domainType.includes('UBA domain')
  ) {
    return [darkGrey, darkGreyLine];
  }

  return [grey, greyLines];
}

/** Get SVG for an inidividual protein domain */
function getDomainSvg(domain, cds, isPositiveStrand) {
  const domainType = domain[0];
  const domainPx = domain[3];

  let x = cds.px.start + domainPx.x;
  const width = domainPx.width;
  if (!isPositiveStrand) {
    x = cds.px.length + cds.px.start - (domainPx.x + domainPx.width);
  };

  // Perhaps make these configurable, later
  const y = 40;
  const height = 10;

  const lengthAa = `${domain[2]}&nbsp;aa`;
  const title = `data-subpart="${domainType} ${pipe} ${lengthAa}"`;
  const data = title;

  const pos = `x="${x}" width="${width}" y="${y}" height="${height}"`;
  const cls = `class="subpart domain" `;

  const [color, lineColor] = getColors(domainType);

  const line = getDomainBorderLines(x, y, width, lineColor);
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
