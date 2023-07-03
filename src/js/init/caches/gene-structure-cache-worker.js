import {fetchAndParse, inspectWorker} from './cache-lib';

/** Parse compressed feature subparts to more easily computable format */
function deserializeSubparts(rawSubparts, subpartKeys) {
  const subparts = [];
  for (let i = 0; i < rawSubparts.length; i++) {
    const rawSubpart = rawSubparts[i].split(';');
    const keyIndex = parseInt(rawSubpart[0]);
    const subpartType =
      !isNaN(keyIndex) ? subpartKeys[keyIndex] : rawSubpart[0];
    const start = parseInt(rawSubpart[1]);
    const length = parseInt(rawSubpart[2]);
    const subpart = [subpartType, start, length];
    subparts.push(subpart);
  }
  // console.log('subparts', subparts)
  return subparts;
}

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
export function parseGeneStructureCache(rawTsv, perfTimes) {
  const featuresByGene = {};

  let t0 = performance.now();
  const lines = rawTsv.split(/\r\n|\n/);
  perfTimes.rawTsvSplit = Math.round(performance.now() - t0);

  let biotypeKeys, subpartKeys;

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
        } else if (metaHeader === 'subpart') {
          subpartKeys = keys;
        }
      }
      continue;
    }
    const splitLine = line.trim().split(/\t/);

    const [
      name, biotypeCompressed, strand
    ] = splitLine.slice(0, 3);

    const gene = name.split('-').slice(0, -1).join('-');

    const rawSubparts = splitLine.slice(3);
    const subparts = deserializeSubparts(rawSubparts, subpartKeys);

    const biotype = biotypeKeys[biotypeCompressed];

    // E.g. ACE2-201, protein_coding, -, <array of exon or UTR arrays>
    const feature = {
      name,
      biotype,
      strand,
      subparts
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
//   console.time('geneStructureCacheWorker');
//   const [cacheUrl, perfTimes, debug] = event.data;
//   const result = await fetchAndParse(cacheUrl, perfTimes, parseCache);
//   postMessage(result);
//   if (debug) inspectWorker('geneStructure', result[0]);
// });
