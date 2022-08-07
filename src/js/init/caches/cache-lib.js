import {decompressSync, strFromU8} from 'fflate';

import version from '../../version';
import {getEarlyTaxid} from '../../lib';
import {organismMetadata} from '../organism-metadata';

/**
 * Build full Ensembl ID from prefix (e.g. ENSG) and slim ID (e.g. 223972)
 *
 * Example output ID: ENSG00000223972
 * */
export function getEnsemblId(ensemblPrefix, slimEnsemblId) {

  // C. elegans (prefix: WBGene) has special IDs, e.g. WBGene00197333
  const padLength = ensemblPrefix === 'WBGene' ? 8 : 11;

  // Zero-pad the slim ID, e.g. 223972 -> 00000223972
  const zeroPaddedId = slimEnsemblId.padStart(padLength, '0');

  return ensemblPrefix + zeroPaddedId;
}

export async function cacheFetch(url) {

  const cache = await caches.open(`ideogram-${version}`);

  const decompressedUrl = url.replace('.gz', '');
  const response = await cache.match(decompressedUrl);
  if (typeof response === 'undefined') {
    // If cache miss, then fetch and add response to cache
    // await Ideogram.cache.add(url);
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
