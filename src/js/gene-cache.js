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

import {slug, getEarlyTaxid, getDir} from './lib';
import {organismMetadata} from './init/organism-metadata';
import version from './version';

let perfTimes;

/** Get URL for gene cache file */
function getCacheUrl(orgName, cacheDir, ideo) {
  const organism = slug(orgName);
  console.log('in getCacheUrl, cacheDir')
  console.log(cacheDir)
  if (!cacheDir) {
    // const splitDataDir = ideo.config.dataDir.split('/');
    // const dataIndex = splitDataDir.indexOf('data');
    // const baseDir = splitDataDir.slice(0, dataIndex).join('/') + '/data/';
    // const baseDir = getDir
    cacheDir = getDir('cache/');
    console.log('in getCacheUrl, new cacheDir')
    console.log(cacheDir)
  }

  const cacheUrl = cacheDir + organism + '-genes.tsv';

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
    ] = line.trim().split(/\t/);
    const start = parseInt(rawStart);
    const stop = start + parseInt(rawLength);
    const ensemblId = getEnsemblId(ensemblPrefix, slimEnsemblId);
    preAnnots.push([chromosome, start, stop, ensemblId, gene]);
    const locus = [chromosome, start, stop];

    names.push(gene);
    nameCaseMap[gene.toLowerCase()] = gene;
    namesById[ensemblId] = gene;
    idsByName[gene] = ensemblId;
    lociByName[gene] = locus;
    lociById[ensemblId] = locus;
  };
  const t1 = performance.now();
  perfTimes.parseCacheLoop = Math.round(t1 - t0);

  const sortedAnnots = parseAnnots(preAnnots);
  perfTimes.parseAnnots = Math.round(performance.now() - t1);

  return [
    names, nameCaseMap, namesById, idsByName, lociByName, lociById,
    sortedAnnots
  ];
}

/** Get organism's metadata fields */
function parseOrgMetadata(orgName) {
  const taxid = getEarlyTaxid(orgName);
  return organismMetadata[taxid] || {};
}

/** Reports if current organism has a gene cache */
function hasGeneCache(orgName) {
  const metadata = parseOrgMetadata(orgName);
  return (metadata.hasGeneCache && metadata.hasGeneCache === true);
}

async function cacheFetch(url) {
  try {
    console.log('&&&&&& in cacheFetch, url:')
    console.log(url)
    const response = await Ideogram.cache.match(url);
    console.log('&&&&&& in cacheFetch, response:')
    console.log(response)
    if (typeof response === 'undefined') {
      console.log('&&&&&& in cacheFetch, Ideogram.cache:')
      console.log(Ideogram.cache)
      // If cache miss, then fetch and add response to cache
      try {
        // await Ideogram.cache.add(url);
        console.log('&&&&& before fetch, url:')
        console.log(url)
        const res = await fetch(url)
        console.log('&&&&& after fetch, res:')
        console.log(res)
        if (!res.ok) {
          console.log('&&&&& oops!')
          throw new TypeError('bad response status');
        }
        console.log('&&&&& after if (!res.ok) {')
        await Ideogram.cache.put(url, res);
        console.log('&&&&& after await Ideogram.cache.put(url, res);')
        return await Ideogram.cache.match(url);
      } catch (e) {
        console.log('&&&&& Failed to fetch web cache, url:')
        console.log(url)
        console.log('&&&&& Error:')
        console.log(e)
      }
      console.log('&&&&&& in cacheFetch, after Ideogram.cache.add:')
    }
    console.log('&&&&&& exiting cacheFetch:')
    return await Ideogram.cache.match(url);
  } catch (e) {
    console.log('&&&& top-level error handler, e:')
    console.log(e)
  }
}

/**
 * Fetch cached gene data, transform it usefully, and set it as ideo prop
 */
export default async function initGeneCache(orgName, ideo, cacheDir=null) {

  console.log('in initGeneCache')

  const startTime = performance.now();
  perfTimes = {};

  // Skip initialization if files needed to make cache don't exist
  if (!hasGeneCache(orgName)) return;

  console.log('!!!!!!!! in initGeneCache, after hasGeneCache')

  // Skip initialization if cache is already populated
  if (Ideogram.geneCache && Ideogram.geneCache[orgName]) {
    // Simplify chief use case, i.e. for single organism
    ideo.geneCache = Ideogram.geneCache[orgName];
    return;
  }

  if (!Ideogram.geneCache) {
    Ideogram.geneCache = {};
  }

  console.log('!!!!!!!! in initGeneCache, after !Ideogram.geneCache')

  Ideogram.cache = await caches.open(`ideogram-${version}`);

  console.log('!!!!!!!! in initGeneCache, after await caches.open')

  const cacheUrl = getCacheUrl(orgName, cacheDir, ideo);

  const fetchStartTime = performance.now();
  const response = await cacheFetch(cacheUrl);
  console.log('!!!!!!!! in initGeneCache, after cacheFetch, response:')
  console.log(response)
  const data = await response.text();
  // console.log('!!!!!!!! in initGeneCache, data:')
  // console.log(data)
  const fetchEndTime = performance.now();
  perfTimes.fetch = Math.round(fetchEndTime - fetchStartTime);

  console.log('!!!!!!!! in initGeneCache, after perfTimes.fetch')

  const [
    interestingNames, nameCaseMap, namesById, idsByName,
    lociByName, lociById, sortedAnnots
  ] = parseCache(data, orgName);
  perfTimes.parseCache = Math.round(performance.now() - fetchEndTime);

  console.log('!!!!!!!! in initGeneCache, after perfTimes.parseCache')

  ideo.geneCache = {
    interestingNames, // Array ordered by general or scholarly interest
    nameCaseMap, // Maps of lowercase gene names to proper gene names
    namesById,
    idsByName,
    lociByName, // Object of gene positions, keyed by gene name
    lociById,
    sortedAnnots // Ideogram annotations sorted by genomic position
  };
  Ideogram.geneCache[orgName] = ideo.geneCache;

  console.log('!!!!!!!! in initGeneCache, Ideogram.geneCache[orgName] = ideo.geneCache;')

  if (ideo.config.debug) {
    perfTimes.total = Math.round(performance.now() - startTime);
    console.log('perfTimes in initGeneCache:', perfTimes);
  }

  console.log('!!!!!!!! exiting initGeneCache')
}
