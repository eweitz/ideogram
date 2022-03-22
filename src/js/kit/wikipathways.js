import {decompressSync, strFromU8} from 'fflate';
import { sortAnnotsByRank } from '../annotations/annotations';

// Definitions for ArrowHead values in WikiPathways GPML
//
// See also: https://discover.nci.nih.gov/mim/formal_mim_spec.pdf
const interactionArrowMap = {
  'Arrow': ['acts on', 'acted on by'],
  'TBar': ['inhibits', 'inhibited by'],
  'mim-binding': ['binds', 'binds'],
  'mim-catalysis': ['catalyzes', 'catalyzed by'],
  'mim-cleavage': ['cleaves', 'cleaved by'],
  'mim-conversion': ['converts', 'converted by'],
  // 'mim-covalent-bond': ['covalently binds',
  // 'mim-gap': 'MimGap',
  'mim-inhibition': ['inhibits', 'inhibited by'],
  'mim-modification': ['modifies', 'modified by'],
  'mim-necessary-stimulation':
    ['necessarily stimulates', 'necessarily stimulated by'],
  'mim-stimulation': ['stimulates', 'stimulated by'],
  'mim-transcription-translation':
    ['transcribes / translates', 'transcribed / translated by']
};

// Which interactions types to show first, if showing multiple
const rankedInteractionTypes = [
  'transcribe',
  'cleave',
  'convert',
  'bind',
  'modifie',
  'catalyze',
  'necessarily stimulate',
  'inhibit',
  'stimulate',
  'act'
];

export function sortInteractionTypes(a, b) {
  const ranks = {};
  for (let i = 0; i < rankedInteractionTypes.length; i++) {
    const rankedIxnType = rankedInteractionTypes[i];
    if (rankedIxnType.includes(a)) ranks.a = i;
    if (rankedIxnType.includes(b)) ranks.b = i;
  }
  return ranks.b - ranks.a;
}

/** Determine if all given interactions in *one* pathway are same */
function determineIxnsInPathwayAreSame(ixns, ixnTypeReference) {
  let isRefMatch = true;
  let thisIsSame = true;

  if (ixns.length === 0) return {isRefMatch, thisIsSame};

  const thisIxnTypeReference = ixns[0].ixnType.toLowerCase();
  ixns.forEach(ixn => {
    const ixnType = ixn.ixnType.toLowerCase();
    if (ixnType !== ixnTypeReference) {
      isRefMatch = false;
    }
    if (ixnType !== thisIxnTypeReference) {
      thisIsSame = false;
    }
  });
  return {isRefMatch, thisIsSame};
}

/**
 * Return first valid interaction type from interactions-by-pathway object
 */
function getIxnTypeReference(ixnsByPwid) {
  const ixnTypeReference = Object.values(ixnsByPwid).find(ixns => {
    return ixns.length > 0 && 'ixnType' in ixns[0];
  })[0].ixnType.toLowerCase();

  return ixnTypeReference;
}

/**
 * Determine whether all given interactions in all given pathways are the same
 */
function setIsSame(enrichedIxns) {
  let isSame = true;
  const ixnsByPwid = enrichedIxns.ixnsByPwid;

  const ixnTypeReference = getIxnTypeReference(ixnsByPwid);

  Object.entries(ixnsByPwid).map(([pwid, ixns]) => {
    const {isRefMatch, thisIsSame} =
      determineIxnsInPathwayAreSame(ixns, ixnTypeReference);
    if (!thisIsSame || !isRefMatch) {
      isSame = false;
    }
    enrichedIxns.isSameByPwid[pwid] = thisIsSame;
  });
  enrichedIxns.isSame = isSame;

  return enrichedIxns;
}

/**
 * If interactions aren't all exactly the same, then they are often still
 * directionally equivalent.
 *
 * E.g. if gene A both "modifies" and "converts" gene B, then we can summarize
 * that as gene A "acts on" gene B, rather than completely reverting to saying
 * gene A "interacts with" gene B.
 *
 */
