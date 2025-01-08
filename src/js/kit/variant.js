/**
 * @fileoverview Functions to render 2D protein structure, i.e. linear domains
 *
 * The protein diagrams are shown in the Gene Leads tooltip.
 */

import tippy from 'tippy.js';

import {
  getBpPerPx, getGeneFromStructureName, pipe
} from './gene-structure';

function getReviewStars(reviewStatus, showEmptyStars=false) {
  const fullStar = '<span style="color: #C89306">&#9733;</span>';
  const emptyStar = '<span style="color: #C89306">&#9734;</span>';
  const reviewStatuses = [
    'criteria provided, multiple submitters, no conflicts',
    'reviewed by expert panel',
    'practice guideline'
  ];
  const numStars = reviewStatuses.indexOf(reviewStatus) + 2;
  let stars = fullStar.repeat(numStars);

  if (showEmptyStars) {
    stars += emptyStar.repeat(4 - numStars);
  }

  const cleanStatus = reviewStatus[0].toUpperCase() + reviewStatus.slice(1);
  const tippyContent = `data-tippy-content="${cleanStatus}"`;
  stars = `<span class="_ideoReviewStatus" ${tippyContent}>${stars}</span>`;

  return stars;
}

function getTippyConfig(fallbackPlacements) {
  return {
    theme: 'light-border',
    popperOptions: { // Docs: https://atomiks.github.io/tippyjs/v6/all-props/#popperoptions
      modifiers: [ // Docs: https://popper.js.org/docs/v2/modifiers
        {
          name: 'flip',
          options: {
            fallbackPlacements // Defined via argument to this function
          }
        }
      ]
    },
    onShow: function() {
      // Ensure only 1 tippy tooltip is displayed at a time
      document.querySelectorAll('[data-tippy-root]')
        .forEach(tippyNode => tippyNode.remove());
    }
  };
}

