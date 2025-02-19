/** @fileoverview Functions used by multiple content-specific cache modules */

import {decompressSync, strFromU8} from 'fflate';
import {createPartialResponse} from 'workbox-range-requests';

import version from '../../version';
import {getEarlyTaxid, slug, getDir} from '../../lib';
import {organismMetadata} from '../organism-metadata';

async function fetchByteRangesByName(url) {
  const byteRangesByName = {};

  const path = `${url.replace('.tsv.gz', '')}.tsv.li.gz`;

  const response = await cacheFetch(path);
  const text = await response.text();
  const lines = text.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const [gene, rawOffset] = lines[i].split('\t');
    if (gene[0] === '#') continue;
    const offset = parseInt(rawOffset);
    const offsetEnd = parseInt(lines[i + 1].split('\t')[1]);
    byteRangesByName[gene] = [offset, offsetEnd];
  }

  return byteRangesByName;
}

async function fetchVariantByteRangesByName(text) {
  const byteRangesByName = {};

  const lines = text.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const [gene, rawOffset, rawLength] = lines[i].split('\t');
    if (gene[0] === '#') continue;
    const offset = parseInt(rawOffset);
    const offsetEnd = offset + parseInt(rawLength);
    byteRangesByName[gene] = [offset, offsetEnd];
  }

  return byteRangesByName;
}

/** Reports if current organism has a gene structure cache */
export function supportsCache(orgName, cacheName) {
  const metadata = parseOrgMetadata(orgName);
  const cacheProp = 'has' + cacheName + 'Cache';
  return metadata[cacheProp] && metadata[cacheProp] === true;
}

/** Get URL for given type of cache file (e.g. gene, tissue, variant) */
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


async function getServiceWorkerCache() {
  const currentIdeogram = `ideogram-${version}`;

  // Delete other versions of Ideogram cache; there should be 1 per dodmain
  const cacheNames = await caches.keys();
  cacheNames.forEach(name => {
    if (name.startsWith('ideogram-') && name !== currentIdeogram) {
      caches.delete(name);
    }
  });

  const cache = await caches.open(currentIdeogram);

  return cache;
}

export async function cacheFetch(url) {

  const cache = await getServiceWorkerCache();
  window.ideoCache = cache;
  window.createPartialResponse = createPartialResponse;

  const decompressedUrl = url.replace('.gz', '');
  const response = await cache.match(decompressedUrl);
  if (typeof response === 'undefined') {
    // If cache miss, then fetch, decompress, and put response in cache
    const rawResponse = await fetch(url);
    const blob = await rawResponse.blob();
    const uint8Array = new Uint8Array(await blob.arrayBuffer());
    const data = strFromU8(decompressSync(uint8Array));
    const contentLength = data.length;
    const decompressedResponse = new Response(
      new Blob([data], {type: 'text/tab-separated-values'}),
      {headers: new Headers({'Content-Length': contentLength})}
    );
    await cache.put(decompressedUrl, decompressedResponse);
    return await cache.match(decompressedUrl);
  }
  return await cache.match(decompressedUrl);
}

export async function cacheRangeFetch(url, byteRange) {
  // console.log('url', url)
  url = url.replace('.gz', '');

  // +/- 1 to trim newlines
  const rangeStart = byteRange[0] + 1;
  const rangeEnd = byteRange[1] - 1;

  const headers = new Headers({
    'content-type': 'multipart/byteranges',
    'range': `bytes=${rangeStart}-${rangeEnd}`
  });

  const request = new Request(url, {headers});

  const cache = await getServiceWorkerCache();

  const fullResponse = await cache.match(request);
  const partialResponse = await createPartialResponse(request, fullResponse);

  const text = await partialResponse.text();

  return text;
}

window.cacheRangeFetch = cacheRangeFetch;

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

  let parsedCache;
  if (cacheUrl.includes('tissue')) {
    const byteRangesByName = await fetchByteRangesByName(cacheUrl);
    parsedCache = parseFn(data, perfTimes, byteRangesByName);
  } else if (cacheUrl.includes('variant')) {
    const variantsTsvPath = cacheUrl.replace('.li', '');
    await cacheFetch(variantsTsvPath);
    const byteRangesByName = await fetchVariantByteRangesByName(data);
    parsedCache = parseFn(data, perfTimes, byteRangesByName);
  } else {
    parsedCache = parseFn(data, perfTimes, orgName);
  }

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
