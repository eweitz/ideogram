/**
 * @fileoverview Fetch cached gene data: name, position, etc.
 *
 * Gene cache eliminates needing to fetch names and positions of genes from
 * third-party APIs at runtime.  It achieves this by fetching a static file
 * containing gene data upon initializing Ideogram.
 *
 * Use cases:
 *
 * - test if a given string is a gene name, e.g. for gene search
 * - find genomic position of a given gene (or all genes)
 */
 import {decompressSync, strFromU8} from 'fflate';

import {slug, getEarlyTaxid, getDir} from './lib';
import {organismMetadata} from './init/organism-metadata';
import version from './version';

let perfTimes;

/** Get URL for gene cache file */
function getCacheUrl(orgName, cacheDir) {
  const organism = slug(orgName);
  if (!cacheDir) {
    cacheDir = getDir('cache/');
  }

  const cacheUrl = cacheDir + organism + '-genes.tsv.gz';

  return cacheUrl;
}

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

/**
 * Build full Ensembl ID from prefix (e.g. ENSG) and slim ID (e.g. 223972)
 *
 * Example output ID: ENSG00000223972
 * */
function getEnsemblId(ensemblPrefix, slimEnsemblId) {

  // C. elegans (prefix: WBGene) has special IDs, e.g. WBGene00197333
  const padLength = ensemblPrefix === 'WBGene' ? 8 : 11;

  // Zero-pad the slim ID, e.g. 223972 -> 00000223972
  const zeroPaddedId = slimEnsemblId.padStart(padLength, '0');

  return ensemblPrefix + zeroPaddedId;
}

/** Parse a gene cache TSV file, return array of useful transforms */
function parseCache(rawTsv, orgName) {
  const names = [];
  const nameCaseMap = {};
  const namesById = {};
  const fullNamesById = {};
  const idsByName = {};
  const idsByFullName = {};
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
      chromosome, rawStart, rawLength, slimEnsemblId, gene, rawFullName
    ] = line.trim().split(/\t/);
    const fullName = decodeURIComponent(rawFullName);
    const start = parseInt(rawStart);
    const stop = start + parseInt(rawLength);
    const ensemblId = getEnsemblId(ensemblPrefix, slimEnsemblId);
    preAnnots.push([chromosome, start, stop, ensemblId, gene, fullName]);
    const locus = [chromosome, start, stop];

    names.push(gene);
    nameCaseMap[gene.toLowerCase()] = gene;
    namesById[ensemblId] = gene;
    fullNamesById[ensemblId] = fullName;
    idsByName[gene] = ensemblId;
    idsByFullName[fullName] = ensemblId;
    lociByName[gene] = locus;
    lociById[ensemblId] = locus;
  };
  const t1 = performance.now();
  perfTimes.parseCacheLoop = Math.round(t1 - t0);

  const sortedAnnots = parseAnnots(preAnnots);
  perfTimes.parseAnnots = Math.round(performance.now() - t1);

  return [
    names, nameCaseMap, namesById, fullNamesById,
    idsByName, idsByFullName, lociByName, lociById,
    sortedAnnots
  ];
}

/** Get organism's metadata fields */
function parseOrgMetadata(orgName) {
  const taxid = getEarlyTaxid(orgName);
  return organismMetadata[taxid] || {};
}

/** Reports if current organism has a gene cache */
export function hasParalogCache(orgName) {
  const metadata = parseOrgMetadata(orgName);
  return (metadata.hasParalogCache && metadata.hasParalogCache === true);
}

async function cacheFetch(url) {
  const response = await Ideogram.cache.match(url);
  if (typeof response === 'undefined') {
    // If cache miss, then fetch and add response to cache
    // await Ideogram.cache.add(url);
    const res = await fetch(url);
    await Ideogram.cache.put(url, res);
    return await Ideogram.cache.match(url);
  }
  return await Ideogram.cache.match(url);
}

/**
 * Fetch cached gene data, transform it usefully, and set it as ideo prop
 */
export default async function initParalogCache(orgName, ideo, cacheDir=null) {

  const startTime = performance.now();
  perfTimes = {};

  // Skip initialization if files needed to make cache don't exist
  if (!hasParalogCache(orgName)) return;

  // Skip initialization if cache is already populated
  if (Ideogram.paralogCache && Ideogram.paralogCache[orgName]) {
    // Simplify chief use case, i.e. for single organism
    ideo.paralogCache = Ideogram.paralogCache[orgName];
    return;
  }

  if (!Ideogram.paralogCache) {
    Ideogram.paralogCache = {};
  }

  Ideogram.cache = await caches.open(`ideogram-${version}`);

  const cacheUrl = getCacheUrl(orgName, cacheDir, ideo);

  const fetchStartTime = performance.now();
  const response = await cacheFetch(cacheUrl);

  // const data = await response.text();

  const blob = await response.blob();
  const uint8Array = new Uint8Array(await blob.arrayBuffer());
  const data = strFromU8(decompressSync(uint8Array));
  const fetchEndTime = performance.now();
  perfTimes.fetch = Math.round(fetchEndTime - fetchStartTime);

  const [
    interestingNames, nameCaseMap, namesById, fullNamesById,
    idsByName, idsByFullName, lociByName, lociById, sortedAnnots
  ] = parseCache(data, orgName);
  perfTimes.parseCache = Math.round(performance.now() - fetchEndTime);

  ideo.paralogCache = {
    interestingNames, // Array ordered by general or scholarly interest
    nameCaseMap, // Maps of lowercase gene names to proper gene names
    namesById,
    fullNamesById,
    idsByName,
    idsByFullName,
    lociByName, // Object of gene positions, keyed by gene name
    lociById,
    sortedAnnots // Ideogram annotations sorted by genomic position
  };
  Ideogram.paralogCache[orgName] = ideo.paralogCache;

  if (ideo.config.debug) {
    perfTimes.total = Math.round(performance.now() - startTime);
    console.log('perfTimes in initParalogCache:', perfTimes);
  }
}
