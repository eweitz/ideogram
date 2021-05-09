/**
 * @fileoverview Kit used in "Related genes" example
 *
 * This file simplifies client code for reusing a "related genes" ideogram --
 * which finds and displays related genes for a searched gene.
 *
 * Related genes here are either "interacting genes" or "paralogs".
 * Interacting genes are genes that immediate upstream or downstream of the
 * searched gene in a biochemical pathway. Paralogs are evolutionarily
 * similar genes in the same species.
 *
 * Data sources:
 *   - Interacting genes: WikiPathways
 *   - Paralogs: Ensembl
 *   - Genomic coordinates: Ensembl, via MyGene.info
 *
 * Features provided by this module help users discover and explore genes
 * related to their gene of interest.
 *
 * The reference implementation is available at:
 * https://eweitz.github.io/ideogram/related-genes
 */

import {
  initAnalyzeRelatedGenes, analyzePlotTimes, analyzeRelatedGenes, timeDiff,
  getRelatedGenesByType, getRelatedGenesTooltipAnalytics
} from './analyze-related-genes';


import {writeLegend} from '../annotations/legend';
import {getAnnotDomId} from '../annotations/process';
import {getDir} from '../lib';

/** Sets DOM IDs for ideo.relatedAnnots; needed to associate labels */
function setRelatedAnnotDomIds(ideo) {
  const updated = [];

  const sortedChrNames = ideo.chromosomesArray.map((chr) => {
    return chr.name;
  });

  // Arrange related annots by chromosome
  const annotsByChr = {};
  ideo.relatedAnnots.forEach((annot) => {
    if (annot.chr in annotsByChr) {
      annotsByChr[annot.chr].push(annot);
    } else {
      annotsByChr[annot.chr] = [annot];
    }
  });

  // Sort related annots by relevance within each chromosome
  const relevanceSortedAnnotsNamesByChr = {};
  Object.entries(annotsByChr).map(([chr, annots]) => {

    // Reverse-sort, so first annots are drawn last, and thus at top layer
    annots.sort((a, b) => ideo.annotSortFunction(a, b));

    const annotNames = annots.map((annot) => annot.name).reverse();
    relevanceSortedAnnotsNamesByChr[chr] = annotNames;
  });

  ideo.relatedAnnots.forEach((annot) => {
    const chr = annot.chr;

    // Annots have DOM IDs keyed by chromosome index and annotation index.
    // We reconstruct those here using structures built in two blocks above.
    const chrIndex = sortedChrNames.indexOf(chr);
    const annotIndex =
      relevanceSortedAnnotsNamesByChr[chr].indexOf(annot.name);

    annot.domId = getAnnotDomId(chrIndex, annotIndex);
    updated.push(annot);
  });

  ideo.relatedAnnots = updated;
}

/**
 * Determines if interaction node might be a gene
 *
 * Some interaction nodes are biological processes; this filters out many.
 * Filtering these out makes downstream queries faster.
 *
 * ixn {Object} Interaction from WikiPathways
 * gene {Object} Gene from MyGene.info
 */
function maybeGeneSymbol(ixn, gene) {
  return (
    ixn !== '' &&
    !ixn.includes(' ') &&
    !ixn.includes('/') && // e.g. Akt/PKB
    ixn.toLowerCase() !== gene.name.toLowerCase()
  );
}

// /** Helpful for debugging race conditions caused by concurrency */
// const sleep = (delay) => {
//  new Promise((resolve) => setTimeout(resolve, delay));
// }

/**
 * Retrieves interacting genes from WikiPathways API
 *
 * Docs:
 * https://webservice.wikipathways.org/ui/
 * https://www.wikipathways.org/index.php/Help:WikiPathways_Webservice/API
 *
 * Examples:
 * https://webservice.wikipathways.org/findInteractions?query=ACE2&format=json
 * https://webservice.wikipathways.org/findInteractions?query=RAD51&format=json
 */
