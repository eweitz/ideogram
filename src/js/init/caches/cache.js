import {
  supportsCache, getCacheUrl, fetchAndParse,
  cacheFetch
} from './cache-lib';

// Uncomment when workers work outside localhost
// const geneCacheWorker = new Worker(
//   new URL('./gene-cache-worker.js', import.meta.url), {type: 'module'}
// );
// const paralogCacheWorker = new Worker(
//   new URL('./paralog-cache-worker.js', import.meta.url), {type: 'module'}
// );
// const interactionCacheWorker = new Worker(
//   new URL('./interaction-cache-worker.js', import.meta.url), {type: 'module'}
// );
// const geneStructureCacheWorker = new Worker(
//   new URL('./gene-structure-cache-worker.js', import.meta.url), {type: 'module'}
// );

import {parseGeneCache} from './gene-cache-worker';
import {parseParalogCache} from './paralog-cache-worker';
import {parseInteractionCache} from './interaction-cache-worker';
import {parseGeneStructureCache} from './gene-structure-cache-worker';
import {parseProteinCache} from './protein-cache-worker';
import {parseSynonymCache} from './synonym-cache-worker';
import {parseTissueCache} from './tissue-cache-worker';
import {parseVariantCacheIndex} from './variant-cache-worker';

/**
 * Populates in-memory content caches from on-disk service worker (SW) caches.
 *
 * This warms the following content caches:
 * - Gene cache: gene symbol -> full name, Ensembl ID, genomic coordinates
 * - Paralog cache: gene symbol -> paralogs (evolutionarily related genes)
 * - Interaction cache: gene symbol -> adjacent genes in biochemical pathways
 *
 * And, optionally:
 * - Gene structure cache: gene symbol -> canonical transcript, exons, UTRs
 * - Protein cache: gene symbol -> protein domains & families, per transcript
 * - Synonym cache: gene symbol -> list of synonyms, a.k.a. aliases
 *
 * Used for related genes kit now, likely worth generalizing in the future.
 *
 * This approach makes navigating related genes ideogram instant and
 * possible completely offline (i.e. a progressive web component) -- but only
 * once caches are populated.
 */
export async function initCaches(config) {

  if (!config.useCache) return;

  const organism = config.organism;

  let cacheDir = null;
  if (config.cacheDir) cacheDir = config.cacheDir;

  if (config.awaitCache) {
    // Start all these in parallel.  Only initGeneCache blocks; it internally
    // resolves a Promise, whereas the others return upon completing their
    // respective initializations.
    const cachePromise = Promise.all([
      cacheFactory('gene', organism, config, cacheDir),
      cacheFactory('paralog', organism, config, cacheDir),
      cacheFactory('interaction', organism, config, cacheDir),
      cacheFactory('synonym', organism, config, cacheDir),
    ]);

    if (config.showGeneStructureInTooltip) {
      cacheFactory('geneStructure', organism, config, cacheDir);
      cacheFactory('protein', organism, config, cacheDir);
      cacheFactory('tissue', organism, config, cacheDir);
      if (config.showVariantInTooltip) {
        cacheFactory('variant', organism, config, cacheDir);
      }
    }

    return cachePromise;

  } else {
    cacheFactory('gene', organism, config, cacheDir);
    cacheFactory('paralog', organism, config, cacheDir);
    cacheFactory('interaction', organism, config, cacheDir);
    if (config.showGeneStructureInTooltip) {
      cacheFactory('geneStructure', organism, config, cacheDir);
      cacheFactory('protein', organism, config, cacheDir);
      cacheFactory('synonym', organism, config, cacheDir);
      cacheFactory('tissue', organism, config, cacheDir);
      if (config.showVariantInTooltip) {
        cacheFactory('variant', organism, config, cacheDir);
      }
    }
  }
}

