import {supportsCache, getCacheUrl} from './cache-lib';
import {parseCache as parseCacheBase} from './gene-cache-worker'
import version from '../../version';

// const geneCacheWorker = new Worker(
//   new URL('./gene-cache-worker.js', import.meta.url), {type: 'module'}
// );

function gcw() {
  addEventListener('message', async event => {

    // const version = '1.37.0'

    function getEnsemblId(ensemblPrefix, slimEnsemblId) {

      // C. elegans (prefix: WBGene) has special IDs, e.g. WBGene00197333
      const padLength = ensemblPrefix === 'WBGene' ? 8 : 11;

      // Zero-pad the slim ID, e.g. 223972 -> 00000223972
      const zeroPaddedId = slimEnsemblId.padStart(padLength, '0');

      return ensemblPrefix + zeroPaddedId;
    }

    /** Parse a gene cache TSV file, return array of useful transforms */
function parseCache(rawTsv, perfTimes) {
  const names = [];
  const nameCaseMap = {};
  const namesById = {};
  const fullNamesById = {};
  const idsByName = {};
  const lociByName = {};
  const lociById = {};
  const preAnnots = [];
  let ensemblPrefix;

  let t0 = performance.now();
  const lines = rawTsv.split(/\r\n|\n/);
  perfTimes.rawTsvSplit = Math.round(performance.now() - t0);

  t0 = performance.now();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === '') continue; // Skip empty lines
    if (line[0] === '#') {
      if (line.slice(0, 9) === '## prefix') {
        ensemblPrefix = line.split('prefix: ')[1];
      }
      continue;
    }
    const [
      chromosome, rawStart, rawLength, slimEnsemblId, gene, rawFullName
    ] = line.trim().split(/\t/);
    const fullName = decodeURIComponent(rawFullName);
    const start = parseInt(rawStart);
    const stop = start + parseInt(rawLength);
    const ensemblId = getEnsemblId(ensemblPrefix, slimEnsemblId);
    preAnnots.push([chromosome, start, stop, ensemblId, gene, fullName]);
    const locus = [chromosome, start, stop];

    names.push(gene);
    nameCaseMap[gene.toLowerCase()] = gene;
    namesById[ensemblId] = gene;
    fullNamesById[ensemblId] = fullName;
    idsByName[gene] = ensemblId;
    lociByName[gene] = locus;
    lociById[ensemblId] = locus;
  };
  const t1 = performance.now();
  perfTimes.parseCacheLoop = Math.round(t1 - t0);

  // const sortedAnnots = parseAnnots(preAnnots);
  perfTimes.parseAnnots = Math.round(performance.now() - t1);

  return [
    names, nameCaseMap, namesById, fullNamesById,
    idsByName, lociByName, lociById
    // , sortedAnnots
  ];
}


async function cacheFetch(url) {

  const cache = await caches.open(`ideogram-${version}`);

  const decompressedUrl = url.replace('.gz', '');
  const response = await cache.match(decompressedUrl);
  if (typeof response === 'undefined') {
    // If cache miss, then fetch and add response to cache
    const rawResponse = await fetch(url);
    const blob = await rawResponse.blob();
    const uint8Array = new Uint8Array(await blob.arrayBuffer());
    const data = strFromU8(decompressSync(uint8Array));
    const decompressedResponse = new Response(
      new Blob([data], {type: 'text/tab-separated-values'}),
      rawResponse.init
    );
    await cache.put(decompressedUrl, decompressedResponse);
    return await cache.match(decompressedUrl);
  }
  return await cache.match(decompressedUrl);
}

/** Get organism's metadata fields */
function parseOrgMetadata(orgName) {
  const taxid = getEarlyTaxid(orgName);
  return organismMetadata[taxid] || {};
}

/** Fetch URL from service worker cache, call given parsing function */
async function fetchAndParse(
  cacheUrl, perfTimes, parseFn, orgName=null
) {
  const fetchStartTime = performance.now();
  const response = await cacheFetch(cacheUrl);
  let data;
  if (cacheUrl.includes('.json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  const fetchEndTime = performance.now();
  perfTimes.fetch = Math.round(fetchEndTime - fetchStartTime);

  const parsedCache = parseFn(data, perfTimes, orgName);
  perfTimes.parseCache = Math.round(performance.now() - fetchEndTime);

  return [parsedCache, perfTimes];
}
    console.time('geneCacheWorker: Ideogram');
    // console.log('in gene cache worker message handler');
    const [cacheUrl, perfTimes, debug] = event.data;
    const result = await fetchAndParse(cacheUrl, perfTimes, parseCache);
    postMessage(result);
    if (debug) {
      const size = new TextEncoder().encode(JSON.stringify(result[0])).length;
      const kiloBytes = size / 1024;
      const megaBytes = kiloBytes / 1024;
      console.log('parsed geneCache size: ' + megaBytes + ' MiB');
      console.timeEnd('geneCacheWorker: Ideogram');
    }
  });
}


const gcwUrl = URL.createObjectURL(
  new Blob([
      gcw.toString().replace(/^function .+\{?|\}$/g, '')
    ],
    {type: 'text/javascript'}
  )
);
const geneCacheWorker = new Worker(gcwUrl);
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

  if (ideo.config.debug) console.time(`${cacheName}: Ideogram`)
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
        if (ideo.config.debug) console.timeEnd(`${cacheName}: Ideogram`);
        perfTimes.total = Math.round(performance.now() - startTime);
        const preamble = 'perfTimes in init' + cacheProps.metadata + 'Cache:';
        console.log(preamble, perfTimes);
      }

      resolve();
    });
  });
}