function summarizeByDirection(enrichedIxns) {

  let isDirectionSame = true;

  const leftTypes = []; // "Acts on" types
  const rightTypes = []; // "Acted on by" types
  Object.values(interactionArrowMap).forEach(directedTypes => {
    rightTypes.push(directedTypes[0]);
    leftTypes.push(directedTypes[1]);
  });

  const right = 'Acts on';
  const left = 'Acted on by';

  const ixnsByPwid = enrichedIxns.ixnsByPwid;
  const firstIxnType = getIxnTypeReference(ixnsByPwid);
  const isRight = rightTypes.includes(firstIxnType);
  const directionReference = isRight ? right : left;

  Object.entries(ixnsByPwid).map(([pwid, ixns]) => {
    let isPwDirectionSame = true;
    if (ixns.length > 0) {
      const pwFirstIxnType = ixns[0].ixnType.toLowerCase();
      const pwIsRight = rightTypes.includes(pwFirstIxnType);
      const pwDirectionReference = pwIsRight ? right : left;
      ixns.forEach(ixn => {
        const ixnType = ixn.ixnType.toLowerCase();
        const thisIsRight = rightTypes.includes(ixnType);
        const direction = thisIsRight ? right : left;
        enrichedIxns.directionsByPwid[pwid] = direction;
        if (direction !== directionReference) {
          isDirectionSame = false;
        }
        if (direction !== pwDirectionReference) {
          isPwDirectionSame = false;
        }
      });
    }
    enrichedIxns.isDirectionSameByPwid[pwid] = isPwDirectionSame;

  });

  enrichedIxns.isDirectionSame = isDirectionSame;
  if (isDirectionSame === true) {
    enrichedIxns.direction = directionReference;
  }

  return enrichedIxns;
}

/**
 * Summarize interactions by direction
 *
 * @param {String} gene Interacting gene
 * @param {String} searchedGene Searched gene
 * @param {Array} pathwayIds List of WikiPathways IDs
 * @param {Object} gpmls Object of parsed GPML XMLs values, by pathway ID key
 * @returns
 */
export function summarizeInteractions(gene, searchedGene, pathwayIds, gpmls) {
  let summary = null;

  const ixnsByPwid =
    detailAllInteractions(gene, searchedGene, pathwayIds, gpmls);

  const ixns = ixnsByPwid[pathwayIds[0]];

  if (ixns.length > 0) {
    let enrichedIxns = {
      ixnsByPwid,
      isSameByPwid: {}, // If pathway has all same interaction types
      isSame: null, // If above is true for all pathways
      isDirectionSameByPwid: {}, // If pathway has same ixn direction
      isDirectionSame: null, // If above is true for all pathways
      directionsByPwid: {}
    };
    enrichedIxns = setIsSame(enrichedIxns);

    if (enrichedIxns.isSame) {
      const ixnType = ixns[0].ixnType;
      const newIxn = ixnType;
      summary = newIxn;
    } else {

      enrichedIxns = summarizeByDirection(enrichedIxns);

      if (enrichedIxns.isDirectionSame) {
        summary = enrichedIxns.direction;
      } else {
        summary = 'Interacts with';
      }
    }
  }


    // if (direction !== null) {
    //   summary = direction;
    // }
    // const pwidsByIxnType = {};
    // Object.entries(ixns).map(([k, v]) => {
    //   if (!pwidsByIxnType[v.ixnType]) {
    //     pwidsByIxnType[v.ixnType] = [v.pathwayId];
    //   } else {
    //     pwidsByIxnType[v.ixnType].push([v.pathwayId]);
    //   }
    // });

    // console.log('pwidsByIxnType')
    // console.log(pwidsByIxnType)
    // const tpArray = Object.entries(pwidsByIxnType);
    // const sortedIndices = sortInteractionTypes(tpArray.map(tp => tp[0]));
    // const sortedTpArray =
    //   sortedIndices.map(sortedIndex => tpArray[sortedIndex]);

    // console.log('sortedTpArray')
    // console.log(sortedTpArray)
  return summary;
}

/**
 * Get detailInteractions results for multiple pathways
 *
 * @param gene Interacting gene
 * @param pathwayIds List of WikiPathways IDs
 * @ideo ideo Ideogram instance object
 */
export function detailAllInteractions(gene, searchedGene, pathwayIds, gpmls) {
  const ixnsByPwid = {};

  pathwayIds.map(pathwayId => {
    const gpml = gpmls[pathwayId];
    const ixns = detailInteractions(gene, searchedGene, gpml);

    ixnsByPwid[pathwayId] = ixns;
  });
  return ixnsByPwid;
}

