import {fetchAndParse} from './cache-lib';

/** Parse compressed feature subparts to more easily computable format */
function deserializeSubparts(rawSubparts, subpartKeys) {
  const subparts = [];
  for (let i = 0; i < rawSubparts.length; i++) {
    const rawSubpart = rawSubparts[i].split(';');
    const subpartType = subpartKeys[parseInt(rawSubpart[0])];
    const start = parseInt(rawSubpart[1]);
    const length = parseInt(rawSubpart[2]);
    const subpart = [subpartType, start, length];
    subparts.push(subpart);
  }
  return subparts;
}

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
function parseCache(rawTsv, perfTimes) {
  const featuresByGene = {};

  let t0 = performance.now();
  const lines = rawTsv.split(/\r\n|\n/);
  perfTimes.rawTsvSplit = Math.round(performance.now() - t0);

  let biotypeKeys, subpartKeys;

  t0 = performance.now();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === '') continue; // Skip empty lines
    if (line[0] === '#') {
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
      transcriptName, biotypeCompressed, strand
    ] = splitLine.slice(0, 3);

    const gene = transcriptName.split('-').slice(0, -1).join('-');

    const rawSubparts = splitLine.slice(3);
    const subparts = deserializeSubparts(rawSubparts, subpartKeys);

    const biotype = biotypeKeys[biotypeCompressed];

    const feature = {
      transcriptName,
      biotype,
      strand,
      subparts
    };

    featuresByGene[gene] = feature;
  };
  const t1 = performance.now();
  perfTimes.parseCacheLoop = Math.round(t1 - t0);

  return featuresByGene;
}

addEventListener('message', async event => {
  // console.log('in worker message handler');
  const [cacheUrl, perfTimes] = event.data;
  const result = await fetchAndParse(cacheUrl, perfTimes, parseCache);
  postMessage(result);
});
