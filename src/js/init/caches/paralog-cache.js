/**
 * @fileoverview Fetch cached paralogs: Ensembl IDs of <= 20 paralogs per genes
 *
 * Paralog cache eliminates needing to fetch IDs of paralogs for a given gene
 * from third-party APIs at runtime.  It achieves this by fetching a static
 * file containing gene data upon initializing Ideogram.
 */

import {supportsCache, getCacheUrl} from './cache-lib';

const cacheWorker = new Worker(
  new URL('./paralog-cache-worker.js', import.meta.url),
  {type: 'module'}
);

let perfTimes;
/**
 * Fetch cached paralog data, transform it usefully, and set it as ideo prop
 */
export default async function initParalogCache(orgName, ideo, cacheDir=null) {

  const startTime = performance.now();
  perfTimes = {};

  // Skip initialization if files needed to make cache don't exist
  if (!supportsCache(orgName, 'Paralog')) return;

  // Skip initialization if cache is already populated
  if (Ideogram.paralogCache && Ideogram.paralogCache[orgName]) {
    // Simplify chief use case, i.e. for single organism
    ideo.paralogCache = Ideogram.paralogCache[orgName];
    return;
  }

  if (!Ideogram.paralogCache) {
    Ideogram.paralogCache = {};
  }

  const cacheUrl = getCacheUrl(orgName, cacheDir, 'paralogs');

  return new Promise(resolve => {
    // console.log('before posting message');
    cacheWorker.postMessage([cacheUrl, perfTimes]);
    // console.log('Message posted to paralogCacheWorker');

    cacheWorker.addEventListener('message', event => {
      let paralogsByName;
      [paralogsByName, perfTimes] = event.data;
      ideo.paralogCache = {
        paralogsByName // Array of paralog Ensembl IDs by (uppercase) gene name
      };
      Ideogram.paralogCache[orgName] = ideo.paralogCache;

      if (ideo.config.debug) {
        perfTimes.total = Math.round(performance.now() - startTime);
        console.log('perfTimes in initParalogCache:', perfTimes);
      }

      resolve();
    });
  });
}


// idsMissingLocations = []
// // ideogram.geneCache.interestingNames.slice(0, 50).forEach(iGene => {
//     seekGene = 'CDK1'
//     // seekGene = iGene;
//     // pIndex = 12600
//     console.log(seekGene)
//     let pgenes = Object.entries(ideogram.paralogCache.paralogsByName).map(([k, v]) => [k, v]).sort((a, b) => b[1].length - a[1].length)
//     pgenes = pgenes.filter(pg => pg[0].slice(0, 3) !== 'RNU');
//     pgenenames = pgenes.map(pg => pg[0])
//     pIndex = pgenenames.indexOf(seekGene)
//     // if (pIndex === -1) return;
//     pids = pgenes[pIndex][1];
//     pnames = pids.map(id => ideogram.geneCache.namesById[id]);
//     console.log('pids', pids)
//     const indicesMissingLocations = []
//     plocs = pids.filter((id, i) => {
//         const hasLoc = id in ideogram.geneCache.lociById
//         if (!hasLoc) {
//             idsMissingLocations.push(id)
//             indicesMissingLocations.push(i)
//         }
//         return hasLoc
//     }).map(id => ideogram.geneCache.lociById[id].join(':'));
//     pnl = pnames.filter((_, i) => i in indicesMissingLocations === false).map((n, i) => n + ': ' + plocs[i]);
//     gene = pgenenames[pIndex]
//     // console.log('pnl before')
//     // console.log(pnl)
//     pnl.sort((a, b) => {
//         const [aChr, aStart] = a.split(':').slice(1).map(p => p.trim())
//         const [bChr, bStart] = b.split(':').slice(1).map(p => p.trim())
//         chrSort = Ideogram.sortChromosomes(aChr, bChr)
//         // console.log(aChr, bChr, chrSort)
//         if (chrSort !== 0) return chrSort
//         return aStart.localeCompare(bStart, 'en', {numeric: true});
//     })
//     console.log(seekGene, pnl.length)
//     console.log('numParalogs: ' + pgenes.length)
//     ideogram.plotRelatedGenes(gene)
//     console.log(pnl)
// // })
