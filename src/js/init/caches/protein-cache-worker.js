import {fetchAndParse, inspectWorker, getFullId} from './cache-lib';

/** Parse compressed protein to more easily computable format */
function deserializeProtein(rawProtein, domainKeys) {
  const domains = [];
  for (let i = 0; i < rawProtein.length; i++) {
    const rawDomain = rawProtein[i].split(';');
    // const domainID = getFullId('IPR', rawDomain[0], 6);
    const domainName = domainKeys[rawDomain[0]];
    const start = parseInt(rawDomain[1]);
    const length = parseInt(rawDomain[2]);
    const domain = [domainName, start, length];
    domains.push(domain);
  }
  return domains;
}

/** Parse metainformation header lines, i.e. those beginning  "## "" */
function parseMetainformationHeader(line) {
  const splitHead = line.split(' keys: ');
  if (splitHead.length < 2) return [null];
  const metaHeader = splitHead[0].split('## ')[1];
  const keys = {};
  splitHead[1].split('; ').forEach(entry => {
    const splitEntry = entry.split(' = ');
    keys[splitEntry[0]] = splitEntry[1];
  });
  return [metaHeader, keys];
}

/** Parse a protein cache TSV file, return array of useful transforms */
export function parseCache(rawTsv, perfTimes) {
  const featuresByGene = {};

  let t0 = performance.now();
  const lines = rawTsv.split(/\r\n|\n/);
  perfTimes.rawTsvSplit = Math.round(performance.now() - t0);

  let domainKeys;

  t0 = performance.now();

  let gene = null;
  let refTxBaseNum;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === '') continue; // Skip empty lines

    // Parse header
    if (line[0] === '#') {

      // Parse metainformation headers
      if (line[1] === '#') {
        const [metaHeader, keys] = parseMetainformationHeader(line);
        if (metaHeader === 'domain') {
          domainKeys = keys;
        }
      }
      continue;
    }
    const splitLine = line.trim().split(/\t/);

    let transcriptName = splitLine[0];
    if (isNaN(transcriptName)) {
      const splitTxName = transcriptName.split('-');
      const txNum = splitTxName.slice(-1)[0]; // e.g. 208 in ACE2-208
      const highestDigit = parseInt(txNum[0]); // e.g. 2 in 208
      const numDigits = txNum.length;
      refTxBaseNum = highestDigit * (10 ** (numDigits - 1));
      gene = splitTxName.slice(0, -1).join('-');
    } else {
      transcriptName = refTxBaseNum + parseInt(transcriptName);
      transcriptName = gene + '-' + transcriptName;
    }

    const rawProtein = splitLine.slice(1);
    const protein = deserializeProtein(rawProtein, domainKeys);

    // E.g. ACE2-201, <array of proteins <protein name, protein ID, start, length>>
    const feature = {
      transcriptName,
      protein
    };

    if (gene in featuresByGene) {
      featuresByGene[gene].push(feature);
    } else {
      featuresByGene[gene] = [feature];
    }

  };
  const t1 = performance.now();
  perfTimes.parseCacheLoop = Math.round(t1 - t0);

  return featuresByGene;
}

// Uncomment when workers work outside localhost
// addEventListener('message', async event => {
//   console.time('proteinCacheWorker');
//   const [cacheUrl, perfTimes, debug] = event.data;
//   const result = await fetchAndParse(cacheUrl, perfTimes, parseCache);
//   postMessage(result);
//   if (debug) inspectWorker('proteinStructure', result[0]);
// });
