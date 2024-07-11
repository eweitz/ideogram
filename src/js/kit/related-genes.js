/**
 * @fileoverview Kit used in "Related genes" example
 *
 * This file simplifies client code for reusing a "related genes" ideogram --
 * which finds and displays related genes for a searched gene.
 *
 * Related genes here are either "interacting genes" or "paralogs".
 * Interacting genes are genes immediately upstream or downstream of the
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

import {decompressSync, strFromU8} from 'fflate';
import tippy, {hideAll} from 'tippy.js';
import {tippyCss, tippyLightCss} from './tippy-styles';
import {Pvjs} from 'eweitz-pvjs';
import { createRoot } from 'react-dom/client';

import {
  initAnalyzeRelatedGenes, analyzePlotTimes, analyzeRelatedGenes, timeDiff,
  getRelatedGenesByType, getRelatedGenesTooltipAnalytics
} from './analyze-related-genes';
import {
  getGeneStructureHtml, addGeneStructureListeners
} from './gene-structure';

import {
  sortAnnotsByRank, applyRankCutoff, setAnnotRanks
} from '../annotations/annotations';
import {writeLegend} from '../annotations/legend';
import {getAnnotDomId} from '../annotations/process';
import {
  getDir, pluralize, getTextSize, getTippyConfig
} from '../lib';
import {
  fetchGpmls, summarizeInteractions, fetchPathwayInteractions
} from './wikipathways';
import {getTissueHtml, addTissueListeners} from './tissue';
// import {drawAnnotsByLayoutType} from '../annotations/draw';
// import {organismMetadata} from '../init/organism-metadata';


/** Sets DOM IDs for ideo.relatedAnnots; needed to associate labels */
function setRelatedAnnotDomIds(ideo) {
  const updated = [];

  const sortedChrNames = ideo.chromosomesArray.map((chr) => {
    return chr.name;
  });

  if ('relatedAnnots' in ideo) {
    ideo.relatedAnnots = applyAnnotsIncludeList(ideo.relatedAnnots, ideo);

    // Count two related annots for same gene as one.
    // E.g. gene Foo can both interact with and be paralog of gene Bar
    // Instead of count Foo interacting annot and Foo paralog annot as two,
    // only count it as one as they are merged in downstream UI.
    //
    // Searching STAT3 without this block shows the problem this fixes.
    const seenNames = {};
    ideo.relatedAnnots = ideo.relatedAnnots.filter(annot => {
      if (annot.name in seenNames) {
        return false;
      }
      seenNames[annot.name] = 1;
      return true;
    });
  }

  // Arrange related annots by chromosome
  const annotsByChr = {};
  ideo.annots.forEach((annot) => {
    const relevanceSortedAnnots = annot.annots.sort((a, b) => {
      return -ideo.annotSortFunction(a, b);
    });
    annotsByChr[annot.chr] = relevanceSortedAnnots;
    // }
  });


  // // Sort related annots by relevance within each chromosome
  // const relevanceSortedAnnotsNamesByChr = {};
  // Object.entries(annotsByChr).map(([chr, annots]) => {

  //   if ('annots' in annots) annots = annots.annots;
  //   annots = setAnnotRanks(annots, ideo);

  //   // Sort so first annots are drawn last, and thus at top layer
  //   annots = annots.sort((a, b) => ideo.annotSortFunction(a, b));

  //   const annotNames = annots.map((annot) => annot.name);
  //   relevanceSortedAnnotsNamesByChr[chr] = annotNames;
  // });

  // annotsByChr.annots.sort((a, b) => {
  //   // Reverse-sort, so first annots are drawn last, and thus at top layer
  //   return -ideo.annotSortFunction(a, b);
  // });

  const updatedAnnots = {};
  Object.entries(annotsByChr).forEach(([chr, annots]) => {
    updatedAnnots[chr] = {chr, annots: []};
    annots.forEach((annot, annotIndex) => {

      // Annots have DOM IDs keyed by chromosome index and annotation index.
      // We reconstruct those here using structures built in two blocks above.
      const chrIndex = sortedChrNames.indexOf(chr);
      // const annotIndex =
      //   relevanceSortedAnnotsNamesByChr[chr].indexOf(annot.name);

      annot.domId = getAnnotDomId(chrIndex, annotIndex);
      updatedAnnots[chr].annots.push(annot);
    });
    updated.push(updatedAnnots[chr]);
  });

  ideo.annots = updated;
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

/** Reports if interaction node is a gene and not previously seen */
function isInteractionRelevant(rawIxn, gene, nameId, seenNameIds, ideo) {
  let isGeneSymbol;
  if ('geneCache' in ideo && gene.name) {
    isGeneSymbol = rawIxn.toLowerCase() in ideo.geneCache.nameCaseMap;
  } else {
    isGeneSymbol = maybeGeneSymbol(rawIxn, gene);
  }

  return isGeneSymbol && !(nameId in seenNameIds);
}

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
  const upperGene = gene.name.toUpperCase();

  let data = {result: []};

  if (ideo.interactionCache) {
    if (upperGene in ideo.interactionCache) {
      data = ideo.interactionCache[upperGene];
    }
  } else {

    // const queryString = `?query=${gene.name}&format=json`;
    // const url =
    //   `https://webservice.wikipathways.org/findInteractions${queryString}`;
    // const url = `http://localhost:8080/dist/data/cache/${gene.name}.json.gz`;
    const url = `https://cdn.jsdelivr.net/npm/ixn2/${upperGene}.json.gz`;

    // await sleep(3000);

    const response = await fetch(url);
    // const data = await response.json();

    if (response.ok) {
      const blob = await response.blob();
      const uint8Array = new Uint8Array(await blob.arrayBuffer());
      data = JSON.parse(strFromU8(decompressSync(uint8Array)));
    }
  }

  // For each interaction, get nodes immediately upstream and downstream.
  // Filter out pathway nodes that are definitely not gene symbols, then
  // group pathways by gene symbol. Each interacting gene can have
  // multiple pathways.
  data.result.forEach(interaction => {
    if (interaction.species.toLowerCase() === orgNameSimple) {
      const right = interaction.fields.right.values;
      const left = interaction.fields.left.values;
      // let mediator = [];
      // if ('mediator' in interaction.fields) {
      //   mediator = interaction.fields.mediator.values;
      //   console.log('mediator', mediator)
      // }
      // const rawIxns = right.concat(left, mediator);
      const rawIxns = right.concat(left);
      const name = interaction.name;
      const id = interaction.id;

      // rawIxns can contain multiple genes, e.g. when
      // a group (i.e. a complex or a set of paralogs)
      // interacts with the searched gene
      const wrappedRawIxns = rawIxns.map(rawIxn => {
        return {name: rawIxn, color: ''};
      });
      const sortedRawIxns =
        sortAnnotsByRank(wrappedRawIxns, ideo).map(i => i.name);

      sortedRawIxns.forEach(rawIxn => {

        const normRawIxn = rawIxn.toLowerCase();

        // Prevent overwriting searched gene.  Occurs with e.g. human CD4
        if (normRawIxn.includes(gene.name.toLowerCase())) return;

        // if (rawIxn === '') return; // Avoid oddly blank placeholders

        const nameId = name + id;

        const isRelevant =
          isInteractionRelevant(normRawIxn, gene, nameId, seenNameIds, ideo);

        if (isRelevant) {
          seenNameIds[nameId] = 1;
          const ixn = {name, pathwayId: id};
          if (normRawIxn in ixns) {
            ixns[normRawIxn].push(ixn);
          } else {
            ixns[normRawIxn] = [ixn];
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
  const response = await fetch(myGeneBase + queryString + '&size=400');
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

// /**
//  * Summarizes genes in a pathway
//  *
//  * This comprises most of the content for tooltips for pathway genes.
//  */
//  function describePathwayGene(pathwayGene, searchedGene, pathway, summary) {
//   let ixnsDescription = '';

//   const pathwaysBase = 'https://www.wikipathways.org/index.php/Pathway:';
//   const url = `${pathwaysBase}${pathway.id}`;
//   const attrs =
//     `href="${url}" ` +
//     `target="_blank" ` +
//     `title="See pathway diagram in WikiPathways"`;
//   ixnsDescription =
//     `${summary} ${searchedGene.name} in:</br/>` +
//     `<a ${attrs}>${pathway.name}</a>`;

//   const {name, ensemblId} = parseNameAndEnsemblIdFromMgiGene(pathwayGene);
//   const type = 'pathway gene';
//   const descriptionObj = {
//     description: ixnsDescription,
//     ixnsDescription, ensemblId, name, type
//   };
//   return descriptionObj;
// }

// /** Limit number of shown interaction links, and enable toggling full list */
// function limitInteractionLinks(links) {
//   if (links.length > 5) {
//     // Seen in e.g. interacting gene AKT1 for MTOR searched gene
//     const numMore = links.length - 5;
//     links = links.slice(0, 5);
//     const moreText = `${numMore} more ${pluralize('pathway', numMore)}`;
//     const attrs = 'id="_ideoIxnLinkToggler" style="font-style: italic"';
//     const toggler = `<span ${attrs}>${moreText}</span>`;
//     links.push(`<span ${attrs}>${moreText}</span>`);
//   }
//   return links;
// }

// function toggleInteractionLinks() {
//   const ixnLinkToggler = document.querySelector('._ideoIxnLinkToggler');
// }

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
    let links = ixns.map(ixn => {
      // pathwayIds.push(ixn.pathwayId);
      // pathwayNames.push(ixn.name);
      // const attrs =
      //   `class="ideo-pathway-link" ` +
      //   `title="Click to search for other genes in this pathway" ` +
      //   `style="cursor: pointer" ` +
      //   `data-pathway-id="${ixn.pathwayId}" ` +
      //   `data-pathway-name="${ixn.name}"`;
      // return `<a ${attrs}>${ixn.name}</a>`;

      const pathwaysBase = 'https://classic.wikipathways.org/index.php/Pathway:';
      const url = `${pathwaysBase}${ixn.pathwayId}`;
      pathwayIds.push(ixn.pathwayId);
      pathwayNames.push(ixn.name);
      const attrs =
        `class="ideo-pathway-link" ` +
        `title="View in WikiPathways" ` +
        `data-pathway-id="${ixn.pathwayId}" ` +
        `target="_blank" ` +
        `href="${url}"`;
      return `<a ${attrs}>${ixn.name}</a>`;
    });

    // links = limitInteractionLinks(links);

    links = links.join('<br/>');

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

/** Throw error when searched gene (e.g. "Foo") isn't found */
function throwGeneNotFound(geneSymbol, ideo) {
  const organism = ideo.organismScientificName;
  throw Error(`"${geneSymbol}" is not a known gene in ${organism}`);
}

/**
 * Lookup genes by synonym, a.k.a. alias
 *
 * E.g. getGeneBySynonym("p53", ideo) returns "TP53"
 */
function getGeneBySynonym(name, ideo) {
  if (!ideo.synonymCache) return null;

  const nameLc = name.toLowerCase();

  if (!ideo.synonymCache?.nameCaseMap) {
    // JIT initialization of canonicalized synonym lookup data.
    // Done only once.
    const nameCaseMap = {};
    for (const gene in ideo.synonymCache.byGene) {
      const synonyms = ideo.synonymCache.byGene[gene];
      nameCaseMap[gene.toLowerCase()] = synonyms.map(s => s.toLowerCase());
    }
    ideo.synonymCache.nameCaseMap = nameCaseMap;
  }

  const nameCaseMap = ideo.synonymCache.nameCaseMap;
  for (const geneLc in nameCaseMap) {
    const synonymsLc = nameCaseMap[geneLc];
    if (synonymsLc.includes(nameLc)) {
      // Got a hit!  Return standard gene symbol, e.g. "tp53" -> "TP53".
      return ideo.geneCache.nameCaseMap[geneLc];
    }
  }

  return null;
}

/**
 * Fetch genes from cache
 * Construct objects that match format of MyGene.info API response
 */
function fetchGenesFromCache(names, type, ideo) {
  const cache = ideo.geneCache;
  const isSymbol = (type === 'symbol');
  const locusMap = isSymbol ? cache.lociByName : cache.lociById;
  const nameMap = isSymbol ? cache.idsByName : cache.namesById;

  const hits = names.map(name => {

    const nameLc = name.toLowerCase();

    if (
      !locusMap[name] &&
      !cache.nameCaseMap[nameLc] &&
      !getGeneBySynonym(name, ideo)
    ) {
      if (isSymbol) {
        throwGeneNotFound(name, ideo);
      } else {
        return;
      }
    }

    let isSynonym = false;
    let synonym = null;

    // Canonicalize name if it is mistaken in upstream data source.
    // This can sometimes happen in WikiPathways, e.g. when searching
    // interactions for rat Pten, it includes a result for "PIK3CA".
    // In that case, this would correct PIK3CA to be Pik3ca.
    if (isSymbol && !locusMap[name]) {
      if (cache.nameCaseMap[nameLc]) {
        name = cache.nameCaseMap[nameLc];
      } else {
        synonym = name;
        name = getGeneBySynonym(synonym, ideo);
        isSynonym = true;
      }
    }

    const locus = locusMap[name];
    const symbol = isSymbol ? name : nameMap[name];
    const ensemblId = isSymbol ? nameMap[name] : name;
    const fullName = cache.fullNamesById[ensemblId];

    const hit = {
      symbol,
      name: fullName,
      source: 'cache',
      genomic_pos: {
        chr: locus[0],
        start: locus[1],
        end: locus[2],
        ensemblgene: ensemblId
      },
      isSynonym,
      synonym
    };

    return hit;
  });

  const hitsWithGenomicPos = hits.filter(hit => hit !== undefined);

  return hitsWithGenomicPos;
}

/** Wait for a certain time (delay) in milliseconds */
function wait(delay) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Get time to wait before retrying a fail service, gracefully
 *
 * The returned wait time helps avoid flooding the server
 */
function exponentialBackoffWithJitter(numFailures, baseWaitMs) {
  const jitter = 10 * Math.random();
  return Math.round(baseWaitMs + jitter) * (numFailures ** 2);
}

async function retryFetch(requestedThing, numLimit, fn, args) {

  const numFailed = numFailedFetches[requestedThing];
  if (numFailed > numLimit) {
    const preamble = 'Failed to fetch from Ideogram third-party service for: ';
    throw new TypeError(preamble + requestedThing);
  }

  numFailedFetches[requestedThing] += 1;

  // Exponential backoff
  const baseWaitMs = 500;
  const waitMilliseconds = exponentialBackoffWithJitter(numFailed, baseWaitMs);

  console.log(
    `Failed fetch for ${requestedThing} ${numFailed} times, ` +
    `retrying in ${waitMilliseconds} ms`
  );

  await wait(waitMilliseconds);
  return await fn(...args);
}

/** Number of times fetches for various things have consecutively failed */
const numFailedFetches = {
  genes: 0
};

/** Fetch genes from cache, or, if needed, from MyGene.info API */
async function fetchGenes(names, type, ideo) {

  let data;

  // Account for single-gene fetch
  if (typeof names === 'string') names = [names];

  // Query parameter for MyGene.info API
  const qParam = names.map(name => `${type}:${name.trim()}`).join(' OR ');
  const taxid = ideo.config.taxid;

  const queryStringBase = `?q=${qParam}&species=${taxid}&fields=`;

  if (ideo.geneCache) {
    const hits = fetchGenesFromCache(names, type, ideo);

    // Asynchronously fetch full name, but don't await the response, because
    // full names are only shown upon hovering over an annotation.
    hits.forEach((hit) => {
      const symbol = hit.symbol;
      const fullName = hit.name;
      const isSynonym = hit.isSynonym;
      const synonym = hit.synonym;
      if (symbol in ideo.annotDescriptions.annots) {
        ideo.annotDescriptions.annots[symbol].name = fullName;
        ideo.annotDescriptions.annots[symbol].isSynonym = hit.isSynonym;
        ideo.annotDescriptions.annots[symbol].synonym = hit.synonym;
      } else {
        ideo.annotDescriptions.annots[symbol] = {
          name: fullName,
          isSynonym,
          synonym
        };
      }
    });

    data = {hits, fromGeneCache: true};
  } else {
    // Fetch gene data from MyGene.info
    const queryString = `${queryStringBase}symbol,genomic_pos,name`;
    try {
      data = await fetchMyGeneInfo(queryString);
    } catch (error) {
      const isFailedFetch = (error.message === 'Failed to fetch');
      if (isFailedFetch && navigator.onLine) {
        // Retry fetching 3 times, waiting longer each time
        data = await retryFetch('genes', 3, fetchGenes, [names, type, ideo]);
      }
    }
  }

  return data;
}

/**
 * Retrieves position and other data on interacting genes from MyGene.info
 */
async function fetchInteractionAnnots(interactions, searchedGene, ideo) {

  const annots = [];
  const symbols = Object.keys(interactions);

  if (symbols.length === 0) return annots;

  const data = await fetchGenes(symbols, 'symbol', ideo);

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

    const ixns = interactions[gene.symbol.toLowerCase()];

    const descriptionObj = describeInteractions(gene, ixns, searchedGene);

    mergeDescriptions(annot, descriptionObj, ideo);
  });

  // Fetch GPML files to use when updating interaction descriptions with
  // refined direction.
  fetchGpmls(ideo);

  return annots;
}

/** Fetch paralog positions from MyGeneInfo */
async function fetchParalogPositionsFromMyGeneInfo(
  homologs, searchedGene, ideo
) {
  const annots = [];

  const cached = homologs.length && typeof homologs[0] === 'string';
  const ensemblIds = cached ? homologs : homologs.map(homolog => homolog.id);
  const data = await fetchGenes(ensemblIds, 'ensemblgene', ideo);

  data.hits.forEach(gene => {

    // If hit lacks position, skip processing
    if ('genomic_pos' in gene === false) return;
    if ('name' in gene === false) return;

    const annot = parseAnnotFromMgiGene(gene, ideo, 'pink');
    annots.push(annot);

    const description =
      ideo.tissueCache ? '' : `Paralog of ${searchedGene.name}`;

    const {name, ensemblId} = parseNameAndEnsemblIdFromMgiGene(gene);
    const type = 'paralogous gene';
    const descriptionObj = {description, ensemblId, name, type};
    mergeDescriptions(annot, descriptionObj, ideo);
  });

  return annots;
}

function drawNeighborhoods(neighborhoodAnnots, ideo) {
  neighborhoodAnnots = applyAnnotsIncludeList(neighborhoodAnnots, ideo);
  ideo.drawAnnots(neighborhoodAnnots, 'overlay', true, true);
  moveLegend(ideo);
}

/** Plot paralog neighborhoods */
function plotParalogNeighborhoods(annots, ideo) {
  if (!ideo.config.showParalogNeighborhoods) return;

  if (ideo.neighborhoodAnnots?.length > 0) {
    ideo.neighborhoodAnnots.forEach(annot => {
      ideo.annotDescriptions.annots[annot.name] = annot;
    });

    drawNeighborhoods(ideo.neighborhoodAnnots, ideo);
    return;
  }

  const searchedAnnot = ideo.relatedAnnots[0];
  annots = applyAnnotsIncludeList(annots, ideo);

  annots.unshift(searchedAnnot);

  if (annots.length < 2) return;

  // Arrays of paralogs within 10 Mbp of each other
  const neighborhoods = {};

  neighborhoods[annots[0].chr] = {};
  neighborhoods[annots[0].chr][annots[0].start] = [annots[0]];

  const windowInt = 2_000_000;
  const windowProse = '2 Mbp';

  for (let i = 1; i < annots.length; i++) {
    const annot = annots[i];
    const chr = annot.chr;
    const start = annot.start;
    if (chr in neighborhoods) {
      const starts = Object.keys(neighborhoods[chr]);
      for (let j = 0; j < starts.length; j++) {
        const startJInt = parseInt(starts[j]);
        if (Math.abs(start - startJInt) < windowInt) {
          neighborhoods[chr][startJInt].push(annot);
        } else {
          neighborhoods[chr][start] = [annot];
        }
      }
    } else {
      neighborhoods[chr] = {};
      neighborhoods[chr][start] = [annot];
    }
  }

  // Big enough to see and hover
  const overlayAnnotLength = 15_000_000;

  const searchedGene = searchedAnnot.name;

  const neighborhoodAnnots =
    Object.entries(neighborhoods).map(([chr, neighborhood], index) => {
      const start = parseInt(Object.keys(neighborhood)[0]);
      let paralogs = Object.values(neighborhood)[0];

      if (paralogs.length < 2) {
        return {paralogs};
      }

      let includesSearched = false;
      if (paralogs[0].name === searchedAnnot.name) {
        paralogs = paralogs.slice(1);
        includesSearched = true;
      }

      // paralogs.map(paralog => {
      //   console.log(paralog);
      // })

      const paralogsText = pluralize('paralog', paralogs.length)
      const description =
        `${paralogs.length} nearby ${paralogsText} of ${searchedGene}`;

      const chrLength = ideo.chromosomes[ideo.config.taxid][chr].bpLength;
      let annotStart = start - overlayAnnotLength/2;
      let annotStop = start + overlayAnnotLength/2;
      if (annotStop > chrLength) {
        annotStart = start - overlayAnnotLength;
        annotStop = chrLength;
      } else if (annotStart < 1) {
        annotStart = 1;
        annotStop = overlayAnnotLength;
      };

      if ('geneCache' in ideo) {
        paralogs = paralogs.map(paralog => {
          paralog.fullName = ideo.geneCache.fullNamesById[paralog.id];

          const ranks = ideo.geneCache.interestingNames;
          if (ranks.includes(paralog.name)) {
            paralog.rank = ranks.indexOf(paralog.name) + 1;
          } else {
            paralog.rank = 1E10;
          }

          return paralog;
        });
      }

      const key = 'paralogNeighborhood-' + index;
      const fStart = start.toLocaleString(); // Format for readability
      const displayCoordinates = `chr${chr}:${fStart} ± ${windowProse}`;

      const annot = {
        name: key,
        chr,
        start: annotStart,
        stop: annotStop,
        color: 'pink',
        description,
        paralogs,
        type: 'paralog neighborhood',
        displayCoordinates,
        includesSearched
      };

      ideo.annotDescriptions.annots[annot.name] = annot;
      return annot;
    }).filter(n => n.paralogs.length > 1 || n.includesSearched);

  ideo.neighborhoodAnnots = neighborhoodAnnots;

  if (neighborhoodAnnots.length > 0) {
    drawNeighborhoods(neighborhoodAnnots, ideo);
  }
}

/**
 * Fetch paralogs of searched gene
 */
async function fetchParalogs(annot, ideo) {
  const taxid = ideo.config.taxid;

  let homologs;
  // Fetch paralogs
  if (ideo.paralogCache) {
    // const baseUrl = 'http://localhost:8080/dist/data/cache/paralogs/';
    // const url = `${baseUrl}homo-sapiens/${annot.name}.tsv`;
    // const response = await fetch(url);
    // const oneRowTsv = await response.text();
    // const rawHomologEnsemblIds = oneRowTsv.split('\t');
    // homologs = rawHomologEnsemblIds.map(r => getEnsemblId('ENSG', r));
    const paralogsByName = ideo.paralogCache.paralogsByName;
    const nameUc = annot.name.toUpperCase();
    const hasParalogs = nameUc in paralogsByName;
    homologs = hasParalogs ? paralogsByName[nameUc] : [];
  } else {
    const params = `&format=condensed&type=paralogues&target_taxon=${taxid}`;
    const path = `/homology/id/${annot.id}?${params}`;
    const ensemblHomologs = await Ideogram.fetchEnsembl(path);
    homologs = ensemblHomologs.data[0].homologies;
  }

  // Fetch positions of paralogs
  let annots =
    await fetchParalogPositionsFromMyGeneInfo(homologs, annot, ideo);

  // Omit genes named like "AC113554.1", which is an "accession.version".
  // Such accVers are raw and poorly suited here.
  annots = annots.filter(annot => {
    const isAccVer = annot.name.match(/^AC[0-9.]+$/);
    return !isAccVer;
  });

  return annots;
}

/**
 * Filters out placements on alternative loci scaffolds, an advanced
 * genome assembly feature we are not concerned with in ideograms.
 *
 * Example:
 * https://mygene.info/v3/query?q=symbol:PTPRC&species=9606&fields=symbol,genomic_pos,name
 */
function getGenomicPos(gene, ideo) {
  let genomicPos = null;
  if (Array.isArray(gene.genomic_pos)) {
    genomicPos = gene.genomic_pos.filter(pos => {
      return pos.chr in ideo.chromosomes[ideo.config.taxid];
    })[0];
  } else {
    genomicPos = gene.genomic_pos;
  }
  return genomicPos;
}

/**
 * Transforms MyGene.info (MGI) gene into Ideogram annotation
 */
function parseAnnotFromMgiGene(gene, ideo, color='red') {
  const genomicPos = getGenomicPos(gene, ideo);

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

/** Return type (interacting, paralogous, or searched) of legend entry */
function getLegendType(li) {
  const lcText = li.innerText.toLowerCase();

  let type;
  if (lcText.includes('interacting')) type = 'interacting';
  if (lcText.includes('paralogous')) type = 'paralogous';
  if (lcText.includes('searched')) type = 'searched';

  return type;
}

/** Return color (purple, pink, or red) of legend entry */
function getLegendEntryColor(li) {
  const type = getLegendType(li);

  const colorMap = {
    'interacting': 'purple',
    'paralogous': 'pink',
    'searched': 'red'
  };
  const color = colorMap[type];

  return color;
}

/** Highlight / filter upon hovering over legend entry */
function highlightByType(li, ideo) {
  li.classList += ' active';

  const selectedColor = getLegendEntryColor(li);

  if (ideo.config.showAnnotLabels) {
    ideo.clearAnnotLabels();

    ideo.flattenAnnots().forEach(annot => {
      if (annot.color !== selectedColor) {
        document.getElementById(annot.domId).style.display = 'none';
      }
    });

    const sortedAnnots = ideo.flattenAnnots().sort((a, b) => {
      return ideo.annotSortFunction(a, b);
    }).filter(annot => annot.color === selectedColor);

    const numLabels = Math.min(sortedAnnots.length, 20);
    ideo.fillAnnotLabels(sortedAnnots, numLabels);
  }
}

/** Remove highlight / filter upon hovering out of legend entry */
function dehighlightAll(ideo) {
  document.querySelectorAll('#_ideogramLegend li').forEach(li => {
    li.classList.remove('active');
  });

  ideo.flattenAnnots().forEach(annot => {
    document.getElementById(annot.domId).style.display = null;
  });

  if (ideo.config.showAnnotLabels) {
    const sortedAnnots = ideo.flattenAnnots().sort((a, b) => {
      return ideo.annotSortFunction(a, b);
    });

    ideo.fillAnnotLabels(sortedAnnots);
  }
}

function initInteractiveLegend(ideo) {
  // Highlight and filter annotations by type on hovering over legend entries
  function highlight(event) {
    const li = event.target;
    highlightByType(li, ideo);
    if (ideo.onHoverLegendCallback) {
      ideo.onHoverLegendCallback();
    }
  }
  // // Highlight and filter annotations by type on hovering over legend entries
  // WIP: 14373b18319e99febd91816fbc0c1b2e0f20f277
  // function toggleHighlight(event) {
  //   const li = event.target;
  //   return toggleHighlightByType(li, ideo);
  // }
  function dehighlight() {
    dehighlightAll(ideo);
  }
  const entrySelector = '#_ideogramLegend li._ideoLegendEntry';
  document.querySelectorAll(entrySelector).forEach(li => {
    // li.addEventListener('click', toggleHighlight);
    // WIP: 14373b18319e99febd91816fbc0c1b2e0f20f277
    li.addEventListener('mouseenter', highlight);
    li.addEventListener('mouseleave', dehighlight);

    const legendType = getLegendType(li);
    const tippyContentMap = {
      'interacting':
        'Adjacent to searched gene in a biochemical pathway, ' +
        'per WikiPathways',
      'paralogous':
        'Evolutionarily related to searched gene ' +
        'by a duplication event, per Ensembl'
    };
    // const placement = 'data-tippy-placement="top-end"';
    const placement = '';
    const tippy =
      `data-tippy-content="${tippyContentMap[legendType]}" ${placement}`;
    const reset = 'position: inherit; left: inherit';
    // const glossary = 'text-decoration: underline dashed;';
    // const style = `style="${glossary} ${reset}`;
    const style = `style="${reset}"`;
    const attrs = `class="_ideoLegendEntry" ${style} ${tippy}`;
    if (legendType === 'paralogous') {
      li.innerHTML = `<span ${attrs}>Paralogous genes</span>`;
    } else if (legendType === 'interacting') {
      li.innerHTML = `<span ${attrs}>Interacting genes</span>`;
    }
  });

  const css =
    `<style>
    ${tippyCss}

    .tippy-box {
      font-size: 12px;
    }

    .tippy-content {
      padding: 3px 7px;
    }

    #_ideogramLegend li {
      padding-left: 5px;
      border-radius: 2px;
    }

    #_ideogramLegend li.active {
      color: #00C;
      background-color: #EEF;
    }
    </style>`;
  const legendDom = document.querySelector('#_ideogramLegend');
  legendDom.insertAdjacentHTML('afterBegin', css);
  const tippyConfig = getTippyConfig();
  tippyConfig.maxWidth = 180;
  tippyConfig.offset = [-30, 10];
  ideo.legendTippy =
    tippy('._ideoLegendEntry[data-tippy-content]', tippyConfig);
}

function moveLegend(ideo, extraPad=0) {
  const ideoInnerDom = document.querySelector('#_ideogramInnerWrap');
  const decorPad = setRelatedDecorPad({}).legendPad;
  const left = decorPad + 20 + extraPad;
  const legendStyle = `position: absolute; top: 15px; left: ${left}px`;

  const legend = document.querySelector('#_ideogramLegend');
  ideoInnerDom.prepend(legend);
  legend.style = legendStyle;

  initInteractiveLegend(ideo);
}

/**
 * Filter annotations to only include those in configured list
 *
 * @return {List<Object>} includedAnnots List of filtered annots objects
 */
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

function filterByAnnotsIncludeList(annots, ideo) {
  if (ideo.config.annotsInList === 'all') return annots;

  const annotsInList = ideo.config.annotsInList;

  const updated = [];
  const updatedAnnots = {};
  ideo.annots.forEach(chrAnnots => {
    const {chr, annots} = chrAnnots;
    updatedAnnots[chr] = {chr, annots: []};
    annots.forEach((annot) => {

      const lcAnnotName = annot.name.toLowerCase();
      if (
        'relatedAnnots' in ideo &&
        !annotsInList.includes(lcAnnotName)
      ) {
        return;
      }

      updatedAnnots[chr].annots.push(annot);
    });
    updated.push(updatedAnnots[chr]);
  });
  return updated;
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
    plotParalogNeighborhoods(annots, ideo);

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
    plotParalogNeighborhoods(annots, ideo);

    ideo.time.rg.paralogs = timeDiff(t0);

    resolve();
  });
}

// /**
//  * Sorts gene names consistently.
//  *
//  * Might also loosely rank by first-discovered or most prominent
//  */
// function sortGeneNames(aName, bName) {
//   // Rank shorter names above longer names
//   if (bName.length !== aName.length) return bName.length - aName.length;

//   // Rank names of equal length alphabetically
//   return [aName, bName].sort().indexOf(aName) === 0 ? 1 : -1;
// }

/** Sorts by relevance of related type, then rank */
export function sortByRelatedType(a, b) {
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

  if ('initRank' in a === false) {
    // Rank red (searched gene) highest
    if (aColor === 'red') return -1;
    if (bColor === 'red') return 1;

    // Rank purple (interacting gene) above pink (paralogous gene)
    if (aColor === 'purple' && bColor === 'pink') return -1;
    if (bColor === 'purple' && aColor === 'pink') return 1;
  }

  return a.rank - b.rank;

  // return sortGeneNames(aName, bName);
}

function mergeDescriptions(annot, desc, ideo) {
  let mergedDesc;
  const descriptions = ideo.annotDescriptions.annots;

  if (annot.name in descriptions) {
    const otherDesc = descriptions[annot.name];
    mergedDesc = desc;
    if (desc.type === otherDesc.type) return;
    Object.keys(otherDesc).forEach(function(key) {
      if (key in mergedDesc === false) {
        mergedDesc[key] = otherDesc[key];
      }
    });
    // Object.assign({}, descriptions[annot.name]);
    if ('type' in otherDesc && !ideo.tissueCache) {
      mergedDesc.type += ', ' + otherDesc.type;
      mergedDesc.description += `<br/><br/>${otherDesc.description}`;
    }
  } else {
    mergedDesc = desc;
  }

  ideo.annotDescriptions.annots[annot.name] = mergedDesc;
}

/** Combines paralogs and interacting gene, if name matches */
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

/**
 * Prevents bug when showing gene leads instantly on page load,
 * then hovering over an annotation, as in e.g.
 * https://eweitz.github.io/ideogram/gene-leads
 */
function waitForTissueCache(geneNames, ideo, n) {
  setTimeout(() => {
    if (n < 40) { // 40 * 50 ms = 2 s
      if (!ideo.tissueCache) {
        waitForTissueCache(geneNames, ideo, n + 1);
      } else {
        setTissueExpressions(geneNames, ideo);
      }
    }
  }, 50);
}

async function setTissueExpressions(geneNames, ideo) {
  if (
    !ideo.tissueCache
    // || !(annot.name in ideo.tissueCache.byteRangesByName)
  ) {
    waitForTissueCache(geneNames, ideo, 0);
    return;
  }

  const tissueExpressionsByGene = {};
  const cache = ideo.tissueCache;

  const promises = [];
  geneNames.forEach(async gene => {
    const promise = new Promise(async (resolve) => {
      const tissueExpressions = await cache.getTissueExpressions(gene, ideo);
      tissueExpressionsByGene[gene] = tissueExpressions;
      resolve();
    });
    promises.push(promise);
  });

  await Promise.all(promises);

  ideo.tissueExpressionsByGene = tissueExpressionsByGene;
}

function onBeforeDrawAnnots() {
  const ideo = this;
  setRelatedAnnotDomIds(ideo);

  const geneNames = [];

  // Handle differential expression extension
  const chrAnnots = ideo.annots;
  for (let i = 0; i < chrAnnots.length; i++) {
    const annots = chrAnnots[i].annots;

    for (let j = 0; j < annots.length; j++) {
      const annot = annots[j];

      geneNames.push(annot.name);

      if (ideo.config.colorMap && annot.differentialExpression?.length) {
        const colorMap = ideo.config.colorMap;
        const group = annot.differentialExpression[0].group;
        annot.color = colorMap[group];
        ideo.annots[i].annots[j] = annot;
      }
    }
  }

  setTissueExpressions(geneNames, ideo);
}

function filterAndDrawAnnots(annots, ideo) {
  annots = applyAnnotsIncludeList(annots, ideo);
  ideo.drawAnnots(annots);
}

/** Filter, sort, draw annots.  Move legend. */
function finishPlotRelatedGenes(type, ideo) {

  let annots = ideo.relatedAnnots;

  if (annots.length > 1 && ideo.onFindGenesCallback) {
    ideo.onFindGenesCallback();
  }

  annots = mergeAnnots(annots);

  filterAndDrawAnnots(annots, ideo);

  if (ideo.config.showAnnotLabels) {
    const sortedAnnots = ideo.flattenAnnots().sort((a, b) => {
      return ideo.annotSortFunction(a, b);
    });
    ideo.fillAnnotLabels(sortedAnnots);
  }

  moveLegend(ideo);

  analyzePlotTimes(type, ideo);
}

/** Fetch position of searched gene, return corresponding annotation */
async function processSearchedGene(geneSymbol, ideo) {
  const t0 = performance.now();

  const data = await fetchGenes(geneSymbol, 'symbol', ideo);

  if (data.hits.length === 0) {
    return;
  }
  const gene = data.hits.find(hit => {
    const genomicPos = getGenomicPos(hit, ideo); // omits alt loci
    return genomicPos && genomicPos.ensemblgene;
  });
  const ensemblId = gene.genomic_pos.ensemblgene;

  // Assign tooltip content.  Much of the content is often retrieved from
  // the gene cache.  In that case, all fields except `name` are fetched
  // from cache.  Occasionally, e.g. often upon the very first search, no
  // content is yet available from cache.
  let desc = {description: '', ensemblId, type: 'searched gene'};
  if (gene.symbol in ideo.annotDescriptions.annots) {
    // Most content already set via cache.
    // `name` will be set via non-blocking part of `fetchGenes`.
    const oldDesc = ideo.annotDescriptions.annots[gene.symbol];
    desc = Object.assign(oldDesc, desc);
  } else {
    // No content has been set yet via cache.  In this case, `gene` already
    // has all the data needed for the searched gene's tooltip content.
    desc.name = gene.name;
  }

  ideo.annotDescriptions.annots[gene.symbol] = desc;

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

// function sortByPathwayIxn(a, b) {
//   const aColor = a.color;
//   const bColor = b.color;

//   // Rank red (searched gene) highest
//   if (aColor === 'red') return -1;
//   if (bColor === 'red') return 1;

//   // Rank not grey above grey
//   if (aColor === 'grey' && bColor !== 'grey') return 1;
//   if (bColor === 'grey' && aColor !== 'grey') return -1;

//   return a.rank - b.rank;
// }

// async function fetchPathwayGeneAnnots(searchedGene, pathway, ideo) {
//   const annots = [];

//   const pathwayIxns =
//     await fetchPathwayInteractions(searchedGene.name, pathway.id, ideo);

//   const pathwayGenes = Object.keys(pathwayIxns);
//   const data = await fetchGenes(pathwayGenes, 'symbol', ideo);

//   const ixnColors = {
//     'Stimulates': 'green',
//     'Stimulated by': 'green',
//     'Necessarily stimulates': 'green',
//     'Necessarily stimulated by': 'green',
//     'Transcribes / translates': 'brown',
//     'Transcribed / translated by': 'brown',
//     'Inhibits': 'red',
//     'Inhibited by': 'red',
//     'Modifies': 'blue',
//     'Modified by': 'blue',
//     'Acts on': 'blue',
//     'Acted on by': 'blue',
//     'Catalyzes': 'orange',
//     'Catalyzed by': 'orange',
//     'Converts': 'orange',
//     'Converted by': 'orange',
//     'Binds': 'black',
//     'Shares pathway with': 'grey'
//   };

//   data.hits.forEach(gene => {
//     // If hit lacks position
//     // or is same as searched gene (e.g. search for human SRC),
//     // then skip processing
//     if (
//       'genomic_pos' in gene === false ||
//       gene.symbol === searchedGene.name
//     ) {
//       return;
//     }

//     // Account for edge case: cyclic AMP (cAMP) is not "CAMP" gene
//     if (gene.symbol === 'cAMP') return;

//     const summary = pathwayIxns[gene.symbol];
//     const color = ixnColors[summary];
//     // if (color !== 'blue') console.log(gene);

//     const annot = parseAnnotFromMgiGene(gene, ideo, color);
//     annots.push(annot);

//     const descriptionObj =
//       describePathwayGene(gene, searchedGene, pathway, summary);

//     mergeDescriptions(annot, descriptionObj, ideo);
//   });

//   ideo.annotSortFunction = sortByPathwayIxn;

//   const sortedAnnots = annots.sort(sortByPathwayIxn).slice(0, 40);

//   return sortedAnnots;
// }

// /**
//  *
//  */
// async function plotPathwayGenes(searchedGene, pathway, ideo) {
//   const headerTitle = 'Genes in pathway';
//   initAnnotDescriptions(ideo, headerTitle);

//   legendPathwayName = pathway.name;
//   ideo.config.legend = pathwayLegend;
//   writeLegend(ideo);
//   moveLegend(ideo);

//   ideo.relatedAnnots = [];

//   await processSearchedGene(searchedGene.name, ideo);

//   const annots = await fetchPathwayGeneAnnots(searchedGene, pathway, ideo);
//   ideo.relatedAnnots.push(...annots);
//   finishPlotRelatedGenes('pathway', ideo);
// }

function initAnnotDescriptions(ideo, headerTitle) {
  const organism = ideo.getScientificName(ideo.config.taxid);
  const version = Ideogram.version;
  const headers = [
    `# ${headerTitle}`,
    `# Organism: ${organism}`,
    `# Generated by Ideogram.js version ${version}, https://github.com/eweitz/ideogram`,
    `# Generated at ${window.location.href}`
  ].join('\n');

  delete ideo.annotDescriptions;
  ideo.annotDescriptions = {headers, annots: {}};

}

/**
 * For given gene, finds and draws interacting genes and paralogs
 *
 * @param geneSymbol {String} Gene symbol, e.g. RAD51
 */
async function plotRelatedGenes(geneSymbol=null) {

  const ideo = this;

  if (!geneSymbol) {
    return plotGeneHints(ideo);
  }

  ideo.clearAnnotLabels();
  const legend = document.querySelector('#_ideogramLegend');
  if (legend) legend.remove();

  ideo.config = setRelatedDecorPad(ideo.config);

  initAnnotDescriptions(ideo, `Related genes for ${geneSymbol}`);

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
  ideo.neighborhoodAnnots = [];

  // Fetch positon of searched gene
  const annot = await processSearchedGene(geneSymbol, ideo);

  if (typeof annot === 'undefined') throwGeneNotFound(geneSymbol, ideo);

  ideo.config.legend = relatedLegend;
  writeLegend(ideo);
  moveLegend(ideo);

  await Promise.all([
    processInteractions(annot, ideo),
    processParalogs(annot, ideo)
  ]);

  ideo.time.rg.total = timeDiff(ideo.time.rg.t0);

  analyzeRelatedGenes(ideo);

  if (ideo.onPlotFoundGenesCallback) ideo.onPlotFoundGenesCallback();
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

  if (annotByName === null) {
    annotByName = ideo.annotDescriptions.annots[annotName];
  }
  return annotByName;
}

/**
 * Manage click on pathway links in annotation tooltips
 */
// function managePathwayClickHandlers(searchedGene, ideo) {
//   setTimeout(function() {
//     const pathways = document.querySelectorAll('.ideo-pathway-link');
//     if (pathways.length > 0 && !ideo.addedPathwayClickHandler) {
//       pathways.forEach(pathway => {
//         // pathway.removeEventListener('click', handlePathwayClick);
//         pathway.addEventListener('click', function(event) {
//           const target = event.target;
//           const pathwayId = target.getAttribute('data-pathway-id');
//           const pathwayName = target.getAttribute('data-pathway-name');
//           const pathway = {id: pathwayId, name: pathwayName};
//           plotPathwayGenes(searchedGene, pathway, ideo);
//         });
//       });

//       // Ensures handler isn't added redundantly.  This is used because
//       // addEventListener options like {once: true} don't suffice
//       // ideo.addedPathwayClickHandler = true;
//     }
//   }, 100);
// }

/** Move tooltip mass to vertical center of viewport */
function centralizeTooltipPosition() {
  const tooltip = document.querySelector('#_ideogramTooltip');
  const tooltipTop = tooltip.getBoundingClientRect().top;
  const ideoDom = document.querySelector('#_ideogram');
  const ideogramTop = ideoDom.getBoundingClientRect().top;
  if (tooltipTop > ideogramTop) {
    tooltip.style.top = ideogramTop + 'px';
  }
}

function onDidShowAnnotTooltip() {
  const ideo = this;
  if (ideo.tissueCache) {
    centralizeTooltipPosition();
  }
  handleTooltipClick(ideo);
  addGeneStructureListeners(ideo);
  addTissueListeners(ideo);
  ideo.tissueTippy =
    tippy('._ideoGeneTissues[data-tippy-content]', getTippyConfig());
}

/**
 * Handles click within annotation tooltip
 *
 * Makes clicking link in tooltip behave same as clicking annotation
 */
export function handleTooltipClick(ideo) {
  // const tooltip = document.querySelector('._ideogramTooltip');
  // if (!ideo.addedTooltipClickHandler) {
  //   tooltip.addEventListener('click', () => {
  //     const geneDom = document.querySelector('#ideo-related-gene');
  //     const annotName = geneDom.textContent;
  //     const annot = getAnnotByName(annotName, ideo);
  //     ideo.onClickAnnot(annot);
  //   });

  //   // Ensures handler isn't added redundantly.  This is used because
  //   // addEventListener options like {once: true} don't suffice
  //   ideo.addedTooltipClickHandler = true;
  // }

  const tooltip = document.querySelector('._ideogramTooltip');
  if (!ideo.addedTooltipClickHandler) {
    tooltip.addEventListener('click', (event) => {
      if (['input', 'label'].includes(event.target.localName)) {
        return;
      }

      let geneDom = document.querySelector('#ideo-related-gene');
      if (!geneDom) {
        geneDom = event.target;
      }
      const annotName = geneDom.textContent;
      const annot = getAnnotByName(annotName, ideo);

      ideo.onClickAnnot(annot);
    });

    // const ixnLinkToggler = document.querySelector('#_ideoIxnLinkToggler');
    // if (ixnLinkToggler) {
    //   ixnLinkToggler.addEventListener('click', (event) => {
    //     const isOpen = !ixnLinkToggler.classList.contains('closed');
    //     const newToggleClass = isOpen ? 'closed' : '';
    //     if (isOpen) {
    //       ixnLinkToggler
    //     } else {

    //     }
    //   });
    // }

    // Ensures handler isn't added redundantly.  This is used because
    // addEventListener options like {once: true} don't suffice
    ideo.addedTooltipClickHandler = true;
  }
}

/** Return searched gene from annotation descriptions in Ideogram object */
function getSearchedFromDescriptions(ideo) {
  return (
    Object.entries(ideo.annotDescriptions.annots)
      .find(([k, v]) => v.type === 'searched gene')[0]
  );
}

function decorateInteractingGene(annot, descObj, ideo) {
  if ('type' in descObj && descObj.type.includes('interacting gene')) {
    const pathwayIds = descObj.pathwayIds;
    // Get symbol of the searched gene, e.g. "PTEN"
    const searchedGene = getSearchedFromDescriptions(ideo);

    const gpmls = ideo.gpmlsByInteractingGene[annot.name];

    const summary =
      summarizeInteractions(annot.name, searchedGene, pathwayIds, gpmls);
    if (summary !== null) {
      const oldSummary = 'Interacts with';
      descObj.description =
        descObj.description.replace(oldSummary, summary);
    }
  }

  return descObj;
}

function decorateParalogNeighborhood(annot, descObj, style) {
  // Rank 1st highest, then put it last as it already has a triangle
  // annotation, and is often also labeled.
  const sortedParalogs =
    descObj.paralogs.sort((a, b) => a.rank - b.rank);
  // const firstRanked = sortedParalogs.shift(); // Take off first
  // sortedParalogs.push(firstRanked); // Make it last

  const originalDisplay =
    'Paralog neighborhood<br/>' +
    '<br/>' +
    descObj.description + ':<br/>' +
    `${sortedParalogs
      .map(paralog => {
        let title = '';
        if (paralog.fullName) title = paralog.fullName;
        if (paralog.rank) {
          const rank = paralog.rank;
          title += ` &#013;Ranked ${rank} in general or scholarly interest`;
        }
        if (title !== '') title = `title="${title}"`;
        return (
          `<span class="ideo-paralog-neighbor" ${title} style="${style}"'>${
            paralog.name
          }</span>`
        );
      }).join('<br/>')}` +
    '<br/>';
  annot.displayCoordinates = descObj.displayCoordinates;

  return [annot, originalDisplay];
}

/**
 * Enhance tooltip shown on hovering over gene annotation
 */
function decorateAnnot(annot) {
  const ideo = this;
  if (
    annot.name === ideo.prevClickedAnnot?.name &&
    ideo.isTooltipCooling
  ) {
    // Cancels showing tooltip immediately after clicking gene
    return null;
  }

  let descObj = ideo.annotDescriptions.annots[annot.name];

  if (ideo.config.relatedGenesMode === 'related') {
    descObj = decorateInteractingGene(annot, descObj, ideo);
  }

  const description =
    descObj.description.length > 0 ? `<br/>${descObj.description}` : '';
  const fullName = descObj.name;
  const style = 'color: #0366d6; cursor: pointer;';

  let fullNameAndRank = fullName;
  if ('rank' in annot) {
    const rank = 'Ranked ' + annot.rank + ' in general or scholarly interest';
    fullNameAndRank = `<span title="${rank}">${fullName}</span>`;
  }

  let synonym = '';
  if (descObj?.isSynonym) {
    const queriedSynonym = descObj.synonym;
    const synStyle = 'style="font-style: italic"';
    synonym = `<div ${synStyle}>Synonym: ${queriedSynonym}</div>`;
    // const synList = ideo.synonymCache.byGene[annot.name];
    // const litSyns = synList.map(s => {
    //   // Emphasize ("highlight") any synonyms that match the user's query
    //   if (s.toLowerCase() === queriedSynonym.toLowerCase()) {
    //     const style =
    //       'style="font-weight: bold; text-decoration: underline"';
    //     return `<span ${style}>${s}</span>`;
    //   }
    //   return s;
    // });
    // const synText = 'Synonyms: ' + litSyns.join(', ') + '<br/>';
    // const synStyle =
    //   'style="max-width: 300px; color: #666;"'; // Minimum WCAG AA contrast
    // synonyms = `<div ${synStyle}>${synText}</div>`;
  }

  const isParalogNeighborhood = annot.name.includes('paralogNeighborhood');

  const geneStructureHtml = getGeneStructureHtml(
    annot, ideo, isParalogNeighborhood
  );

  const tissueHtml = getTissueHtml(annot, ideo);

  const geneSymbolAndFullName =
    `<span id="_ideoGeneSymbolAndFullName">
      <span id="ideo-related-gene" style="${style}">${annot.name}</span><br/>` +
      `${fullNameAndRank}<br/>
    </span>`;

  let originalDisplay =
    geneSymbolAndFullName +
    synonym +
    description +
    tissueHtml +
    geneStructureHtml;

  if (isParalogNeighborhood) {
    [annot, originalDisplay] =
      decorateParalogNeighborhood(annot, descObj, style);
  }

  annot.displayName = originalDisplay;

  // managePathwayClickHandlers(annot, ideo);

  return annot;
}

const shape = 'triangle';

function getLegendName(nameText, legendContent=null) {
  const legendHeaderStyle =
    `font-size: 14px; font-weight: bold; font-color: #333;`;

  let content = `<div style="${legendHeaderStyle}">${nameText}</div>`;
  if (legendContent) content = legendContent;
  return `
    <div style="position: relative; left: 30px;">
      ${content}
      <i>Click gene to search</i>
    </div>
  `;
}

const relatedLegend = [{
  name: getLegendName('Related genes'),
  nameHeight: 50,
  rows: [
    {name: 'Interacting gene', color: 'purple', shape: shape},
    {name: 'Paralogous gene', color: 'pink', shape: shape},
    {name: 'Searched gene', color: 'red', shape: shape}
  ]
}];

let legendPathwayName = '';

const pathwayLegend = [{
  name: getLegendName('Related genes'),
  nameHeight: 50,
  rows: [
    {name: 'Pathway gene', color: 'blue', shape: shape},
    {name: 'Searched gene', color: 'red', shape: shape}
  ]
}];

const citedLegend = [{
  name: getLegendName('Highly cited genes'),
  nameHeight: 30,
  rows: []
}];

/** Sets legendPad for related genes view */
function setRelatedDecorPad(kitConfig) {
  kitConfig.legendPad = kitConfig.showAnnotLabels ? 70 : 30;
  return kitConfig;
}

const globalKitDefaults = {
  chrWidth: 9,
  chrHeight: 100,
  chrLabelSize: 12,
  annotationHeight: 7,
  showFullyBanded: false,
  rotatable: false,
  legend: relatedLegend,
  chrBorderColor: '#333',
  chrLabelColor: '#333',
  onBeforeDrawAnnots,
  onWillShowAnnotTooltip: decorateAnnot,
  onDidShowAnnotTooltip,
  showTools: true,
  showAnnotLabels: true,
  chrFillColor: {centromere: '#DAAAAA'}
};


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
      name: decodeURIComponent(annot.fullName)
    };
  });

  adjustPlaceAndVisibility(ideo);
  moveLegend(ideo, -60);

  const container = ideo.config.container;
  document.querySelector(container).style.visibility = '';

  if (ideo.config.showAnnotLabels) {
    const sortedAnnots = ideo.flattenAnnots().sort((a, b) => {
      return ideo.annotSortFunction(a, b);
    });
    ideo.fillAnnotLabels(sortedAnnots);
  }
}

