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
  if (!isPositiveStrand) subparts = subparts.reverse();

  // Start of CDS is end of last 5'-UTR, for default case (positive strand)
  const startUtr = isPositiveStrand ? "5'-UTR" : "3'-UTR";
  const lastStartUtr = subparts.filter(s => s[0] === startUtr).slice(-1)[0];
  const startPx = lastStartUtr[3].x + lastStartUtr[3].width;
  const startBp = lastStartUtr[1] + lastStartUtr[2];

  // End of CDS is start of first 3'-UTR, for default case
  const endUtr = isPositiveStrand ? "3'-UTR" : "5'-UTR";
  const firstEndUtr = subparts.filter(s => s[0] === endUtr).slice(-1)[0];
  const stopPx = firstEndUtr[3].x;
  const stopBp = firstEndUtr[1];

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
  const domainType = domain[0];
  const domainPx = domain[3];

  let x = cds.px.start + domainPx.x;
  const width = domainPx.width;
  if (!isPositiveStrand) {
    x = cds.px.length - domainPx.x - domainPx.width + cds.px.start;
  };

  const y = 40;
  const height = 10;
  const color = '#CAA';
  const lineColor = '#866';

  const lengthAa = `${domain[2]}&nbsp;aa`;
  const title = `data-subpart="${domainType} ${pipe} ${lengthAa}"`;
  const data = title;

  const pos = `x="${x}" width="${width}" y="${y}" height="${height}"`;
  const cls = `class="subpart domain" `;

  const line = getDomainBorderLines(x, y, width, lineColor);
  const domainSvg =
    `<rect ${cls} rx="1.5" fill="${color}" ${pos} ${data}/>` +
    line;

  return domainSvg;
}

/** Return whether protein SVG should be shown */
function isEligibleforProteinSvg(gene, ideo) {
  return (
    ideo.config.showDomainInTooltip &&
    !(
      'domainCache' in ideo === false ||
      gene in ideo.domainCache === false ||
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

  const rawDomains = ideo.domainCache[gene][0].domains;
  const cds = getCdsCoordinates(subparts, isPositiveStrand);

  // 3 nt per aa.  Last 3 nucleotides are a stop codon, not an amino acid.
  const cdsLengthAa = (cds.bp.length / 3) - 1;

  const domains = addPositions(rawDomains, cds.px.length, cdsLengthAa);
  for (let i = 0; i < domains.length; i++) {
    const domain = domains[i];
    const domainSvg = getDomainSvg(domain, cds, isPositiveStrand);
    features.push(domainSvg);
  }

  const proteinSvg = features.join('');

  return proteinSvg;
}
