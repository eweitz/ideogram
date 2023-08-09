/**
 * @fileoverview Functions to render 2D protein structure, i.e. linear domains
 *
 * The protein diagrams are shown in the Gene Leads tooltip.
 */

import {addPositions, getGeneFromStructureName, pipe} from './gene-structure';
import {getColors} from './protein-color';

/** Get subtle line to visually demarcate feature boundary */
function getFeatureBorderLines(
  x, y, width, baseHeight, lineColor, addTopBottom=false
) {
  const height = y + baseHeight;
  const lineStroke = `stroke="${lineColor}"`;
  const leftLineAttrs =
    `x1="${x}" x2="${x}" y1="${y}" y2="${height}" ${lineStroke}`;

  const x2 = x + width;
  const rightLineAttrs =
    `x1="${x2}" x2="${x2}" y1="${y}" y2="${height}" ${lineStroke}`;

  const startBorder = `<line class="subpart-line" ${leftLineAttrs} />`;
  const endBorder = `<line class="subpart-line" ${rightLineAttrs} />`;

  // Added to feature if any part of protein has topology data
  let topBorder = '';
  let bottomBorder = '';
  if (addTopBottom) {
    const topLineAttrs =
      `x1="${x}" x2="${x2}" y1="${y}" y2="${y}" ${lineStroke}`;
    const bottomLineAttrs =
      `x1="${x}" x2="${x2}" y1="${height}" y2="${height}" ${lineStroke}`;
    topBorder = `<line class="subpart-line" ${topLineAttrs} />`;
    bottomBorder = `<line class="subpart-line" ${bottomLineAttrs} />`;
  }

  return startBorder + endBorder + topBorder + bottomBorder;
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

function isTopologyFeature(feature) {
  return feature[0][0] === '_';
}

function isSignalPeptideFeature(feature) {
  return feature[0] === 'S';
}

const topologyFeatureMap = {
  '_H': 'Helical',
  '_E': 'Extracellular',
  '_C': 'Cytoplasmic'
};
function decompressTopologyFeature(feature) {
  if (feature in topologyFeatureMap) {
    return topologyFeatureMap[feature];
  } else {
    return feature.slice(1);
  }
}

/** Get SVG for an inidividual protein domain */
function getFeatureSvg(feature, cds, isPositiveStrand, hasTopology) {
  let featureType = feature[0];
  const featurePx = feature[3];

  let x = cds.px.start + featurePx.x;
  let width = featurePx.width;
  if (!isPositiveStrand) {
    x = cds.px.length + cds.px.start - (featurePx.x + featurePx.width);
  };

  // Perhaps make these configurable, later
  let y = 40;
  let height = 14;
  const isTopology = isTopologyFeature(feature);
  const isSignal = isSignalPeptideFeature(feature);
  let topoAttr = '';
  if (hasTopology) {
    y = 48;
    if (isTopology) {
      featureType = decompressTopologyFeature(feature[0]);
      y = 40;
      height = 30;

      const featureDigest = `${feature[0]} ${feature[1]} ${feature[2]}`;

      if (
        // E.g. EGF-206 alternative isoform, C-terminal cytoplasmic domain
        isPositiveStrand && featurePx.x + featurePx.width > cds.px.length + 3 ||

        // E.g. SCARB1-201 canonical isoform, C-terminal cytoplasmic domain
        !isPositiveStrand && featurePx.x + featurePx.width > cds.px.length + 3
      ) {
        console.debug(`Truncate protein topology feature: ${featureDigest}`);
        width -= (featurePx.x + featurePx.width) - cds.px.length;
        if (!isPositiveStrand) {
          x += width;
        }
      }
      topoAttr = 'data-topology="true"';

      if (width < 0) {
        // E.g. LDLR-202 alternative isoform, multiple features
        const issue = 'Width < 0, omit protein topology feature';
        console.debug(`${issue}: ${featureDigest}`);
        return '';
      };
    }
  }

  const [color, lineColor] = getColors(featureType);

  if (isSignal) {
    featureType = 'Signal peptide';
    height = 8;
    y += 3;
  }

  if (isTopology) {
    if (featureType === 'Helical') {
      featureType = 'Transmembrane';
    } else if (featureType.startsWith('Helical --- Name=')) {
      featureType = featureType.replace('Helical --- Name=', 'Transmembrane: ');
    }
  }

  const lengthAa = `${feature[2]}&nbsp;aa`;
  const title = `data-subpart="${featureType} ${pipe} ${lengthAa}"`;
  const data = title;

  const pos = `x="${x}" width="${width}" y="${y}" height="${height}"`;
  const topoCls = isTopology ? ' topology' : '';
  const cls = `class="subpart domain${topoCls}" `;

  const addTopBottom = !isTopology;
  const line =
    getFeatureBorderLines(x, y, width, height, lineColor, addTopBottom);
  const domainSvg =
    `<rect ${cls} rx="1.5" fill="${color}" ${pos} ${data} ${topoAttr}/>` +
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

function getProteinRect(cds, hasTopology) {
  const y = hasTopology ? '53' : '45';
  const fill = hasTopology ? 'BBB' : 'DDD';
  const stroke = hasTopology ? '555' : '777';
  const proteinRect =
    `<rect class="_ideoProteinLine"` +
      `x="${cds.px.start}" width="${cds.px.length}" ` +
      `y="${y}" height="4" ` +
      `fill="#${fill}" ` +
      `stroke="#${stroke}" ` +
    `/>`;
  return proteinRect;
}

/**
 * Determine if any protein isoforms for this gene have topology features
 *
 * Helps ensure transcripts can be rapidly navigated via arrows in dropdown
 * menu, even when some proteins of the gene have topology and some do not.
 *
 * Example: LDLR
 */
export function getHasTopology(gene, ideo) {
  const hasTopology = ideo.proteinCache[gene].some(entry => {
    return entry.protein.some(
      feature => isTopologyFeature(feature)
    );
  });
  return hasTopology;
}

/** Get SVG showing 2D protein features, e.g. domains from InterPro */
export function getProtein(
  structureName, subparts, isPositiveStrand, hasTopology, ideo
) {
  let features = [];
  const gene = getGeneFromStructureName(structureName, ideo);

  const isEligible = isEligibleforProteinSvg(gene, ideo);
  if (!isEligible) return ['<br/>', null];

  const entry = ideo.proteinCache[gene].find(d => {
    return d.transcriptName === structureName;
  });
  if (!entry) return ['<br/>', null];
  const protein = entry.protein;
  const cds = getCdsCoordinates(subparts, isPositiveStrand);

  // Number of amino acids in protein
  //
  // Some principles of molecular biology:
  //   - Coding sequence (CDS) of mRNA specifies amino acids comprising protein
  //   - Each amino acid is specified by 3 nucleotides (i.e. codon; 3 nt / aa)
  //   - 1 codon -- the stop codon -- is not part of protein
  //
  // TODO: account for phase
  //
  // const proteinLengthAa = Math.floor(cds.bp.length/3) - 1;
  const proteinLengthAa = null;

  const domains = addPositions(subparts, protein);

  const topologies = [];
  for (let i = 0; i < domains.length; i++) {
    const domain = domains[i];
    const isTopology = isTopologyFeature(domain);
    const svg = getFeatureSvg(domain, cds, isPositiveStrand, hasTopology);
    if (isTopology) {
      topologies.push(svg);
    } else {
      features.push(svg);
    }
  }

  // Order SVG so protein domains, sites, etc. are in front,
  // then unannotated protein,
  // then protein topology features
  const proteinRect = getProteinRect(cds, hasTopology);
  topologies.push(proteinRect);
  features = topologies.concat(features);

  const proteinSvg =
    `<g id="_ideoProtein">${features.join('')}</g>`;

  return [proteinSvg, proteinLengthAa];
}