/** Request JSON for a WikiPathways biological pathway diagram */
async function fetchPathwayJson(pwId) {
  const origin = 'https://raw.githubusercontent.com'
  const repoAndBranch = '/wikipathways/wikipathways-assets/main'

  // E.g. https://raw.githubusercontent.com/wikipathways/wikipathways-assets/main/pathways/WP5445/WP5445.json
  const url = `${origin}${repoAndBranch}/pathways/${pwId}/${pwId}.json`

  const response = await fetch(url);
  const pathwayJson = await response.json();

  window.pathwayJson = pathwayJson;
  return pathwayJson;
}

/**
 * Wrapper for Ideogram constructor, with generic "Related genes" options
 *
 * This function is made available as a static method on Ideogram.
 *
 * @param {Object} config Ideogram configuration object
 */
function _initRelatedGenes(config, annotsInList) {

  // console.log('ok')
  // window.Pvjs = Pvjs
  // console.log('Pvjs')
  // console.log(Pvjs)
  // fetchPathwayJson('WP5445').then(pathwayJson => {
  //   const whyDomNode = document.querySelector('#why');
  //   const pvjsProps = {
  //     theme: 'plain',
  //     opacities: [],
  //     highlights: [],
  //     panned: [],
  //     zoomed: [],
  //     pathway: pathwayJson.pathway,
  //     entitiesById: pathwayJson.entitiesById,
  //     detailPanelOpen: false,
  //     showPanZoomControls: false,
  //     selected: null
  //   }
  //   const pathwayViewer = new Pvjs(pvjsProps);
  //   window.pathwayViewer = pathwayViewer;
  //   const pathwayContainer = document.getElementById('pathway-container');
  //   const reactRoot = createRoot(pathwayContainer);
  //   console.log('reactRoot')
  //   console.log(reactRoot)
  //   console.log('pathwayViewer')
  //   console.log(pathwayViewer);
  //   // const pwComponent = pathwayViewer.render();
  //   console.log('pwComponent')
  //   reactRoot.render(<Pvjs {...pvjsProps} />);
  // });

  if (config.relatedGenesMode === 'leads') {
    delete config.onDrawAnnots;
    delete config.relatedGenesMode;
  };

  const kitDefaults = Object.assign({
    showParalogNeighborhoods: true,
    isLegendInteractive: true,
    relatedGenesMode: 'related',
    useCache: true,
    awaitCache: true
  }, globalKitDefaults);

  return initSearchIdeogram(kitDefaults, config, annotsInList);
}

