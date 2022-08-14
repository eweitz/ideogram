/**
 * @fileoverview Fetch cached interactions from WikiPathways
 *
 * Interactions cache eliminates needing to fetch interactions for a given gene
 * from third-party APIs at runtime.  It achieves this by fetching a static
 * file containing gene data upon initializing Ideogram.
 */

import {getCacheUrl, supportsCache} from './cache-lib';

const cacheWorker = new Worker(
  new URL('./interaction-cache-worker.js', import.meta.url),
  {type: 'module'}
);

let perfTimes;

/**
 * Fetch cached paralog data, transform it usefully, and set it as ideo prop
 */
export default async function initInteractionCache(
  orgName, ideo, cacheDir=null
) {

  const startTime = performance.now();
  perfTimes = {};

  // Skip initialization if files needed to make cache don't exist
  if (!supportsCache(orgName, 'Interaction')) return;

  // Skip initialization if cache is already populated
  if (Ideogram.interactionCache && Ideogram.interactionCache[orgName]) {
    // Simplify chief use case, i.e. for single organism
    ideo.interactionCache = Ideogram.interactionCache[orgName];
    return;
  }

  if (!Ideogram.interactionCache) {
    Ideogram.interactionCache = {};
  }

  const cacheUrl = getCacheUrl(orgName, cacheDir, 'interactions', 'json');

  // console.log('before posting message');
  cacheWorker.postMessage([cacheUrl, perfTimes, orgName]);
  // console.log('Message posted to interaction cache worker');

  cacheWorker.addEventListener('message', event => {
    let interactionsByName;
    [interactionsByName, perfTimes] = event.data;

    ideo.interactionCache = interactionsByName;
    Ideogram.interactionCache[orgName] = ideo.interactionCache;

    if (ideo.config.debug) {
      perfTimes.total = Math.round(performance.now() - startTime);
      console.log('perfTimes in initInteractionCache:', perfTimes);
    }
  });
}
