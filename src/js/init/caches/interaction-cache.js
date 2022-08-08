/**
 * @fileoverview Fetch cached interactions from WikiPathways
 *
 * Interactions cache eliminates needing to fetch interactions for a given gene
 * from third-party APIs at runtime.  It achieves this by fetching a static
 * file containing gene data upon initializing Ideogram.
 */

import {getCacheUrl, cacheFetch, parseOrgMetadata} from './cache-lib';
import {slug, getDir} from '../../lib';

let perfTimes;

/** Parse a gene cache TSV file, return array of useful transforms */
function parseCache(rawJson, organism) {
  let t0 = performance.now();
  const interactionsByName = {};
  const tmp = organism.replace('-', ' ');
  const desluggedOrg = tmp[0].toUpperCase() + tmp.slice(1);

  t0 = performance.now();
  for (const gene in rawJson['interactions']) {
    const ixnLists = rawJson['interactions'][gene];
    interactionsByName[gene] = {result: []};
    for (let i = 0; i < ixnLists.length; i++) {
      const compressedIxn = ixnLists[i];
      const slimPwId = compressedIxn[0];
      interactionsByName[gene].result.push({
        fields: {
          left: {values: compressedIxn[1]},
          right: {values: compressedIxn[2]}
        },
        id: 'WP' + slimPwId,
        name: rawJson['pathwayNamesById'][slimPwId],
        species: desluggedOrg
      });
    }
  }
  const t1 = performance.now();
  perfTimes.parseCacheLoop = Math.round(t1 - t0);

  return interactionsByName;
}

/** Reports if current organism has a gene cache */
export function hasinteractionCache(orgName) {
  const metadata = parseOrgMetadata(orgName);
  return (
    metadata.hasInteractionCache && metadata.hasInteractionCache === true
  );
}

/**
 * Fetch cached paralog data, transform it usefully, and set it as ideo prop
 */
export default async function initInteractionCache(
  orgName, ideo, cacheDir=null
) {

  const startTime = performance.now();
  perfTimes = {};

  // Skip initialization if files needed to make cache don't exist
  if (!hasinteractionCache(orgName)) return;

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

  const fetchStartTime = performance.now();
  const response = await cacheFetch(cacheUrl);
  const data = await response.json();
  const fetchEndTime = performance.now();
  perfTimes.fetch = Math.round(fetchEndTime - fetchStartTime);

  const interactionsByName = parseCache(data, orgName);
  perfTimes.parseCache = Math.round(performance.now() - fetchEndTime);

  ideo.interactionCache = interactionsByName;
  Ideogram.interactionCache[orgName] = ideo.interactionCache;

  if (ideo.config.debug) {
    perfTimes.total = Math.round(performance.now() - startTime);
    console.log('perfTimes in initInteractionCache:', perfTimes);
  }
}