async function fetchInteractions(gene, ideo) {
  const ixns = {};
  const seenNameIds = {};
  const orgNameSimple = ideo.config.organism.replace(/-/g, ' ');
  const queryString = `?query=${gene.name}&format=json`;
  const url =
    `https://webservice.wikipathways.org/findInteractions${queryString}`;

  // await sleep(3000);

  const response = await fetch(url);
  const data = await response.json();

  // For each interaction, get nodes immediately upstream and downstream.
  // Filter out pathway nodes that are definitely not gene symbols, then
  // group pathways by (likely) gene symbol. Each interacting gene can have
  // multiple pathways.
  data.result.forEach(interaction => {
    if (interaction.species.toLowerCase() === orgNameSimple) {
      const right = interaction.fields.right.values;
      const left = interaction.fields.left.values;
      const rawIxns = right.concat(left);
      const name = interaction.name;
      const id = interaction.id;

      rawIxns.forEach(rawIxn => {

        // Prevent overwriting searched gene.  Occurs with e.g. human CD4
        if (rawIxn.includes(gene.name)) return;

        const nameId = name + id;
        if (maybeGeneSymbol(rawIxn, gene) && !(nameId in seenNameIds)) {
          seenNameIds[nameId] = 1;
          const ixn = {name, pathwayId: id};
          if (rawIxn in ixns) {
            ixns[rawIxn].push(ixn);
          } else {
            ixns[rawIxn] = [ixn];
          }
        }
      });
    }
  });

  return ixns;
}

/**
 * Queries MyGene.info API, returns parsed JSON
 *
 * Docs:
 * https://docs.mygene.info/en/v3/
 *
 * Example:
 * https://mygene.info/v3/query?q=symbol:cdk2%20OR%20symbol:brca1&species=9606&fields=symbol,genomic_pos,name
 */
async function fetchMyGeneInfo(queryString) {
  const myGeneBase = 'https://mygene.info/v3/query';
  const response = await fetch(myGeneBase + queryString + '&size=20');
  const data = await response.json();
  return data;
}

function parseNameAndEnsemblIdFromMgiGene(gene) {
  const name = gene.name;
  const id = gene.genomic_pos.ensemblgene;
  let ensemblId = id;
  if (typeof id === 'undefined') {
    // Encountered in AKT3, when querying related genes for MTOR
    // A 'chr'omosome value containing _ indicates an alt loci scaffold,
    // so ignore that and take the Ensembl ID associated with the
    // first position of a primary chromosome.
    ensemblId =
      gene.genomic_pos.filter(pos => !pos.chr.includes('_'))[0].ensemblgene;
  }
  return {name, ensemblId};
}

/**
 * Summarizes interactions for a gene
 *
 * This comprises most of the content for tooltips for interacting genes.
 */
function describeInteractions(gene, ixns, searchedGene) {

  const pathwayIds = [];
  const pathwayNames = [];
  let ixnsDescription = '';

  if (typeof ixns !== 'undefined') {
    // ixns is undefined when querying e.g. CDKN1B in human
    const pathwaysBase = 'https://www.wikipathways.org/index.php/Pathway:';
    const links = ixns.map(ixn => {
      const url = `${pathwaysBase}${ixn.pathwayId}`;
      pathwayIds.push(ixn.pathwayId);
      pathwayNames.push(ixn.name);
      return `<a href="${url}" target="_blank">${ixn.name}</a>`;
    }).join('<br/>');

    ixnsDescription =
      `Interacts with ${searchedGene.name} in:<br/>${links}`;
  }

  const {name, ensemblId} = parseNameAndEnsemblIdFromMgiGene(gene);
  const type = 'interacting gene';
  const descriptionObj = {
    description: ixnsDescription,
    ixnsDescription, ensemblId, name, type, pathwayIds, pathwayNames
  };
  return descriptionObj;
}

/**
 * Retrieves position and other data on interacting genes from MyGene.info
 */
async function fetchInteractionAnnots(interactions, searchedGene, ideo) {

  const annots = [];
  const geneList = Object.keys(interactions);

  if (geneList.length === 0) return annots;

  const ixnParam = geneList.map(ixn => {
    return `symbol:${ixn.trim()}`;
  }).join(' OR ');

  const taxid = ideo.config.taxid;
  const queryString =
    `?q=${ixnParam}&species=${taxid}&fields=symbol,genomic_pos,name`;
  const data = await fetchMyGeneInfo(queryString);

  data.hits.forEach(gene => {
    // If hit lacks position
    // or is same as searched gene (e.g. search for human SRC),
    // then skip processing
    if (
      'genomic_pos' in gene === false ||
      gene.symbol === searchedGene.name
    ) {
      return;
    }

    const annot = parseAnnotFromMgiGene(gene, ideo, 'purple');
    annots.push(annot);

    const ixns = interactions[gene.symbol];

    const descriptionObj = describeInteractions(gene, ixns, searchedGene);

    mergeDescriptions(annot, descriptionObj, ideo);
  });

  return annots;
}

