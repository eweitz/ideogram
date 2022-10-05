import {fetchAndParse, inspectWorker} from './cache-lib';

/** Parse metainformation header lines, i.e. those beginning  "## "" */
function parseMetainformationHeader(line) {
  const splitHead = line.split(' keys: ');
  if (splitHead.length < 2) return [null];
  const metaHeader = splitHead[0].split('## ')[1];
  const keys = {};
  splitHead[1].split(', ').forEach(entry => {
    const splitEntry = entry.split(' = ');
    keys[splitEntry[0]] = splitEntry[1];
  });
  return [metaHeader, keys];
}

/** Parse a gene structure cache TSV file, return array of useful transforms */
export function parseCache(rawTsv, perfTimes) {
  const featuresByChr = {};

  let t0 = performance.now();
  const lines = rawTsv.split(/\r\n|\n/);
  perfTimes.rawTsvSplit = Math.round(performance.now() - t0);

  let biotypeKeys, featureTypeKeys;

  featureTypeKeys = [
    'Enhancer', 'TF binding', 'CTCF binding site',
    'Open chromatin', 'Promoter'
  ];

  t0 = performance.now();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === '') continue; // Skip empty lines

    // Parse header
    if (line[0] === '#') {
      // Parse metainformation headers
      if (line[1] === '#') {
        const [metaHeader, keys] = parseMetainformationHeader(line);
        if (metaHeader === 'biotype') {
          biotypeKeys = keys;
        } else if (metaHeader === 'feature') {
          featureTypeKeys = keys;
        }
      }
      continue;
    }
    const splitLine = line.trim().split(/\t/);

    const rawFeature = splitLine;

    const featureType = featureTypeKeys[parseInt(rawFeature[0])];
    const chr = rawFeature[1];
    const start = parseInt(rawFeature[2]);
    const length = parseInt(rawFeature[3]);
    const feature = [featureType, start, length];

    if (chr in featuresByChr) {
      featuresByChr[chr].push(feature);
    } else {
      featuresByChr[chr] = [feature];
    }
  };
  const t1 = performance.now();
  perfTimes.parseCacheLoop = Math.round(t1 - t0);

  return featuresByChr;
}

// Uncomment when workers work outside localhost
// addEventListener('message', async event => {
//   console.time('geneStructureCacheWorker');
//   const [cacheUrl, perfTimes, debug] = event.data;
//   const result = await fetchAndParse(cacheUrl, perfTimes, parseCache);
//   postMessage(result);
//   if (debug) inspectWorker('geneStructure', result[0]);
// });
