import {addPositions, getGeneFromStructureName} from './gene-structure';

/** Get start pixel and pixel length for coding sequence (CDS) */
function getCdsCoordinates(subparts, isPositiveStrand) {
  if (!isPositiveStrand) subparts = subparts.reverse();
  const lastUtr5 = subparts.filter(s => s[0] === "5'-UTR").slice(-1)[0];
  console.log('lastUtr5', lastUtr5);
  let startPx;
  if (!isPositiveStrand) {
    startPx = 250 - lastUtr5[3].x + lastUtr5[3].width;
  } else {
    startPx = lastUtr5[3].x + lastUtr5[3].width;
  }
  console.log('lastUtr5[3]', lastUtr5[3])
  console.log('startPx', startPx);
  const firstUtr3 = subparts.find(s => s[0] === "3'-UTR");
  console.log('firstUtr3[3]', firstUtr3[3]);
  let stopPx = firstUtr3[3].x;
  let lengthPx;
  if (!isPositiveStrand) {
    // stopPx = stopPx + firstUtr3[3].width;
    lengthPx = 225;
  } else {
    lengthPx = stopPx - startPx;
  }
  // startPx = 15;
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
      let color = '#CAA';
      // if (subpartType in colors) {
      //   color = colors[subpartType];
      // }

      const height = 10;

      // Define subpart position, tooltip footer
      const lengthBp = domain[2];
      let x = cds.px.start + domain[3].x;
      const width = domain[3].width;
      if (!isPositiveStrand) x = x + width - cds.px.length;
      console.log('x', x)

      console.log('domain', domain)
      console.log('domain[3]', domain[3])
      console.log('width', width)
      const title = `data-subpart="${domainType}"`
      const pos = `x="${x}" width="${width}" y="40" height="${height}"`;
      const cls = `class="subpart domain" `;

      const rect =
        `<rect ${cls} rx="1.5" fill="${color}" ${pos} ${title}/>`;

      domainArray.push(rect);

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
