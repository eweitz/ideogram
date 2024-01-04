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

  // Easier debuggability
  if (!ideo.cacheRangeFetch) ideo.cacheRangeFetch = cacheRangeFetch;

  if (!byteRange) return null;

  const geneDataLine = await cacheRangeFetch(
    '/dist/data/cache/tissues/homo-sapiens-tissues.tsv',
    byteRange
  );

  const tissueExpressions = [];
  const rawExpressions = geneDataLine.split('\t').slice(1);
  for (let i = 0; i < rawExpressions.length; i++) {
    const rawValues = rawExpressions[i].split(';');
    const numValues = rawValues.length;
    if (numValues === 15) {
      console.log('rawValues 14', rawValues)
      rawValues.splice(1, 0, 0); // Insert number 0 at position 1
    } else if (numValues === 14) {
      console.log('rawValues 13', rawValues)
      // Min. and Q1 are 0
      rawValues.splice(1, 0, 0);
      rawValues.splice(1, 0, 0);
    }
    const tissueId = rawValues[0];
    const boxMetrics = rawValues.slice(1, 6);
    const min = parseFloat(boxMetrics[0]);
    const q1 = parseFloat(boxMetrics[1]);
    const median = parseFloat(boxMetrics[2]);
    const q3 = parseFloat(boxMetrics[3]);
    const max = parseFloat(boxMetrics[4]);
    const quantiles = rawValues.slice(6).map(v => parseInt(v));
    const expression = {
      min, q1, median, q3, max,
      quantiles
    };
    const tissue = cache.tissueNames[tissueId];
    const color = cache.tissueColors[tissueId];
    const samples = parseInt(cache.tissueSamples[tissueId]);
    tissueExpressions.push({tissue, expression, color, samples});
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