/**
 * Wrapper for Ideogram constructor, with generic "Gene leads" options
 *
 * This function is made available as a static method on Ideogram.
 *
 * @param {Object} config Ideogram configuration object
 */
 function _initGeneLeads(config, annotsInList) {
  delete config.onPlotFoundGenes;

  if (config.legendName) {
    if (config.legendContent) {
      citedLegend[0].name = getLegendName(
        config.legendName, config.legendContent
      );
    } else if (config.geneLeadsDE) {
      // citedLegend[0].name = getLegendName(config.legendName);
      const content =
        '<span style="font-size: 14px; font-weight: bold; left: 0">Gene leads</span> from<br/>' +
        // `<div style="margin-top: 10px; padding: 3px 6px; border: 1px solid #4D72AA; border-radius: 3px; color: #3D629A;">${fileIcon} <span style="margin-left: 20px; position: relative; top: -1px;">Publication</span></div>` +
        // `<div style="margin-top: 5px; margin-bottom: 0px; padding: 3px 6px; border: 1px solid #4D72AA; border-radius: 3px; color: #3D629A;">${deltaIcon} <span style="margin-left: 20px;">Differential expression</span></div><br/>`;
        `<div style="margin-top: 10px; padding: 3px 6px; font-size: 14px; font-weight: bold; color: #3D629A;">${fileIcon} <span style="margin-left: 20px; position: relative; top: -1px;">Publication</span></div>` +
        // `<div style="margin-top: 5px; margin-bottom: -5px; font-size: 14px; font-weight: bold; padding: 3px 6px; color: #3D629A;">${deltaIcon} <span style="margin-left: 20px;">Differential expression</span></div><br/>`;
        `<div style="margin-top: 3px; margin-bottom: -10px; font-size: 14px; padding: 3px 6px;">${deltaIcon} <span style="margin-left: 20px;">Differential expression</span></div><br/>`;
        // `<div>Publication</div>` +
        // `<div>Differential expression</div>`;

      citedLegend[0].name = getLegendName(
        config.legendName, content
      );
    } else {
      citedLegend[0].name = getLegendName(config.legendName);
    }
  }

  config.legend = citedLegend;

  let rawPath, mode;
  if (config.geneLeadsDE) {
    mode = 'leads';
    rawPath = 'annotations/gene_leads.tsv';
  } else {
    mode = 'hints';
    rawPath = 'cache/homo-sapiens-top-genes.tsv';
  }

  const kitDefaults = Object.assign({
    relatedGenesMode: mode,
    chrMargin: -4,
    // annotationsPath: getDir('cache/homo-sapiens-top-genes.tsv'),
    annotationsPath: getDir(rawPath),
    onDrawAnnots: plotGeneHints,
    useCache: true
  }, globalKitDefaults);

  return initSearchIdeogram(kitDefaults, config, annotsInList);
}

