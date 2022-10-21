import {fetchAndParse, inspectWorker} from './cache-lib';

/** Parse an interaction cache JSON file, return array of useful transforms */
export function parseCache(rawJson, perfTimes, orgName) {
  let t0 = performance.now();
  const interactionsByName = {};
  const tmp = orgName.replace('-', ' ');
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

// Uncomment when workers work outside localhost
// addEventListener('message', async event => {
//   console.time('interactionCacheWorker');
//   const [cacheUrl, perfTimes, debug, orgName] = event.data;
//   const result = await fetchAndParse(cacheUrl, perfTimes, parseCache, orgName);
//   postMessage(result);
//   if (debug) inspectWorker('interaction', result[0]);
// });