// Commented out because call to Ensembl threw false-positive 400 error
// Also had historically been slow, and included an extraneous OPTIONS
// request that would often double effective response time.
//
// See alternative in fetchParalogPositionsFromMyGeneInfo
//
// /** Fetch positions of paralogs from Ensembl REST API */
// async function fetchParalogPositionsFromEnsembl(homologs, ideo) {
//   const annots = [];
//   const orgUnderscored = ideo.config.organism.replace(/[ -]/g, '_');

//   const homologIds = homologs.map(homolog => homolog.id);
//   const path = '/lookup/id/' + orgUnderscored;
//   const body = {
//     ids: homologIds,
//     species: orgUnderscored,
//     object_type: 'gene'
//   };
//   const ensemblHomologGenes =
//     await Ideogram.fetchEnsembl(path, body, 'POST');

//   Object.entries(ensemblHomologGenes).map((idGene, i) => {
//     const gene = idGene[1];

//     // Seen in related genes for SIRT2 in Pan troglodytes
//     if ('display_name' in gene === false) return;

//     const annot = {
//       name: gene.display_name,
//       chr: gene.seq_region_name,
//       start: gene.start,
//       stop: gene.end,
//       id: gene.id,
//       color: 'pink'
//     };

//     annots.push(annot);
//     const description = gene.description;
//     const ensemblId = gene.id;
//     const name = gene.description.split(' [')[0];
//     const type = 'paralogous gene';
//     const descriptionObj = {description, ensemblId, name, type};
//     ideo.annotDescriptions.annots[annot.name] = descriptionObj;
//   });

//   return annots;
// }

/** Fetch paralog positions from MyGeneInfo */
async function fetchParalogPositionsFromMyGeneInfo(
  homologs, searchedGene, ideo
) {
  const annots = [];
  const qParam = homologs.map(homolog => {
    return `ensemblgene:${homolog.id}`;
  }).join(' OR ');

  const taxid = ideo.config.taxid;
  const queryString =
    `?q=${qParam}&species=${taxid}&fields=symbol,genomic_pos,name`;
  const data = await fetchMyGeneInfo(queryString);

  data.hits.forEach(gene => {

    // If hit lacks position, skip processing
    if ('genomic_pos' in gene === false) return;
    if ('name' in gene === false) return;

    const annot = parseAnnotFromMgiGene(gene, ideo, 'pink');
    annots.push(annot);

    const description = `Paralog of ${searchedGene.name}`;
    const {name, ensemblId} = parseNameAndEnsemblIdFromMgiGene(gene);
    const type = 'paralogous gene';
    const descriptionObj = {description, ensemblId, name, type};
    mergeDescriptions(annot, descriptionObj, ideo);
  });

  return annots;
}

/**
 * Fetch paralogs of searched gene
 */
async function fetchParalogs(annot, ideo) {
  const taxid = ideo.config.taxid;

  // Fetch paralogs
  const params = `&format=condensed&type=paralogues&target_taxon=${taxid}`;
  const path = `/homology/id/${annot.id}?${params}`;
  const ensemblHomologs = await Ideogram.fetchEnsembl(path);
  const homologs = ensemblHomologs.data[0].homologies;

  // Fetch positions of paralogs
  const annots =
    await fetchParalogPositionsFromMyGeneInfo(homologs, annot, ideo);

  return annots;
}

/**
 * Transforms MyGene.info (MGI) gene into Ideogram annotation
 */
function parseAnnotFromMgiGene(gene, ideo, color='red') {
  // Filters out placements on alternative loci scaffolds, an advanced
  // genome assembly feature we are not concerned with in ideograms.
  //
  // Example:
  // https://mygene.info/v3/query?q=symbol:PTPRC&species=9606&fields=symbol,genomic_pos,name
  let genomicPos = null;
  if (Array.isArray(gene.genomic_pos)) {
    genomicPos = gene.genomic_pos.filter(pos => {
      return pos.chr in ideo.chromosomes[ideo.config.taxid];
    })[0];
  } else {
    genomicPos = gene.genomic_pos;
  }

  const annot = {
    name: gene.symbol,
    chr: genomicPos.chr,
    start: genomicPos.start,
    stop: genomicPos.end,
    id: genomicPos.ensemblgene,
    color
  };

  return annot;
}