/** Get IDs and data element objects for searched or interacting gene */
function getMatches(gpml, label) {

  const nodes = Array.from(gpml.querySelectorAll(
    `DataNode[TextLabel="${label}"]`
  ));

  const genes = nodes.map(node => {
    return {
      type: 'node',
      matchedLabel: label,
      textLabel: node.getAttribute('TextLabel'),
      graphId: node.getAttribute('GraphId'),
      groupRef: node.getAttribute('GroupRef')
    };
  });

  // Get group identifiers
  const geneGraphIds = genes.map(g => g.graphId);
  const geneGroupRefs = genes.map(g => g.groupRef);
  const groupSelectors =
    geneGroupRefs.map(ggr => `Group[GroupId="${ggr}"]`).join(',');

  let geneGroups = [];
  if (groupSelectors !== '') {
    const groups = gpml.querySelectorAll(groupSelectors);
    geneGroups = Array.from(groups).map(group => {
      return {
        type: 'group',
        matchedLabel: label,
        graphId: group.getAttribute('GraphId'),
        groupId: group.getAttribute('GroupId')
      };
    });
  }

  const geneGroupGraphIds = geneGroups.map(g => g.graphId);
  const matchingGraphIds = geneGraphIds.concat(geneGroupGraphIds);

  const elements = genes.concat(geneGroups);

  return [matchingGraphIds, elements];
}

async function fetchGpml(pathwayId) {
  console.log('in fetchGpml')
  const pathwayFile = `${pathwayId}.xml.gz`;
  const gpmlUrl = `https://cdn.jsdelivr.net/npm/ixn2/${pathwayFile}`;
  const response = await fetch(gpmlUrl);
  const blob = await response.blob();
  const uint8Array = new Uint8Array(await blob.arrayBuffer());
  const rawGpml = strFromU8(decompressSync(uint8Array));

  console.log('in fetchGpml, after rawGpml')

  const gpml = new DOMParser().parseFromString(rawGpml, 'text/xml');

  // console.log('gpml:')
  // console.log(gpml)

  return gpml;
}

/**
 * Request compressed GPML files, which contain detailed interaction data, e.g.
 * https://cdn.jsdelivr.net/npm/ixn/WP3982.xml.gz
 *
 * For more easily readable versions, see also:
 * - https://www.wikipathways.org/index.php?title=Pathway:WP3982&action=edit
 * - https://www.wikipathways.org//wpi/wpi.php?action=downloadFile&type=gpml&pwTitle=Pathway:WP3982
 *
 * GPML (Graphical Pathway Markup Language) data encodes detailed interaction
 * data for biochemical pathways.
 */
export function fetchGpmls(ideo) {

  const pathwayIdsByInteractingGene = {};
  Object.entries(ideo.annotDescriptions.annots)
    .forEach(([annotName, descObj]) => {
      if ('type' in descObj && descObj.type.includes('interacting gene')) {
        pathwayIdsByInteractingGene[annotName] = descObj.pathwayIds;
      }
    });

  const gpmlsByInteractingGene = {};
  Object.entries(pathwayIdsByInteractingGene)
    .forEach(([ixnGene, pathwayIds]) => {
      gpmlsByInteractingGene[ixnGene] = {};
      pathwayIds.map(async pathwayId => {
        const gpml = await fetchGpml(pathwayId);
        gpmlsByInteractingGene[ixnGene][pathwayId] = gpml;
      });
    });

  ideo.gpmlsByInteractingGene = gpmlsByInteractingGene;
}

/**
 * Get interaction object from a GPML graphics XML element
 *
 * This interaction object connects the searched gene and interacting gene.
 */