function initTippy(ideo) {
  const toggle = getTippyConfig(['top-start', 'top']);
  ideo.tippyVariant = tippy('._ideoSpliceToggle[data-tippy-content]', toggle);

  const arrow = getTippyConfig(['bottom']);
  const updownTips = tippy('._ideoReviewStatus[data-tippy-content]', arrow);
  ideo.tippyVariant = ideo.tippyVariant.concat(updownTips);
}

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

  let head = positionalId;
  if (v.dbSnpId) {
    head += ` ${pipe} ${v.dbSnpId}`;
  };
  const interestingOrigin = v.origin && v.origin !== 'germline'
  if (v.rawReviewStatus !== 0 || interestingOrigin) {
    head += ` ${pipe} `;
    if (v.rawReviewStatus !== 0) {
      const stars = getReviewStars(v.reviewStatus);
      head += stars;
    }
    if (v.rawReviewStatus !== 0 && interestingOrigin) {
      head += ' ';
    }
    if (interestingOrigin) {
      head += v.origin;
    }
  }

  const detailedStars = getReviewStars(v.reviewStatus, true);

  let extraHeight = 0;
  if (isFullDetail) {
    extraHeight += Math.min(v.diseases.length, 5) * 13;
    if (v.origin) extraHeight += 13;
    if (v.afExac) extraHeight += 13;
  }

  const height = (isFullDetail ? 110 : 87) + extraHeight;
  const style =
    `height: ${height}px; ` +
    'margin-top: 15px; ';

  let supplementaryDetails;
  if (!isFullDetail) {
    supplementaryDetails = '<div><i>Click variant for more details</i></div>';
  } else {
    supplementaryDetails =
    `<div>Variant type: ${v.variantType}</div>` +
    `<div>Review status: ${detailedStars}</div>` +
    (v.origin ? `<div>Origin: ${v.origin}</div>` : '') +
    (v.afExac ? `<div>Allele frequency (ExAC): ${v.afExac}</div>` : '') +
    `<div>ClinVar Variation ID: ${v.clinvarVariantId}</div>` +
    `<br/>`;
  }

  const diseaseStyle =
    'max-height: 70px; ' +
    'overflow-y: scroll; ' +
    'width: 275px; ' +
    'margin: auto;'; // Center text even when long pathway or gene name

  let diseaseBar = '';
  if (isFullDetail && v.diseases.length >= 5) {
    const diseaseBarStyle =
      `width: 100px; ` +
      'height: 5px; ' +
      'position: relative; top: 6px; ' +
      'box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.1); ' +
      'margin: auto;';
    diseaseBar = `<div style="${diseaseBarStyle}"></div>`;
  }

  const variantSummary = `
    <div class="_ideoVariantSummary" style="${style}">
      <div>${head}</div>
      <br/>
      <div>${v.clinicalSignificance} in:</div>
      <div style="${diseaseStyle}">
      ${diseases}
      </div>
      ${diseaseBar}
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

  const isG = event.target.tagName === 'g';
  const thisVariant = isG ? event.target : event.target.parentElement;

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
  const varId = isG ? target.id : target.parentElement.id;
  const variant = ideo.variants.find(v => 'v' + v.clinvarVariantId === varId);
  const variantSummary = getVariantSummary(variant, isFullDetail);
  tissuePlot.style.display = 'none';
  head.style.display = 'none';
  tissueContainer.insertAdjacentHTML('beforeend', variantSummary);
  initTippy(ideo);
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

  return features;
}

/** Get the highest-priority variants */
function triageVariants(rawVariants, maxVariants) {
  const tier1Variants = rawVariants
    .filter(v => v.dbSnpId !== '' && v.afExac !== null)
    .sort((a, b) => b.afExac - a.afExac)
    .slice(0, maxVariants);

  let selectedVariants = tier1Variants;
  let selectedIds = selectedVariants.map(v => 'v' + v.clinvarVariantId);

  if (selectedVariants.length < maxVariants) {
    const tier2Variants = rawVariants
      .filter(v => {
        return (
          (v.dbSnpId !== '' || v.afExac !== null) &&
          !selectedIds.includes('v' + v.clinvarVariantId)
        );
      })
      .sort((a, b) => b.rawOrigin - a.rawOrigin)
      .sort((a, b) => b.rawClinicalSignifiance - a.rawClinicalSignifiance)
      .sort((a, b) => b.rawReviewStatus - a.rawReviewStatus)
      .sort((a, b) => b.afExac - a.afExac)
      .slice(0, maxVariants - selectedVariants.length);

    selectedIds =
      selectedIds.concat(tier2Variants.map(v => 'v' + v.clinvarVariantId));

    selectedVariants = selectedVariants.concat(tier2Variants);

    if (selectedVariants.length < maxVariants) {
      const tier3Variants = rawVariants
        .filter(v => !selectedIds.includes('v' + v.clinvarVariantId))
        .sort((a, b) => b.rawOrigin - a.rawOrigin)
        .sort((a, b) => b.rawClinicalSignifiance - a.rawClinicalSignifiance)
        .sort((a, b) => b.rawReviewStatus - a.rawReviewStatus)
        .slice(0, maxVariants - selectedVariants.length);

      selectedVariants = selectedVariants.concat(tier3Variants);
    }
  }

  return selectedVariants;
}

/** Get SVG showing 2D variant features */
export async function getVariantsSvg(
  geneStructure, subparts, ideo
) {
  const t0 = Date.now();

  const structureName = geneStructure.name;
  const startOffset = geneStructure.startOffset;

  const gene = getGeneFromStructureName(structureName, ideo);

  const cache = ideo.variantCache;

  let rawVariants = await cache.getVariants(gene, ideo);

  if (rawVariants.length === 0) {
    return null;
  }

  const maxVariants = 10;
  if (rawVariants.length > maxVariants) {
    rawVariants = triageVariants(rawVariants, maxVariants);
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
      <g class="_ideoVariant ${vClass}" id="v${v.clinvarVariantId}" ${polygonStyle}>
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
