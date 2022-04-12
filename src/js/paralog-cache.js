/**
 * @fileoverview Fetch cached paralogs: Ensembl IDs of <= 20 paralogs per genes
 *
 * Paralog cache eliminates needing to fetch IDs of paralogs for a given gene
 * from third-party APIs at runtime.  It achieves this by fetching a static
 * file containing gene data upon initializing Ideogram.
 */

import {cacheFetch} from './gene-cache';
import {slug, getEarlyTaxid, getDir} from './lib';
import {organismMetadata} from './init/organism-metadata';
import version from './version';

let perfTimes;

/** Get URL for gene cache file */
function getCacheUrl(orgName, cacheDir) {
  const organism = slug(orgName);
  if (!cacheDir) {
    cacheDir = getDir('cache/paralogs/');
  } else {
    cacheDir += 'paralogs/';
  }

  const cacheUrl = cacheDir + organism + '-paralogs.tsv.gz';

  return cacheUrl;
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
function parseCache(rawTsv) {
  const names = [];
  const nameCaseMap = {};
  const paralogsByName = {};
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
    const columns = line.trim().split(/\t/);
    const gene = columns[0];
    const slimEnsemblIds = columns.slice(1);

    const paralogs = [];
    for (let i = 0; i < slimEnsemblIds.length; i++) {
      paralogs.push(getEnsemblId(ensemblPrefix, slimEnsemblIds[i]));
    }

    names.push(gene);
    nameCaseMap[gene.toLowerCase()] = gene;
    paralogsByName[gene] = paralogs;
  };
  const t1 = performance.now();
  perfTimes.parseCacheLoop = Math.round(t1 - t0);

  return [names, nameCaseMap, paralogsByName];
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

/**
 * Fetch cached paralog data, transform it usefully, and set it as ideo prop
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
  const data = await response.text();
  const fetchEndTime = performance.now();
  perfTimes.fetch = Math.round(fetchEndTime - fetchStartTime);

  const [names, nameCaseMap, paralogsByName] = parseCache(data, orgName);
  perfTimes.parseCache = Math.round(performance.now() - fetchEndTime);

  ideo.paralogCache = {
    names, // Names of genes with known paralogs
    nameCaseMap, // Maps of lowercase gene names to proper gene names
    paralogsByName // Array of paralog Ensembl IDs by gene name
  };
  Ideogram.paralogCache[orgName] = ideo.paralogCache;

  if (ideo.config.debug) {
    perfTimes.total = Math.round(performance.now() - startTime);
    console.log('perfTimes in initParalogCache:', perfTimes);
  }
}