function parseInteractionGraphic(graphic, graphIds) {
  let interaction = null;

  const {searchedGeneGraphIds, matchingGraphIds} = graphIds;

  const endGraphRefs = [];
  let numMatchingPoints = 0;
  let isConnectedToSourceGene = false;
  let ixnType = null;
  let searchedGeneIndex = null;

  Array.from(graphic.children).forEach(child => {
    if (child.nodeName !== 'Point') return;
    const point = child;
    const graphRef = point.getAttribute('GraphRef');
    if (graphRef === null) return;

    if (matchingGraphIds.includes(graphRef)) {
      numMatchingPoints += 1;
      endGraphRefs.push(graphRef);

      if (searchedGeneGraphIds.includes(graphRef)) {
        isConnectedToSourceGene = true;
      }

      if (point.getAttribute('ArrowHead')) {
        const arrowHead = point.getAttribute('ArrowHead');
        const isStart = searchedGeneGraphIds.includes(graphRef);
        if (searchedGeneIndex === null) {
          searchedGeneIndex = isStart ? 0 : 1;
        }
        ixnType = interactionArrowMap[arrowHead][isStart ? 0 : 1];
      }
    }
  });

  if (numMatchingPoints >= 2 && isConnectedToSourceGene) {
    if (searchedGeneIndex === null) {
      ixnType = 'interacts with';
    }
    ixnType = ixnType[0].toUpperCase() + ixnType.slice(1);
    const interactionGraphId = graphic.parentNode.getAttribute('GraphId');
    interaction = {
      'interactionId': interactionGraphId,
      'endIds': endGraphRefs,
      ixnType
    };
  }

  return interaction;
}

/**
 * Get all genes in the given pathway GPML
 */
export async function fetchPathwayInteractions(searchedGene, pathwayId, ideo) {
  console.log('in fetchPathwayInteractions')
  const gpml = await fetchGpml(pathwayId);
  // console.log('in fetchPathwayInteractions, after gpml, gpml')
  // Gets IDs and elements for searched gene and interacting gene, and,
  // if they're in any groups, the IDs of those groups
  const genes = {};

  // console.log('')
  let nodes
  try {
    nodes = Array.from(gpml.querySelectorAll('DataNode'));
  } catch (e) {
    console.log('in fetchPathwayInteractions, in catch')
  }
  console.log('in fetchPathwayInteractions, after nodes, nodes: ' + nodes)
  nodes.forEach(node => {
    console.log('in fetchPathwayInteractions, before label')
    const label = node.getAttribute('TextLabel');
    console.log('in fetchPathwayInteractions, after label')
    const normLabel = label.toLowerCase();
    // console.log('ideo')
    // console.log(ideo)
    // console.log('ideo.geneCache')
    // console.log(ideo.geneCache)
    const isKnownGene = normLabel in ideo.geneCache.nameCaseMap;
    console.log('in fetchPathwayInteractions, after isKnownGene')
    if (isKnownGene) {
      genes[label] = 1;
    }
  });

  console.log('in fetchPathwayInteractions, after nodes.forEach')

  const pathwayGenes = Object.keys(genes);
  const pathwayIxns = {};
  pathwayGenes.map(gene => {
    if (gene === searchedGene) return;
    const gpmls = {};
    gpmls[pathwayId] = gpml;
    const summary = summarizeInteractions(
      gene, searchedGene, [pathwayId], gpmls
    );
    pathwayIxns[gene] = (summary ? summary : 'Shares pathway with');
  });

  return pathwayIxns;
}

/**
 * Fetch GPML for pathway and find ID of Interaction between two genes,
 * and the ID of the two DataNodes for each of those interactions.
 *
 * WikiPathways SVG isn't detailed enough to reliably determine the specific
 * interaction elements relating two genes, given only the gene symbols.  This
 * fetches augmented GPML data for the pathway, and queries it to get only
 * interactions between the two genes.
 */
function detailInteractions(interactingGene, searchedGene, gpml) {

  // Gets IDs and elements for searched gene and interacting gene, and,
  // if they're in any groups, the IDs of those groups
  const [searchedGeneGraphIds, se] = getMatches(gpml, searchedGene);
  const [interactingGeneGraphIds, ie] = getMatches(gpml, interactingGene);

  const elements = {
    searchedGene: se,
    interactingGene: ie
  };

  const matchingGraphIds =
    searchedGeneGraphIds.concat(interactingGeneGraphIds);
  const graphIds = {searchedGeneGraphIds, matchingGraphIds};

  // Get interaction objects that connect the searched and interacting genes
  const interactions = [];
  const graphicsXml = gpml.querySelectorAll('Interaction Graphics');
  Array.from(graphicsXml).forEach(graphic => {
    const interaction = parseInteractionGraphic(graphic, graphIds);
    if (interaction !== null) {
      interaction.elements = elements;
      interactions.push(interaction);
    }
  });

  return interactions;
}

