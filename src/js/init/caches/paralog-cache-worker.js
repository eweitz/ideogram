import {fetchAndParse, getEnsemblId, inspectWorker} from './cache-lib';

/** Parse a paralog cache TSV file, return array of useful transforms */
export function parseCache(rawTsv, perfTimes) {
  const paralogsByName = {};
  let ensemblPrefix;

  let t0 = performance.now();
  const lines = rawTsv.split(/\r\n|\n/);
  perfTimes.rawTsvSplit = Math.round(performance.now() - t0);

  t0 = performance.now();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === '') continue; // Skip empty lines
    if (line[0] === '#') {
      if (line.slice(0, 9) === '## prefix') {
        ensemblPrefix = line.split('prefix: ')[1];
      }
      continue;
    }
    const columns = line.trim().split(/\t/);
    const gene = columns[0];
    const geneSlimId = columns[1];

    const paralogs = [];
    if (columns[2][0] === '_') {
      const pointer = columns[2].slice(1).toUpperCase();
      const paralogSuperList = paralogsByName[pointer];
      const geneId = getEnsemblId(ensemblPrefix, geneSlimId);
      for (let j = 0; j < paralogSuperList.length; j++) {
        const id = paralogSuperList[j];
        if (id !== geneId) {
          paralogs.push(id);
        }
      }
      paralogs.unshift(getEnsemblId(ensemblPrefix, columns[3]));
    } else {
      const slimEnsemblIds = columns.slice(2);
      for (let j = 0; j < slimEnsemblIds.length; j++) {
        const slimId = slimEnsemblIds[j];
        if (slimId !== geneSlimId) {
          paralogs.push(getEnsemblId(ensemblPrefix, slimId));
        }
      }
    }

    paralogsByName[gene.toUpperCase()] = paralogs;
  };
  const t1 = performance.now();
  perfTimes.parseCacheLoop = Math.round(t1 - t0);

  return paralogsByName;
}

// Uncomment when workers work outside localhost
// addEventListener('message', async event => {
//   console.time('paralogCacheWorker');
//   const [cacheUrl, perfTimes, debug] = event.data;
//   const result = await fetchAndParse(cacheUrl, perfTimes, parseCache);
//   postMessage(result);
//   if (debug) inspectWorker('paralog', result[0]);
// });