function moveLegend() {
  const ideoInnerDom = document.querySelector('#_ideogramInnerWrap');
  const decorPad = setRelatedDecorPad({}).legendPad;
  const left = decorPad + 20;
  const legendStyle = `position: absolute; top: 15px; left: ${left}px`;
  const legend = document.querySelector('#_ideogramLegend');
  ideoInnerDom.prepend(legend);
  legend.style = legendStyle;
}

/** Filter annotations to only include those in configured list */
function applyAnnotsIncludeList(annots, ideo) {

  if (ideo.config.annotsInList === 'all') return annots;

  const includedAnnots = [];
  annots.forEach(annot => {
    if (ideo.config.annotsInList.includes(annot.name.toLowerCase())) {
      includedAnnots.push(annot);
    }
  });
  return includedAnnots;
}

/** Fetch and draw interacting genes, return Promise for annots */
function processInteractions(annot, ideo) {
  return new Promise(async (resolve) => {
    const t0 = performance.now();

    const interactions = await fetchInteractions(annot, ideo);
    const annots = await fetchInteractionAnnots(interactions, annot, ideo);
    ideo.relatedAnnots.push(...annots);
    finishPlotRelatedGenes('interacting', ideo);

    ideo.time.rg.interactions = timeDiff(t0);

    resolve();
  });
}

/** Find and draw paralogs, return Promise for annots */
function processParalogs(annot, ideo) {
  return new Promise(async (resolve) => {
    const t0 = performance.now();

    const annots = await fetchParalogs(annot, ideo);
    ideo.relatedAnnots.push(...annots);
    finishPlotRelatedGenes('paralogous', ideo);

    ideo.time.rg.paralogs = timeDiff(t0);

    resolve();
  });
}

/** Sorts by relevance of related status */
function sortAnnotsByRelatedStatus(a, b) {
  var aName, bName, aColor, bColor;
  if ('name' in a) {
    // Locally processed annotations
    aName = a.name;
    bName = b.name;
    aColor = a.color;
    bColor = b.color;
  } else {
    // Raw annotations
    [aName, aColor] = [a[0], a[3]];
    [bName, bColor] = [b[0], b[3]];
  }

  // Rank red (searched gene) highest
  if (aColor === 'red') return -1;
  if (bColor === 'red') return 1;

  // Rank purple (interacting gene) above red (paralogous gene)
  if (aColor === 'purple' && bColor === 'pink') return -1;
  if (bColor === 'purple' && aColor === 'pink') return 1;

  // Rank shorter names above longer names
  if (bName.length !== aName.length) return bName.length - aName.length;

  // Rank names of equal length alphabetically
  return [aName, bName].sort().indexOf(aName) === 0 ? 1 : -1;
}

function mergeDescriptions(annot, desc, ideo) {
  let mergedDesc;
  const descriptions = ideo.annotDescriptions.annots;
  if (annot.name in descriptions) {
    mergedDesc = descriptions[annot.name];
    mergedDesc.type += ', ' + desc.type;
    mergedDesc.description += `<br/><br/>${desc.description}`;
  } else {
    mergedDesc = desc;
  }
  ideo.annotDescriptions.annots[annot.name] = mergedDesc;
}

function mergeAnnots(unmergedAnnots) {

  const seenAnnots = {};
  let mergedAnnots = [];

  unmergedAnnots.forEach((annot) => {
    if (annot.name in seenAnnots === false) {
      mergedAnnots.push(annot);
      seenAnnots[annot.name] = 1;
    } else {
      if (annot.color === 'purple') {
        mergedAnnots = mergedAnnots.map((mergedAnnot) => {
          return (annot.name === mergedAnnot.name) ? annot : mergedAnnot;
        });
      }
    }
  });

  return mergedAnnots;
}

/** Filter, sort, draw annots.  Move legend. */
function finishPlotRelatedGenes(type, ideo) {
  let annots = ideo.relatedAnnots.slice();

  annots = applyAnnotsIncludeList(annots, ideo);
  annots = mergeAnnots(annots);
  ideo.relatedAnnots = mergeAnnots(annots);
  annots.sort(sortAnnotsByRelatedStatus);
  ideo.relatedAnnots.sort(sortAnnotsByRelatedStatus);

  if (annots.length > 1 && ideo.onFindRelatedGenesCallback) {
    ideo.onFindRelatedGenesCallback();
  }

  ideo.drawAnnots(annots);

  if (ideo.config.showAnnotLabels) {
    setRelatedAnnotDomIds(ideo);
    ideo.fillAnnotLabels(ideo.relatedAnnots);
  }

  moveLegend();

  analyzePlotTimes(type, ideo);
}

