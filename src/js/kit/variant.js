/**
 * @fileoverview Functions to render 2D protein structure, i.e. linear domains
 *
 * The protein diagrams are shown in the Gene Leads tooltip.
 */

import {
  addPositions, getBpPerPx, getGeneFromStructureName, pipe
} from './gene-structure';

function addSplicedPositions(subparts, rawVariants) {
  const features = []
  console.log('in addSplicedPositions, subparts', subparts)
  console.log('in addSplicedPositions, rawVariants', rawVariants)

  const bpPerPx = getBpPerPx(subparts);

  rawVariants = rawVariants.map(v => {

    for (let i = 0; i < subparts.length; i++) {
      const subpart = subparts[i];
      const [
        subpartType, subpartRelBpStart, subpartBpLength, subpartBpStart, subpartPx
      ] = subpart;

      if (
        subpartBpStart <= v.positionRelative &&
        subpartBpStart + subpartBpLength >= v.positionRelative
      ) {
        const variantSubpartRelativePosition =
          v.positionRelative - subpartBpStart;
        const x = variantSubpartRelativePosition / bpPerPx + subpartPx.x;
        const width = 0.5;
        const feature = [
          '', variantSubpartRelativePosition, 1, {
            type: '',
            x,
            width
          }
        ];
        features.push(feature);
        break;
      }
    }
    return v;
  });

  console.log('positioned variant features:', features)
  return features;
}

/** Get SVG showing 2D variant features */
export async function getVariantsSvg(
  structureName, subparts, startOffset, ideo
) {
  const t0 = Date.now();

  const gene = getGeneFromStructureName(structureName, ideo);

  const cache = ideo.variantCache;

  let rawVariants = await cache.getVariants(gene, ideo);

  if (rawVariants.length === 0) {
    return null;
  }

  console.log('rawVariants.length', rawVariants.length)

  if (rawVariants.length > 15) {
    rawVariants = rawVariants
      .filter(v => v.dbSnpId !== '' && v.afExac !== null)
      .sort((a, b) => b.afExac - a.afExac)
      .slice(0, 15);
  }

  rawVariants = rawVariants.map(v => {
    v.positionRelative -= startOffset;
    return v;
  });

  const pxFeatures = addSplicedPositions(subparts, rawVariants);

  const variants = pxFeatures.map((f, i) => {
    const variant = rawVariants[i];
    variant.x = f.slice(-1)[0].x;
    variant.width = f.slice(-1)[0].width;
    return variant;
  });

  const diseases = {};

  // variants.map(v => sum += v.afExac)
  variants.forEach(v => {
    v.diseases.map(d => {
      if (d.name in diseases == false) diseases[d.name] = 0;
      diseases[d.name] += 1;
    });
  });

  const lines = variants.reverse().map(v => {

    let stroke = '#D00';
    let fill = '#FBB';
    let bottomV = 13;
    let topV = 1;
    if (v.clinicalSignificance === 'Pathogenic/Likely pathogenic') {
      stroke = '#F55';
      fill = '#FDD';
      bottomV = 16;
      topV = 4;
    } else if (v.clinicalSignificance === 'Likely pathogenic') {
      stroke = '#F99500';
      fill = '#FEC';
      bottomV = 19;
      topV = 7;
    }

    const triangle = {
      bottom: `${v.x},${bottomV}`,
      topLeft: `${v.x - 6.5},${topV}`,
      topRight: `${v.x + 6.5},${topV}`
    };

    const points =
     `${triangle.bottom} ${triangle.topLeft} ${triangle.topRight}`;

    const triangleStyle = `fill:${fill};stroke:${stroke}`;
    const lineStyle=`stroke:${stroke};`;
    return `
      <g>
        <line x1="${v.x}" y1="10" x2="${v.x}" y2="25" style="${lineStyle}" />
        <polygon points="${points}" style="${triangleStyle}" />
      </g>
    `;
  });
  const svg = lines.join('');

  const t1 = Date.now();
  console.log(t1-t0)
  return svg;
}

export function writeVariantsSvg(geneStructure, ideo) {
   getVariantsSvg(geneStructure, ideo).then(svg => {
    // console.log('svg', svg)
    const container = document.querySelector('._ideoGeneStructure')
    container.insertAdjacentHTML('beforeend', svg);
   })
}

window.getVariantsSvg = getVariantsSvg
window.writeVariantsSvg = writeVariantsSvg
