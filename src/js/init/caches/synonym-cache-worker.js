import {fetchAndParse, inspectWorker} from './cache-lib';

/** Parse synonym cache TSV data, return array of useful transforms */
export function parseCache(rawTsv, perfTimes) {
  const synonymsByGene = {};

  let t0 = performance.now();
  const lines = rawTsv.split(/\r\n|\n/);
  perfTimes.rawTsvSplit = Math.round(performance.now() - t0);

  t0 = performance.now();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === '' || line[0] === '#') continue; // Skip empty lines, headers

    const splitLine = line.trim().split(/\t/);

    const gene = splitLine[0];
    const synonyms = splitLine.slice(1);

    synonymsByGene[gene] = synonyms;
  };
  const t1 = performance.now();
  perfTimes.parseCacheLoop = Math.round(t1 - t0);

  return synonymsByGene;
}

// Uncomment when workers work outside localhost
// addEventListener('message', async event => {
//   console.time('geneSynonymCacheWorker');
//   const [cacheUrl, perfTimes, debug] = event.data;
//   const result = await fetchAndParse(cacheUrl, perfTimes, parseCache);
//   postMessage(result);
//   if (debug) inspectWorker('geneStructure', result[0]);
// });
