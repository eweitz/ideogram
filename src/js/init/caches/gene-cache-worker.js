import {fetchAndParse, getFullId, inspectWorker} from './cache-lib';

/**
 * Convert pre-annotation arrays to annotation objects
 * sorted by genomic position.
 */
function parseAnnots(preAnnots) {
  const chromosomes = {};

  for (let i = 0; i < preAnnots.length; i++) {
    const [chromosome, start, stop, ensemblId, gene] = preAnnots[i];

    if (!(chromosome in chromosomes)) {
      chromosomes[chromosome] = {chr: chromosome, annots: []};
    } else {
      const annot = {name: gene, start, stop, ensemblId};
      chromosomes[chromosome].annots.push(annot);
    }
  }

  const annotsSortedByPosition = {};

  Object.entries(chromosomes).forEach(([chr, annotsByChr]) => {
    annotsSortedByPosition[chr] = {
      chr,
      annots: annotsByChr.annots.sort((a, b) => a.start - b.start)
    };
  });

  return annotsSortedByPosition;
}

/** Parse a gene cache TSV file, return array of useful transforms */
export function parseGeneCache(rawTsv, perfTimes) {
  const names = [];
  const nameCaseMap = {};
  const namesById = {};
  const fullNamesById = {};
  const idsByName = {};
  const lociByName = {};
  const lociById = {};
  const preAnnots = [];
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
    const [
      chromosome, rawStart, rawLength, slimEnsemblId, gene
      , rawFullName
    ] = line.trim().split(/\t/);
    const fullName = decodeURIComponent(rawFullName);
    const start = parseInt(rawStart);
    const stop = start + parseInt(rawLength);
    const ensemblId = getFullId(ensemblPrefix, slimEnsemblId);
    preAnnots.push([chromosome, start, stop, ensemblId, gene, fullName]);
    const locus = [chromosome, start, stop];

    names.push(gene);
    nameCaseMap[gene.toLowerCase()] = gene;
    namesById[ensemblId] = gene;
    fullNamesById[ensemblId] = fullName;
    idsByName[gene] = ensemblId;
    lociByName[gene] = locus;
    lociById[ensemblId] = locus;
  };
  const t1 = performance.now();
  perfTimes.parseCacheLoop = Math.round(t1 - t0);

  // const sortedAnnots = parseAnnots(preAnnots);
  perfTimes.parseAnnots = Math.round(performance.now() - t1);

  return [
    names, nameCaseMap, namesById,
    fullNamesById,
    idsByName, lociByName, lociById
    // , sortedAnnots
  ];
}

// Uncomment when workers work outside localhost
// addEventListener('message', async event => {
//   console.time('geneCacheWorker');
//   // console.log('in gene cache worker message handler');
//   const [cacheUrl, perfTimes, debug] = event.data;
//   const result = await fetchAndParse(cacheUrl, perfTimes, parseCache);
//   postMessage(result);
//   if (debug) inspectWorker('gene', result[0]);
// });