/** Fetch position of searched gene, return corresponding annotation */
async function processSearchedGene(geneSymbol, ideo) {
  const t0 = performance.now();

  // Fetch positon of searched gene
  const taxid = ideo.config.taxid;
  const queryString =
    `?q=symbol:${geneSymbol}&species=${taxid}&fields=symbol,genomic_pos,name`;
  const data = await fetchMyGeneInfo(queryString);

  if (data.hits.length === 0) {
    return;
  }
  const gene = data.hits[0];
  const name = gene.name;
  const ensemblId = gene.genomic_pos.ensemblgene;
  ideo.annotDescriptions.annots[gene.symbol] = {
    description: '', ensemblId, name, type: 'searched gene'
  };

  const annot = parseAnnotFromMgiGene(gene, ideo);

  ideo.relatedAnnots.push(annot);

  ideo.time.rg.searchedGene = timeDiff(t0);

  return annot;
}

function adjustPlaceAndVisibility(ideo) {
  var ideoContainerDom = document.querySelector(ideo.config.container);

  ideoContainerDom.style.visibility = '';
  ideoContainerDom.style.position = 'absolute';
  ideoContainerDom.style.width = '100%';

  var ideoInnerDom = document.querySelector('#_ideogramInnerWrap');
  ideoInnerDom.style.position = 'relative';
  ideoInnerDom.style.marginLeft = 'auto';
  ideoInnerDom.style.marginRight = 'auto';
  ideoInnerDom.style.overflowY = 'hidden';
  document.querySelector('#_ideogramMiddleWrap').style.overflowY = 'hidden';

  const legendPad = ideo.config.legendPad;

  if (typeof ideo.didAdjustIdeogramLegend === 'undefined') {
    // Accounts for moving legend when external content at left or right
    // is variable upon first rendering plotted genes

    var ideoDom = document.querySelector('#_ideogram');
    const legendWidth = 160;
    ideoInnerDom.style.maxWidth =
      (
        parseInt(ideoInnerDom.style.maxWidth) +
        legendWidth +
        legendPad
      ) + 'px';

    ideoDom.style.minWidth =
      (parseInt(ideoDom.style.minWidth) + legendPad) + 'px';
    ideoDom.style.maxWidth =
      (parseInt(ideoDom.style.minWidth) + legendPad) + 'px';
    ideoDom.style.position = 'relative';
    ideoDom.style.left = legendWidth + 'px';

    ideo.didAdjustIdeogramLegend = true;
  }
}

/**
 * For given gene, finds and draws interacting genes and paralogs
 *
 * @param geneSymbol {String} Gene symbol, e.g. RAD51
 */
async function plotRelatedGenes(geneSymbol=null) {

  const ideo = this;

  ideo.clearAnnotLabels();
  const legend = document.querySelector('#_ideogramLegend');
  if (legend) legend.remove();

  if (!geneSymbol) {
    return plotGeneHints(ideo);
  }

  ideo.config = setRelatedDecorPad(ideo.config);

  const organism = ideo.getScientificName(ideo.config.taxid);
  const version = Ideogram.version;
  const headers = [
    `# Related genes for ${geneSymbol} in ${organism}`,
    `# Generated by Ideogram.js version ${version}, https://github.com/eweitz/ideogram`,
    `# Generated at ${window.location.href}`
  ].join('\n');

  delete ideo.annotDescriptions;
  ideo.annotDescriptions = {headers, annots: {}};

  const ideoSel = ideo.selector;
  const annotSel = ideoSel + ' .annot';
  document.querySelectorAll(annotSel).forEach(el => el.remove());

  ideo.startHideAnnotTooltipTimeout();

  // Refine style
  document.querySelectorAll('.chromosome').forEach(chromosome => {
    chromosome.style.cursor = '';
  });

  adjustPlaceAndVisibility(ideo);

  ideo.relatedAnnots = [];

  // Fetch positon of searched gene
  const annot = await processSearchedGene(geneSymbol, ideo);

  if (typeof annot === 'undefined') {
    // E.g. when searched gene is "Foo"
    const organism = ideo.organismScientificName;
    throw Error(`"${geneSymbol}" is not a known gene in ${organism}`);
  }

  ideo.config.legend = relatedLegend;
  writeLegend(ideo);
  moveLegend();

  await Promise.all([
    processInteractions(annot, ideo),
    processParalogs(annot, ideo)
  ]);

  ideo.time.rg.total = timeDiff(ideo.time.rg.t0);

  analyzeRelatedGenes(ideo);

  if (ideo.onPlotRelatedGenesCallback) ideo.onPlotRelatedGenesCallback();

}

