import {
  fetchAndParse, getFullId, inspectWorker,
  cacheFetch, cacheRangeFetch
} from './cache-lib';


function parseTissueKeys(rawTissuesString) {
  const tissueNames = [];
  const tissueColors = [];
  rawTissuesString.split(';').forEach(nameAndColor => {
    nameAndColor = nameAndColor.split(',');
    tissueNames.push(nameAndColor[0]);
    tissueColors.push(nameAndColor[1]);
  });
  return [tissueNames, tissueColors];
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
    tissueExpressions.push({tissue, medianExpression, color});
  }

  return tissueExpressions;
}

/** Parse a tissue cache TSV file */
export function parseTissueCache(rawTsv, perfTimes, byteRangesByName) {
  const tissueIdsByName = {};
  let tissueNames;
  let tissueColors;

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
        tissueNames = parsedTissueKeys[0];
        tissueColors = parsedTissueKeys[1];
      }
      continue;
    }
    const columns = line.trim().split(/\t/);
    const [
      gene, rawTissueIds, rawTopTissueIds
    ] = columns;

    const tissueIds = processIds(rawTissueIds);
    const topTissueIds = rawTopTissueIds ? processIds(rawTopTissueIds) : [];

    tissueIdsByName[gene] = [tissueIds, topTissueIds];
  };
  const t1 = performance.now();
  perfTimes.parseCacheLoop = Math.round(t1 - t0);

  return {
    getTissueExpressions,
    byteRangesByName,
    tissueNames,
    tissueColors
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
