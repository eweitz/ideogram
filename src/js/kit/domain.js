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

  const lastUtrType = isPositiveStrand ? "5'-UTR" : "3'-UTR";
  const lastUtr = subparts.filter(s => s[0] === lastUtrType).slice(-1)[0];
  const startPx = lastUtr[3].x + lastUtr[3].width;
  const startBp = lastUtr[1] + lastUtr[2];

  const firstUtrType = isPositiveStrand ? "3'-UTR" : "5'-UTR";
  const firstUtr = subparts.filter(s => s[0] === firstUtrType).slice(-1)[0];
  const stopPx = firstUtr[3].x;
  const stopBp = firstUtr[1];

  const lengthBp = stopBp - startBp;
  const lengthPx = stopPx - startPx;

  const cdsCoordinates = {
    px: {start: startPx, length: lengthPx},
    bp: {start: startBp, length: lengthBp}
  };
  return cdsCoordinates;
}

export function getDomainSvg(structureName, subparts, isPositiveStrand, ideo) {

  const domainArray = [];
  const gene = getGeneFromStructureName(structureName);

  if (
    ideo.config.showDomainInTooltip &&
    !(
      'domainCache' in ideo === false ||
      gene in ideo.domainCache === false ||
      ('spliceExons' in ideo === false || ideo.spliceExons === false)
    )
  ) {
    const strandPad = isPositiveStrand ? 0 : -10;
    const rawDomains = ideo.domainCache[gene][0].domains;
    const cds = getCdsCoordinates(subparts, isPositiveStrand);
    // 3 nt per aa.  Last 3 nucleotides are a stop codon, not an amino acid.
    const cdsLengthAa = (cds.bp.length / 3) - 1;
    const domains = addPositions(rawDomains, cds.px.length, cdsLengthAa);
    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i];
      // const position = positions[i];
      const domainType = domain[0];
      // if (subpartType in colors) {
      //   color = colors[subpartType];
      // }

      const height = 10;

      // Define subpart position, tooltip footer
      const lengthBp = domain[2];
      let x = cds.px.start + domain[3].x;
      const width = domain[3].width;
      if (!isPositiveStrand) {
        x = cds.px.length - domain[3].x - domain[3].width + cds.px.start;
      };
      console.log('x, width', x, width)

      const color = '#CAA';
      const lineColor = '#866';

      // console.log('domain', domain)
      console.log('domain', domain)
      console.log('domain[3]', domain[3])
      // console.log('width', width)
      const lengthAa = `${domain[2]} aa`;
      const title = `data-subpart="${domainType} ${pipe} ${lengthAa}"`;
      // const locus = `data-locus="Start: ${domain[1]}, length: ${domain[2]}"`;
      // const data = title + ' ' + locus;
      const data = title;
      const y = 40;
      const pos = `x="${x}" width="${width}" y="${y}" height="${height}"`;
      const cls = `class="subpart domain" `;

      const line = getDomainBorderLines(x, y, width, lineColor);
      const svg =
        `<rect ${cls} rx="1.5" fill="${color}" ${pos} ${data}/>` +
        line;

      domainArray.push(svg);

    }

    // const domainSvg = getSvg(domains, ideo)[0];

    // const domainHtml =
    //   `<span class="_ideoDomainSvgContainer">` +
    //     domainSvg +
    //   `</span>` +
    //   `<div class="_ideoDomainFooter"></div>` +
    //   `</div>`;

  }

  const domainSvg = domainArray.join('');

  return domainSvg;
}
