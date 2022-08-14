import {supportsCache, getCacheUrl} from './cache-lib';

const geneCacheWorker = new Worker(
  new URL('./gene-cache-worker.js', import.meta.url), {type: 'module'}
);
const paralogCacheWorker = new Worker(
  new URL('./paralog-cache-worker.js', import.meta.url), {type: 'module'}
);
const interactionCacheWorker = new Worker(
  new URL('./interaction-cache-worker.js', import.meta.url), {type: 'module'}
);
const geneStructureCacheWorker = new Worker(
  new URL('./gene-structure-cache-worker.js', import.meta.url), {type: 'module'}
);


/**
 * Populates in-memory content caches from on-disk service worker (SW) caches.
 *
 * This warms the following content caches:
 * - Gene cache: gene symbol -> full name, Ensembl ID, genomic coordinates
 * - Paralog cache: gene symbol -> paralogs (evolutionarily related genes)
 * - Interaction cache: gene symbol -> adjacent genes in biochemical pathways
 * - Gene structure cache: gene symbol -> canonical transcript, exons, UTRs
 *
 * Used for related genes kit now, likely worth generalizing in the future.
 *
 * This approaches makes navigating related genes ideogram instant and
 * possible completely offline (i.e. a progressive web component) -- but only
 * once caches are populated.
 */
export async function initCaches(ideo) {

  const config = ideo.config;
  if (!config.useCache) return;

  const organism = config.organism;
  if (config.cacheDir) cacheDir = config.cacheDir;

  let cacheDir = null;

  // Start all these in parallel.  Only initGeneCache blocks; it internally
  // resolves a Promise, whereas the others return upon completing their
  // respective initializations.
  const cachePromise = Promise.all([
    cacheFactory('gene', organism, ideo, cacheDir),
    cacheFactory('paralog', organism, ideo, cacheDir),
    cacheFactory('interaction', organism, ideo, cacheDir)
  ]);

  cacheFactory('geneStructure', organism, ideo, cacheDir);

  return cachePromise;
}

const allCacheProps = {
  gene: {
    metadata: 'Gene', dir: 'genes',
    fn: setGeneCache, worker: geneCacheWorker
  },
  paralog: {
    metadata: 'Paralog', dir: 'paralogs',
    fn: setParalogCache, worker: paralogCacheWorker
  },
  interaction: {
    metadata: 'Interaction', dir: 'interactions',
    fn: setInteractionCache, worker: interactionCacheWorker, extension: 'json'
  },
  geneStructure: {
    metadata: 'GeneStructure', dir: 'gene-structures',
    fn: setGeneStructureCache, worker: geneStructureCacheWorker
  }
};

function setGeneCache(parsedCache, ideo) {
  const [
    interestingNames, nameCaseMap, namesById, fullNamesById,
    idsByName, lociByName, lociById
    //, sortedAnnots
  ] = parsedCache;

  ideo.geneCache = {
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

function setParalogCache(parsedCache, ideo) {
  const paralogsByName = parsedCache;
  // Array of paralog Ensembl IDs by (uppercase) gene name
  ideo.paralogCache = {paralogsByName};
}

function setInteractionCache(parsedCache, ideo) {
  const interactionsByName = parsedCache;
  ideo.interactionCache = interactionsByName;
}

function setGeneStructureCache(parsedCache, ideo) {
  const featuresByGene = parsedCache;
  ideo.geneStructureCache = featuresByGene;
}

async function cacheFactory(cacheName, orgName, ideo, cacheDir=null) {

  const cacheProps = allCacheProps[cacheName];

  /**
 * Fetch cached gene data, transform it usefully, and set it as ideo prop
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
    ideo[staticProp] = Ideogram[staticProp][orgName];
    return;
  }

  if (!Ideogram[staticProp]) {
    Ideogram[staticProp] = {};
  }

  const extension = cacheProps?.extension ?? 'tsv';
  const cacheUrl = getCacheUrl(orgName, cacheDir, cacheProps.dir, extension);

  const cacheWorker = cacheProps.worker;

  return new Promise(resolve => {
    // console.log('before posting message');
    const message = [cacheUrl, perfTimes];
    if (cacheName === 'interaction') message.push(orgName);
    cacheWorker.postMessage(message);
    // console.log('Message posted to geneCacheWorker');
    cacheWorker.addEventListener('message', event => {
      // console.log('Received message from worker')
      [parsedCache, perfTimes] = event.data;
      cacheProps.fn(parsedCache, ideo, orgName);
      Ideogram[staticProp][orgName] = ideo[staticProp];

      if (ideo.config.debug) {
        perfTimes.total = Math.round(performance.now() - startTime);
        const preamble = 'perfTimes in init' + cacheProps.metadata + 'Cache:';
        console.log(preamble, perfTimes);
      }

      resolve();
    });
  });
}