function getAnnotByName(annotName, ideo) {
  var annotByName;
  ideo.annots.forEach(annotsByChr => {
    annotsByChr.annots.forEach(annot => {
      if (annotName === annot.name) {
        annotByName = annot;
      }
    });
  });
  return annotByName;
}

/**
 * Handles click within annotation tooltip
 *
 * Makes clicking link in tooltip behave same as clicking annotation
 */
function handleTooltipClick(ideo) {
  const tooltip = document.querySelector('._ideogramTooltip');
  if (!ideo.addedTooltipClickHandler) {
    tooltip.addEventListener('click', () => {
      const geneDom = document.querySelector('#ideo-related-gene');
      const annotName = geneDom.textContent;
      const annot = getAnnotByName(annotName, ideo);
      ideo.onClickAnnot(annot);
    });

    // Ensures handler isn't added redundantly.  This is used because
    // addEventListener options like {once: true} don't suffice
    ideo.addedTooltipClickHandler = true;
  }
}

/**
 * Enhance tooltip shown on hovering over gene annotation
 */
function decorateRelatedGene(annot) {
  const ideo = this;
  const descObj = ideo.annotDescriptions.annots[annot.name];
  const description =
    descObj.description.length > 0 ? `<br/>${descObj.description}` : '';
  const fullName = descObj.name;
  const style = 'style="color: #0366d6; cursor: pointer;"';

  annot.displayName =
    `<span id="ideo-related-gene" ${style}>${annot.name}</span><br/>` +
    `${fullName}<br/>` +
    `${description}` +
    `<br/>`;

  handleTooltipClick(ideo);

  return annot;
}

const shape = 'triangle';

const legendHeaderStyle =
  `font-size: 14px; font-weight: bold; font-color: #333;`;
const relatedLegend = [{
  name: `
    <div style="position: relative; left: -15px; padding-bottom: 10px;">
      <div style="${legendHeaderStyle}">Related genes</div>
      <i>Click gene to search</i>
    </div>
  `,
  nameHeight: 30,
  rows: [
    {name: 'Interacting gene', color: 'purple', shape: shape},
    {name: 'Paralogous gene', color: 'pink', shape: shape},
    {name: 'Searched gene', color: 'red', shape: shape}
  ]
}];

const citedLegend = [{
  name: `
    <div style="position: relative; left: -15px; padding-bottom: 10px;">
      <div style="${legendHeaderStyle}">Highly cited genes</div>
      <i>Click gene to search</i>
    </div>
  `,
  nameHeight: 30,
  rows: []
}];

/** Sets legendPad for related genes view */
function setRelatedDecorPad(kitConfig) {
  if (kitConfig.showAnnotLabels) {
    kitConfig.legendPad = 70;
  } else {
    kitConfig.legendPad = 30;
  }
  return kitConfig;
}

/**
 * Wrapper for Ideogram constructor, with generic "Related genes" options
 *
 * This function is made available as a static method on Ideogram.
 *
 * @param {Object} config Ideogram configuration object
 */
function _initRelatedGenes(config, annotsInList) {

  if (annotsInList !== 'all') {
    annotsInList = annotsInList.map(name => name.toLowerCase());
  }

  const kitDefaults = {
    showFullyBanded: false,
    rotatable: false,
    legend: relatedLegend,
    chrBorderColor: '#333',
    chrLabelColor: '#333',
    onWillShowAnnotTooltip: decorateRelatedGene,
    annotsInList: annotsInList,
    showTools: true,
    showAnnotLabels: true
  };

  if ('onWillShowAnnotTooltip' in config) {
    const key = 'onWillShowAnnotTooltip';
    const clientFn = config[key];
    const defaultFunction = kitDefaults[key];
    const newFunction = function(annot) {
      annot = defaultFunction.bind(this)(annot);
      annot = clientFn.bind(this)(annot);
      return annot;
    };
    kitDefaults[key] = newFunction;
    delete config[key];
  }

  // Override kit defaults if client specifies otherwise
  let kitConfig = Object.assign(kitDefaults, config);

  kitConfig = setRelatedDecorPad(kitConfig);

  const ideogram = new Ideogram(kitConfig);

  // Called upon completing last plot, including all related genes
  if (config.onPlotRelatedGenes) {
    ideogram.onPlotRelatedGenesCallback = config.onPlotRelatedGenes;
  }

  // Called upon 1) finding paralogs, and 2) finding interacting genes
  if (config.onFindRelatedGenes) {
    ideogram.onFindRelatedGenesCallback = config.onFindRelatedGenes;
  }

  ideogram.getTooltipAnalytics = getRelatedGenesTooltipAnalytics;

  ideogram.annotSortFunction = sortAnnotsByRelatedStatus;

  initAnalyzeRelatedGenes(ideogram);

  return ideogram;
}

