import {addPositions, getGeneFromStructureName} from './gene-structure';

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

/** Get start pixel and pixel length for coding sequence (CDS) */
function getCdsCoordinates(subparts, isPositiveStrand) {
  if (!isPositiveStrand) subparts = subparts.reverse();
  let startPx;
  if (!isPositiveStrand) {
    const lastUtr3 = subparts.filter(s => s[0] === "3'-UTR").slice(-1)[0];
    startPx = lastUtr3[3].x + lastUtr3[3].width;
    console.log('lastUtr3[3]', lastUtr3[3])
  } else {
    const lastUtr5 = subparts.filter(s => s[0] === "5'-UTR").slice(-1)[0];
    startPx = lastUtr5[3].x + lastUtr5[3].width;
    console.log('lastUtr5[3]', lastUtr5[3])
  }
  console.log('startPx', startPx);
  const firstUtr3 = subparts.find(s => s[0] === "3'-UTR");
  console.log('firstUtr3[3]', firstUtr3[3]);
  let stopPx = firstUtr3[3].x;
  let lengthPx;
  if (!isPositiveStrand) {
    lengthPx = 250 - stopPx - firstUtr3[3].width;
    // lengthPx = 225;
  } else {
    lengthPx = stopPx - startPx;
  }
  // startPx = 15;
  console.log('lengthPx', lengthPx)
  const cdsCoordinates = {px: {start: startPx, length: lengthPx}};
  console.log('subparts', subparts);
  console.log('cdsCoordinates', cdsCoordinates);
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
    const domains = addPositions(rawDomains, cds.px.length);
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
        x = cds.px.length - domain[3].x - domain[3].width + cds.px.start
      };
      console.log('x', x)

      const color = '#CAA';
      const lineColor = '#866';

      // console.log('domain', domain)
      console.log('domain[3]', domain[3])
      // console.log('width', width)
      const locus = `${domain[1]}-${domain[1] + domain[2]}`;
      const title = `data-subpart="${domainType} (${locus})"`;
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
