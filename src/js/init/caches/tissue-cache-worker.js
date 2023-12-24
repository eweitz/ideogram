import {
  fetchAndParse, getFullId, inspectWorker,
  cacheFetch, cacheRangeFetch
} from './cache-lib';


function parseTissueKeys(rawTissuesString) {
  const tissueNames = [];
  const tissueColors = [];
  const tissueSamples = [];
  rawTissuesString.split(';').forEach(entry => {
    const splitEntry = entry.split(',');
    tissueNames.push(splitEntry[0]);
    tissueColors.push(splitEntry[1]);
    tissueSamples.push(splitEntry[2]);
  });
  return [tissueNames, tissueColors, tissueSamples];
}

/** Transform a stringified list of integers into an actual list of integers */
function processIds(ids) {
  const processedIds = [];
  const splitIds = ids.split(',');
  for (let i = 0; i < splitIds.length; i++) {
    processedIds.push(parseInt(splitIds[i], 10));
  }
  return processedIds;
}

async function getTissueExpressions(gene, ideo) {
  const cache = ideo.tissueCache;
  const byteRange = cache.byteRangesByName[gene];
  if (!byteRange) return null;

  const geneDataLine = await cacheRangeFetch(
    '/dist/data/cache/tissues/homo-sapiens-tissues.tsv',
    byteRange
  );

  const tissueExpressions = [];
  const rawExpressions = geneDataLine.split('\t')[1].split(',');
  for (let i = 0; i < rawExpressions.length; i++) {
    const [tissueId, rawValue] = rawExpressions[i].split(';');
    const medianExpression = parseFloat(rawValue);
    const tissue = cache.tissueNames[tissueId];
    const color = cache.tissueColors[tissueId];
    const samples = cache.tissueSamples[tissueId];
    tissueExpressions.push({tissue, medianExpression, color, samples});
  }

  return tissueExpressions;
}

/** Parse a tissue cache TSV file */
export function parseTissueCache(rawTsv, perfTimes, byteRangesByName) {
  let tissueNames;
  let tissueColors;
  let tissueSamples;

  let t0 = performance.now();
  const lines = rawTsv.split(/\r\n|\n/);
  perfTimes.rawTsvSplit = Math.round(performance.now() - t0);

  t0 = performance.now();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === '') continue; // Skip empty lines
    if (line[0] === '#') {
      if (line.slice(0, 10) === '## tissues') {
        const parsedTissueKeys = parseTissueKeys(line.split('tissues: ')[1]);
        [tissueNames, tissueColors, tissueSamples] = parsedTissueKeys;
      }
      continue;
    }

  };
  const t1 = performance.now();
  perfTimes.parseCacheLoop = Math.round(t1 - t0);

  return {
    getTissueExpressions,
    byteRangesByName,
    tissueNames,
    tissueColors,
    tissueSamples
  };
}

// Uncomment when workers work outside localhost
// addEventListener('message', async event => {
//   console.time('tissueCacheWorker');
//   const [cacheUrl, perfTimes, debug] = event.data;
//   const result = await fetchAndParse(cacheUrl, perfTimes, parseCache);
//   postMessage(result);
//   if (debug) inspectWorker('paralog', result[0]);
// });