const allCacheProps = {
  gene: {
    metadata: 'Gene', dir: 'genes',
    fn: setGeneCache,
    // worker: geneCacheWorker // Uncomment when workers work
    parseFn: parseGeneCache // Remove when workers work
  },
  paralog: {
    metadata: 'Paralog', dir: 'paralogs',
    fn: setParalogCache,
    // worker: paralogCacheWorker // Uncomment when workers work
    parseFn: parseParalogCache // Remove when workers work
  },
  interaction: {
    metadata: 'Interaction', dir: 'interactions',
    fn: setInteractionCache, extension: 'json',
    // worker: interactionCacheWorker, // Uncomment when workers work
    parseFn: parseInteractionCache // Remove when workers work
  },
  geneStructure: {
    metadata: 'GeneStructure', dir: 'gene-structures',
    fn: setGeneStructureCache,
    // worker: geneStructureCacheWorker // Uncomment when workers work
    parseFn: parseGeneStructureCache // Remove when workers work
  },
  protein: {
    metadata: 'Protein', dir: 'proteins',
    fn: setProteinCache,
    // worker: proteinCacheWorker // Uncomment when workers work
    parseFn: parseProteinCache // Remove when workers work
  },
  synonym: {
    metadata: 'Synonym', dir: 'synonyms',
    fn: setSynonymCache,
    // worker: synonymCacheWorker // Uncomment when workers work
    parseFn: parseSynonymCache // Remove when workers work
  },
  tissue: {
    metadata: 'Tissue', dir: 'tissues',
    fn: setTissueCache,
    // worker: tissueCacheWorker // Uncomment when workers work
    parseFn: parseTissueCache // Remove when workers work
  },
  variant: {
    metadata: 'Variant', dir: 'variants',
    fn: setVariantCache, extension: 'tsv.li',
    // worker: variantCacheWorker // Uncomment when workers work
    parseFn: parseVariantCacheIndex // Remove when workers work
  }
};

function setGeneCache(parsedCache) {
  const [
    interestingNames, nameCaseMap, namesById, fullNamesById,
    idsByName, lociByName, lociById
    //, sortedAnnots
  ] = parsedCache;

  Ideogram.geneCache = {
    interestingNames, // Array ordered by general or scholarly interest
    nameCaseMap, // Maps of lowercase gene names to proper gene names
    namesById,
    fullNamesById,
    idsByName,
    lociByName, // Object of gene positions, keyed by gene name
    lociById
    //, sortedAnnots // Ideogram annotations sorted by genomic position
  };
}

function setParalogCache(parsedCache) {
  const paralogsByName = parsedCache;
  // Array of paralog Ensembl IDs by (uppercase) gene name
  Ideogram.paralogCache = {paralogsByName};
}

function setInteractionCache(parsedCache) {
  const interactionsByName = parsedCache;
  Ideogram.interactionCache = interactionsByName;
}

function setGeneStructureCache(parsedCache) {
  const featuresByGene = parsedCache;
  Ideogram.geneStructureCache = featuresByGene;
}

function setProteinCache(parsedCache) {
  Ideogram.proteinCache = parsedCache;
}

function setSynonymCache(parsedCache) {
  Ideogram.synonymCache = parsedCache;
}

function setTissueCache(parsedCache) {
  Ideogram.tissueCache = parsedCache;
}

function setVariantCache(parsedCache) {
  Ideogram.variantCache = parsedCache;
}

async function cacheFactory(cacheName, orgName, config, cacheDir=null) {

  const cacheProps = allCacheProps[cacheName];
  const debug = config.debug;

  /**
   * Fetch cached gene data, transform it usefully, and set it as Ideogram prop
   */
  const startTime = performance.now();
  let perfTimes = {};

  let parsedCache;

  // Skip initialization if files needed to make cache don't exist
  if (!supportsCache(orgName, cacheProps.metadata)) return;

  const staticProp = cacheName + 'Cache';
  // Skip initialization if cache is already populated
  if (Ideogram[staticProp] && Ideogram[staticProp][orgName]) {
    // Simplify chief use case, i.e. for single organism
    return;
  }

  if (!Ideogram[staticProp]) {
    Ideogram[staticProp] = {};
  }

  const extension = cacheProps?.extension ?? 'tsv';
  const cacheUrl = getCacheUrl(orgName, cacheDir, cacheProps.dir, extension);

  [parsedCache, perfTimes] =
    await fetchAndParse(cacheUrl, perfTimes, cacheProps.parseFn, orgName);

  // const cacheWorker = cacheProps.worker;
  if (debug) console.time(`${cacheName}Cache total`);
  return new Promise(resolve => {
  //   const message = [cacheUrl, perfTimes, debug];
  //   if (cacheName === 'interaction') message.push(orgName);
  //   cacheWorker.postMessage(message);
  //   cacheWorker.addEventListener('message', event => {
  //     [parsedCache, perfTimes] = event.data;
      cacheProps.fn(parsedCache, orgName);
      Ideogram[staticProp][orgName] = Ideogram[staticProp];

      if (debug) {
        console.timeEnd(`${cacheName}Cache total`);
        perfTimes.total = Math.round(performance.now() - startTime);
        const preamble = 'perfTimes in init' + cacheProps.metadata + 'Cache:';
        console.log(preamble, perfTimes);
      }

      resolve();
    // });
  });
}
