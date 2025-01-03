/**
 * @fileoverview Functions to render 2D protein structure, i.e. linear domains
 *
 * The protein diagrams are shown in the Gene Leads tooltip.
 */

import {
  addPositions, getBpPerPx, getGeneFromStructureName, pipe
} from './gene-structure';

function getVariantSummary(v, isFullDetail=false) {

  const numDiseases = isFullDetail ? v.diseases.length : 1;

  let diseases = v.diseases.slice(0, numDiseases)
    .map(d => {
      const id = d.id.replace(':', '_');
      const url = `https://purl.obolibrary.org/obo/${id}`;
      const link = `<a href="${url}" target=_blank>${d.name}</a>`;
      const value = isFullDetail ? link : d.name;
      return `<div>-&nbsp;${value}</div>`;
    }).join('');

  if (!isFullDetail && v.diseases.length > 1) {
    const numRemaining = v.diseases.length - 1;
    let remaining = `- ${numRemaining} more condition`;
    if (numRemaining > 1) remaining += 's';
    diseases += `<div>${remaining}</div>`;
  }

  const positionalId =
    `${v.chromosome}-${v.position}-${v.refAllele}-${v.altAllele}`;

  let variantId = v.clinvarVariantId;
  if (v.dbSnpId) variantId += ` ${pipe} ${v.dbSnpId}`;
  variantId += ` ${pipe} ${positionalId}`;

  const height = isFullDetail ? 180 : 120;
  const style =
    `height: ${height}px; ` +
    'width: 275px; ' +
    'margin-top: 15px; ';


  let supplementaryDetails;
  if (!isFullDetail) {
    supplementaryDetails = '<div><i>Click variant for more details</i></div>';
  } else {
    supplementaryDetails =
    `<div>Variant type: ${v.variantType}</div>` +
    `<div>Review status: ${v.reviewStatus}</div>` +
    (v.origin ? `<div>Origin: ${v.origin}</div>` : '') +
    `<br/>`;
  }

  const variantSummary = `
      <div class="_ideoVariantSummary" style="${style}">
          <div>${variantId}</div>
          <br/>
          <div>${v.clinicalSignificance} in:</div>
          <div>
          ${diseases}
          </div>
          <br/>
          ${supplementaryDetails}
      </div>`;

  return variantSummary;
}

function getContainers() {
  const head = document.querySelector('._ideoGeneStructureContainerHead');
  const tissuePlot = document.querySelector('._ideoTissueExpressionPlot')
  const tissueContainer = document.querySelector('._ideoTissuePlotContainer');

  return [head, tissuePlot, tissueContainer];
}

function writeVariantSummary(event, isFullDetail, ideo) {
  const [head, tissuePlot, tissueContainer] = getContainers();

  const thisVariant = event.target.parentElement;

  document.querySelectorAll('._ideoVariant').forEach(vd => {
    vd.classList.remove('_ideoBackgroundVariant');
  });

  document.querySelectorAll('._ideoVariant').forEach(vd => {
    if (vd.id !== thisVariant.id) {
      vd.classList.add('_ideoBackgroundVariant');
    }
  });


  document.querySelector('._ideoVariantSummary')?.remove();
  const target = event.target;
  const varId = target.parentElement.id;
  const variant = ideo.variants.find(v => v.clinvarVariantId === varId);
  const variantSummary = getVariantSummary(variant, isFullDetail);
  tissuePlot.style.display = 'none';
  head.style.display = 'none';
  tissueContainer.insertAdjacentHTML('beforeend', variantSummary);
}

function removeVariantSummary() {
  const [head, tissuePlot, tissueContainer] = getContainers();

  document.querySelectorAll('._ideoVariant').forEach(vd => {
    vd.classList.remove('_ideoBackgroundVariant');
  });

  document.querySelector('._ideoVariantSummary')?.remove();
  tissuePlot.style.display = '';
  tissueContainer.style.display = '';
  head.style.display = '';
}

export function addVariantListeners(ideo) {
  document.querySelectorAll('._ideoVariant').forEach(variantDom => {
    variantDom.addEventListener('mouseover', (event) => {
      const isFullDetail = false;
      writeVariantSummary(event, isFullDetail, ideo);
    });
    variantDom.addEventListener('click', (event) => {
      const isFullDetail = true;
      writeVariantSummary(event, isFullDetail, ideo);
      event.stopPropagation();
      variantDom.removeEventListener('mouseout', removeVariantSummary);
    });
    variantDom.addEventListener('mouseout', removeVariantSummary);
  });
}

function addSplicedPositions(subparts, rawVariants) {
  const features = [];

  const bpPerPx = getBpPerPx(subparts);

  rawVariants = rawVariants.map(v => {

    for (let i = 0; i < subparts.length; i++) {
      const subpart = subparts[i];
      const [subpartBpLength, subpartBpStart, subpartPx] = subpart.slice(-3);

      const isRelative = (subpart.length === 5);

      if (
        subpartBpStart <= v.positionRelative &&
        subpartBpStart + subpartBpLength >= v.positionRelative
      ) {
        const variantSubpartRelativePosition =
          v.positionRelative - subpartBpStart;
        let x = variantSubpartRelativePosition / bpPerPx;
        if (isRelative) x += subpartPx.x;
        // x += subpartPx.x;
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
  geneStructure, subparts, ideo
) {
  const t0 = Date.now();

  const structureName = geneStructure.name;
  const startOffset = geneStructure.startOffset;
  console.log('in getVariantsSvg, startOffset', startOffset)

  const gene = getGeneFromStructureName(structureName, ideo);

  const cache = ideo.variantCache;

  let rawVariants = await cache.getVariants(gene, ideo);
  console.log('rawVariants', rawVariants)

  if (rawVariants.length === 0) {
    return null;
  }

  // console.log('rawVariants.length', rawVariants.length)

  if (rawVariants.length > 15) {
    rawVariants = rawVariants
      .filter(v => v.dbSnpId !== '' && v.afExac !== null)
      .sort((a, b) => b.afExac - a.afExac)
      .slice(0, 15);
  }

  console.log('updated rawVariants.length', rawVariants.length)

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

    let vClass = '_ideoPathogenic';
    let bottomV = 13;
    let topV = 1;
    if (v.clinicalSignificance === 'Pathogenic/Likely pathogenic') {
      vClass = '_ideoPathogenicLikelyPathogenic';
      bottomV = 16;
      topV = 4;
    } else if (v.clinicalSignificance === 'Likely pathogenic') {
      vClass = '_ideoLikelyPathogenic';
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

    const polygonStyle = 'style="cursor: pointer;"';
    return `
      <g class="_ideoVariant ${vClass}" id="${v.clinvarVariantId}" ${polygonStyle}>
        <line x1="${v.x}" y1="10" x2="${v.x}" y2="25" />
        <polygon points="${points}" />
      </g>
    `;
  });

  const style =
    '<style>' +
      '._ideoPathogenic {stroke: #D00; fill: #FBB;} ' +
      '._ideoPathogenicLikelyPathogenic {stroke: #F55; fill: #FDD;} ' +
      '._ideoLikelyPathogenic {stroke: #F99500; fill: #FEC;} ' +
      '._ideoVariant._ideoBackgroundVariant {stroke: #BBB; fill: #EEE; opacity: 0.2;} ' +
    '</style>';
  const svg = style + lines.join('');

  ideo.variants = variants;

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
