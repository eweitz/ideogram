/** @fileoverview Functions used by multiple content-specific cache modules */

import {decompressSync, strFromU8} from 'fflate';

import version from '../../version';
import {getEarlyTaxid, slug, getDir} from '../../lib';
import {organismMetadata} from '../organism-metadata';

/** Reports if current organism has a gene structure cache */
export function supportsCache(orgName, cacheName) {
  const metadata = parseOrgMetadata(orgName);
  const cacheProp = 'has' + cacheName + 'Cache';
  return metadata[cacheProp] && metadata[cacheProp] === true;
}

/** Get URL for gene structure cache file */
export function getCacheUrl(orgName, cacheDir, cacheType, fileType='tsv') {
  const organism = slug(orgName);
  if (!cacheDir) {
    cacheDir = getDir('cache/' + cacheType + '/');
  } else {
    cacheDir += cacheType + '/';
  }

  const cacheUrl =
    cacheDir + organism + '-' + cacheType + '.' + fileType + '.gz';

  return cacheUrl;
}

/**
 * Build full ID from prefix (e.g. ENSG or IPR) and slim ID (e.g. 223972)
 *
 * Example output ID: ENSG00000223972
 * */
export function getFullId(prefix, slimId, fullNumLength=11) {

  // C. elegans (prefix: WBGene) has special IDs, e.g. WBGene00197333
  if (prefix === 'WBGene') fullNumLength = 8;

  // Zero-pad the slim ID, e.g. 223972 -> 00000223972
  const zeroPaddedId = slimId.padStart(fullNumLength, '0');

  return prefix + zeroPaddedId;
}

export async function cacheFetch(url) {

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
export function parseOrgMetadata(orgName) {
  const taxid = getEarlyTaxid(orgName);
  return organismMetadata[taxid] || {};
}

/** Fetch URL from service worker cache, call given parsing function */
export async function fetchAndParse(
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

/** Print size and time of given parsed cache */
export function inspectWorker(cacheName, json) {
  const size = new TextEncoder().encode(JSON.stringify(json)).length;
  const kiloBytes = size / 1024;
  const megaBytes = kiloBytes / 1024;
  console.log(`Parsed ${cacheName}Cache size: ${megaBytes} MiB`);
  console.timeEnd(`${cacheName}CacheWorker`);
}