function initSearchIdeogram(kitDefaults, config, annotsInList) {
  if (annotsInList !== 'all') {
    annotsInList = annotsInList.map(name => name.toLowerCase());
  }
  config.annotsInList = annotsInList;

  kitDefaults.legendPad = kitDefaults.showAnnotLabels ? 80 : 30;

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

  if ('onDidShowAnnotTooltip' in config) {
    const key = 'onDidShowAnnotTooltip';
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

  if ('onBeforeDrawAnnots' in config) {
    const key = 'onBeforeDrawAnnots';
    const clientFn = config[key];
    const defaultFn = kitDefaults[key];
    const newFunction = function() {
      if (defaultFn) defaultFn.bind(this)();
      clientFn.bind(this)();
    };
    kitDefaults[key] = newFunction;
    delete config[key];
  }

  if ('onDrawAnnots' in config) {
    const key = 'onDrawAnnots';
    const clientFn = config[key];
    const defaultFn = kitDefaults[key];
    const newFunction = function() {
      if (defaultFn) defaultFn.bind(this)();
      clientFn.bind(this)();
    };
    kitDefaults[key] = newFunction;
    delete config[key];
  }

  // Override kit defaults if client specifies otherwise
  const kitConfig = Object.assign(kitDefaults, config);

  const ideogram = new Ideogram(kitConfig);

  // Called upon 1) finding paralogs, and 2) finding interacting genes
  if (config.onFindGenes) {
    ideogram.onFindGenesCallback = config.onFindGenes;
  }

  // Called upon completing last plot, including all related genes
  if (config.onPlotFoundGenes) {
    ideogram.onPlotFoundGenesCallback = config.onPlotFoundGenes;
  }

  // Called upon hovering over a legend entry, e.g. "Interacting genes"
  if (config.onHoverLegend) {
    ideogram.onHoverLegendCallback = config.onHoverLegend;
  }

  ideogram.getTooltipAnalytics = getRelatedGenesTooltipAnalytics;

  ideogram.annotSortFunction = sortByRelatedType;

  initAnalyzeRelatedGenes(ideogram);

  return ideogram;
}

export {
  _initGeneLeads, _initRelatedGenes,
  plotRelatedGenes, getRelatedGenesByType
};