// export async function fetchInteractionDiagram(annot, descObj, ideo) {
//   // Fetch raw SVG for pathway diagram
//   const pathwayId = descObj.pathwayIds[0];
//   // const baseUrl = 'https://eweitz.github.io/cachome/wikipathways/';
//   const baseUrl = 'https://cachome.github.io/wikipathways/';
//   // const baseUrl = 'http://localhost/wikipathways/data/';
//   const diagramUrl = baseUrl + pathwayId + '.svg';
//   const response = await fetch(diagramUrl);
//   if (response.ok) {

//     // console.log('searchedGene', searchedGene)

//     const ixns = await detailInteractions(annot.name, pathwayId, ideo);

//     let selectors = `[name=${annot.name}]`;
//     let searchedGeneIndex = 0;
//     let interactingGeneIndex;
//     if (ixns.length > 0) {
//       selectors = ixns[0].endIds.map(id => '#' + id).join(',');
//       searchedGeneIndex = ixns[0].searchedGeneIndex;
//       interactingGeneIndex = (searchedGeneIndex === 0) ? 1 : 0;
//     }
//     // https://webservice.wikipathways.org/findInteractions?query=ACE2&format=json

//     const rawDiagram = await response.text();

//     const pathwayDiagram =
//       `<div class="pathway-diagram">${rawDiagram}</div>`;

//     annot.displayName += pathwayDiagram;

//     document.querySelector('#_ideogramTooltip').innerHTML =
//       annot.displayName;

//     Ideogram.d3.select('svg.Diagram')
//       .attr('width', 350)
//       .attr('height', 300);

//     const viewport = document.querySelector('.svg-pan-zoom_viewport');
//     viewport.removeAttribute('style');
//     viewport.removeAttribute('transform');

//     const matches = document.querySelectorAll(selectors);
//     console.log('matches', matches)
//     const match0 = matches[searchedGeneIndex]
//     const m0 = match0.getCTM();
//     const m0Rect = match0.getBoundingClientRect();
//     const m0Box = match0.getBBox();
//     const m0MinX = m0.e/m0.a;
//     const m0MinY = m0.f/m0.d;

//     let minX = m0MinX;
//     let minY = m0MinY;
//     let width;
//     let height;

//     width = 350;
//     height = 300;

//     // matches[0].children[0].setAttribute('fill', '#F55');
//     match0.children[0].style.fill = '#f55';

//     if (matches.length > 1) {
//       // console.log('matches.length > 1')
//       // matches[1].children[0].setAttribute('fill', '#C4C');
//       const match1 = matches[interactingGeneIndex];
//       // console.log('match1')
//       // console.log(match1)
//       match1.children[0].style.fill = '#c4c';
//       const m1 = matches[1].getCTM();
//       const m1Rect = matches[1].getBoundingClientRect();
//       const m1Box = matches[1].getBBox();
//       console.log('m0', m0)
//       console.log('m1', m1)
//       const m1MinX = m1.e/m1.a;
//       const m1MinY = m1.f/m1.d;
//       // const m1MinX = m1.e/m1.a + m1Rect.width;
//       // const m1MinY = m1.f/m1.d - m1Rect.height;
//       if (m1MinX < m0MinX) minX = m1MinX;
//       if (m1MinY < m0MinY) minY = m1MinY;

//       let pairWidth = 0;
//       if (m0Rect.left < m1Rect.left) {
//         // pairWidth = m1Rect.right - m0Rect.left;
//         width += m1Box.width + 40;
//       }

//       // width += pairWidth;

//       // console.log('m0Rect', m0Rect)
//       // console.log('m1Rect', m1Rect)
//       // console.log('m1MinX', m1MinX)
//       // console.log('m0MinX', m0MinX)
//       // console.log('m1MinY', m1MinY)
//       // console.log('m0MinY', m0MinY)
//       // console.log('pairWidth', pairWidth)
//       // console.log('width', width)
//       // width += Math.abs(m1MinX - m0MinX);
//       // height += Math.abs(m1MinY - m0MinY);

//       // minX -= 100;
//       // minY -= 100;

//       // minX -= 150;
//       // minY -= 150;
//     } else {
//       minX -= 150;
//       minY -= 150;
//     }

//     minX = Math.round(minX);
//     minY = Math.round(minY);
//     width = Math.round(width);
//     height = Math.round(height);

//     const viewBox = `${minX} ${minY} ${width} ${height}`;
//     console.log('viewBox', viewBox);
//     document.querySelector('svg.Diagram').setAttribute('viewBox', viewBox);

//   }
// }