function plotGeneHints() {
  const ideo = this;

  if (!ideo || 'annotDescriptions' in ideo) return;

  ideo.annotDescriptions = {annots: {}};

  ideo.flattenAnnots().map((annot) => {
    let description = [];
    if ('significance' in annot && annot.significance !== 'n/a') {
      description.push(annot.significance);
    }
    if ('citations' in annot && annot.citations !== undefined) {
      description.push(annot.citations);
    }
    description = description.join('<br/><br/>');
    ideo.annotDescriptions.annots[annot.name] = {
      description,
      name: annot.fullName
    };
  });

  adjustPlaceAndVisibility(ideo);
  moveLegend();
  ideo.fillAnnotLabels();
  const container = ideo.config.container;
  document.querySelector(container).style.visibility = '';
}

/**
 * Wrapper for Ideogram constructor, with generic "Related genes" options
 *
 * This function is made available as a static method on Ideogram.
 *
 * @param {Object} config Ideogram configuration object
 */
function _initGeneHints(config, annotsInList) {

  delete config.onPlotRelatedGenes;

  if (annotsInList !== 'all') {
    annotsInList = annotsInList.map(name => name.toLowerCase());
  }

  const annotsPath =
    getDir('annotations/gene-cache/homo-sapiens-top-genes.tsv');

  const kitDefaults = {
    showFullyBanded: false,
    rotatable: false,
    legend: citedLegend,
    chrMargin: -4,
    chrBorderColor: '#333',
    chrLabelColor: '#333',
    onWillShowAnnotTooltip: decorateRelatedGene,
    annotsInList: annotsInList,
    showTools: true,
    showAnnotLabels: true,
    onDrawAnnots: plotGeneHints,
    annotationsPath: annotsPath
  };

  if ('onWillShowAnnotTooltip' in config) {
    const key = 'onWillShowAnnotTooltip';
    const clientFn = config[key];
    const defaultFunction = kitDefaults[key];
    const newFunction = function(annot) {
      annot = defaultFunction.bind(this)(annot);
      annot = clientFn.bind(this)(annot);
      return annot;
    };
    kitDefaults[key] = newFunction;
    delete config[key];
  }

  if ('onDrawAnnots' in config) {
    const key = 'onDrawAnnots';
    const clientFn = config[key];
    const defaultFunction = kitDefaults[key];
    const newFunction = function() {
      defaultFunction.bind(this)();
      clientFn.bind(this)();
    };
    kitDefaults[key] = newFunction;
    delete config[key];
  }

  // Override kit defaults if client specifies otherwise
  const kitConfig = Object.assign(kitDefaults, config);

  if (kitConfig.showAnnotLabels) {
    kitConfig.legendPad = 80;
  } else {
    kitConfig.legendPad = 30;
  }

  const ideogram = new Ideogram(kitConfig);

  // Called upon completing last plot, including all related genes
  if (config.onPlotRelatedGenes) {
    ideogram.onPlotRelatedGenesCallback = config.onPlotRelatedGenes;
  }

  // Called upon 1) finding paralogs, and 2) finding interacting genes
  if (config.onFindRelatedGenes) {
    ideogram.onFindRelatedGenesCallback = config.onFindRelatedGenes;
  }

  ideogram.getTooltipAnalytics = getRelatedGenesTooltipAnalytics;

  ideogram.annotSortFunction = sortAnnotsByRelatedStatus;

  initAnalyzeRelatedGenes(ideogram);

  return ideogram;
}

export {
  _initGeneHints, _initRelatedGenes, plotRelatedGenes, getRelatedGenesByType
};
