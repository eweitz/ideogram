import {addPositions} from './gene-structure';

export function getDomainSvg(gene, structureName, ideo) {

  const domainArray = [];
  if (
    ideo.config.showDomainInTooltip &&
    !(
      'domainCache' in ideo === false ||
      gene in ideo.domainCache === false ||
      ('spliceExons' in ideo === false || ideo.spliceExons === false)
    )
  ) {
    const rawDomains = ideo.domainCache[gene][0].domains;
    const domains = addPositions(rawDomains);
    console.log('domains');
    console.log(domains);
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
      const x = domain[3].x;
      const width = domain[3].width;

      const pos = `x="${x}" width="${width}" y="35" height="${height}"`;
      const cls = `class="domain" `;

      const rect =
        `<rect ${cls} rx="1.5" fill="${color}" ${pos}/>`;

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
  return domainArray.join('');
}
