/**
 * @fileoverview Fetch cached gene data: name, position, etc.
 *
 * Gene cache eliminates needing to fetch names and positions of genes from
 * third-party APIs at runtime.  It achieves this by fetching a static file
 * containing gene data upon initializing Ideogram.
 *
 * Use cases:
 *
 * - test if a given string is a gene name, e.g. for gene search
 * - find genomic position of a given gene (or all genes)
 */

import {parseOrgMetadata, getCacheUrl} from './cache-lib';

const cacheWorker = new Worker(
  new URL('./gene-cache-worker.js', import.meta.url),
  {type: 'module'}
);

let perfTimes;


/** Reports if current organism has gene cache support */
function hasGeneCacheSupport(orgName) {
  const metadata = parseOrgMetadata(orgName);
  return (metadata.hasGeneCache && metadata.hasGeneCache === true);
}

/**
 * Fetch cached gene data, transform it usefully, and set it as ideo prop
 */
export default async function initGeneCache(orgName, ideo, cacheDir=null) {

  const startTime = performance.now();
  perfTimes = {};

  let parsedCache;

  // Skip initialization if files needed to make cache don't exist
  if (!hasGeneCacheSupport(orgName)) return;

  // Skip initialization if cache is already populated
  if (Ideogram.geneCache && Ideogram.geneCache[orgName]) {
    // Simplify chief use case, i.e. for single organism
    ideo.geneCache = Ideogram.geneCache[orgName];
    return;
  }

  if (!Ideogram.geneCache) {
    Ideogram.geneCache = {};
  }

  const cacheUrl = getCacheUrl(orgName, cacheDir, 'genes');

  // console.log('before posting message');
  cacheWorker.postMessage([cacheUrl, perfTimes]);
  // console.log('Message posted to geneCacheWorker');
  cacheWorker.addEventListener('message', event => {
    // console.log('Received message from worker')
    [parsedCache, perfTimes] = event.data;
    const [
      interestingNames, nameCaseMap, namesById, fullNamesById,
      idsByName, idsByFullName, lociByName, lociById, sortedAnnots
    ] = parsedCache;

    ideo.geneCache = {
      interestingNames, // Array ordered by general or scholarly interest
      nameCaseMap, // Maps of lowercase gene names to proper gene names
      namesById,
      fullNamesById,
      idsByName,
      idsByFullName,
      lociByName, // Object of gene positions, keyed by gene name
      lociById,
      sortedAnnots // Ideogram annotations sorted by genomic position
    };
    Ideogram.geneCache[orgName] = ideo.geneCache;

    if (ideo.config.debug) {
      perfTimes.total = Math.round(performance.now() - startTime);
      console.log('perfTimes in initGeneCache:', perfTimes);
    }
  });
}
