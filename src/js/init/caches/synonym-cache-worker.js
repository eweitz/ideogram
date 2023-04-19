import {fetchAndParse, inspectWorker} from './cache-lib';

/** Parse synonym cache TSV data, return array of useful transforms */
export function parseSynonymCache(rawTsv, perfTimes) {
  const byGene = {};
  // const nameCaseMap = {};

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

    byGene[gene] = synonyms;

    // For now, initialization is JITed in related-genes.js, as use is rare.
    // nameCaseMap[gene.toLowerCase()] = synonyms.map(s => s.toLowerCase());
  };
  const t1 = performance.now();
  perfTimes.parseCacheLoop = Math.round(t1 - t0);

  return {byGene};
}

// Uncomment when workers work outside localhost
// addEventListener('message', async event => {
//   console.time('geneSynonymCacheWorker');
//   const [cacheUrl, perfTimes, debug] = event.data;
//   const result = await fetchAndParse(cacheUrl, perfTimes, parseCache);
//   postMessage(result);
//   if (debug) inspectWorker('geneStructure', result[0]);
// });
