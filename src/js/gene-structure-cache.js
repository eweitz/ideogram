/**
 * @fileoverview Fetch cached gene structure data: transcript, subparts, etc.
 *
 * Gene structure cache eliminates needing to fetch features of genes from
 * third-party APIs at runtime.  It achieves this by fetching a static file
 * containing gene structure data upon initializing Ideogram.
 *
 * Use cases:
 *
 * - show gene's canonical Ensembl transcript, including its UTRs and exons
 */
import {decompressSync, strFromU8} from 'fflate';

import {slug, getEarlyTaxid, getDir} from './lib';
import {organismMetadata} from './init/organism-metadata';
import version from './version';

let perfTimes;

/** Get URL for gene structure cache file */
function getCacheUrl(orgName, cacheDir) {
  const organism = slug(orgName);
  if (!cacheDir) {
    cacheDir = getDir('cache/');
  }
  cacheDir += 'gene-structures/';

  const cacheUrl = cacheDir + organism + '-gene-structures.tsv.gz';

  return cacheUrl;
}

const subpartTypes = ["5'-UTR", 'exon', "3'-UTR"]

/** Parse compressed feature subparts to more easily computable format */
function deserializeSubparts(rawSubparts) {
  const subparts = [];
  for (let i = 0; i < rawSubparts.length; i++) {
    const rawSubpart = rawSubparts[i].split(';');
    const subpartType = subpartTypes[parseInt(rawSubpart[0])];
    const start = parseInt(rawSubpart[1]);
    const length = parseInt(rawSubpart[2]);
    const subpart = [subpartType, start, length];
    subparts.push(subpart);
  }
  return subparts;
}

const biotypes = ['protein coding', 'foo', 'bar']

/** Parse a gene structure cache TSV file, return array of useful transforms */
function parseCache(rawTsv) {
  const featuresByGene = {};

  let t0 = performance.now();
  const lines = rawTsv.split(/\r\n|\n/);
  perfTimes.rawTsvSplit = Math.round(performance.now() - t0);

  t0 = performance.now();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === '') continue; // Skip empty lines
    if (line[0] === '#') {
      continue;
    }
    const splitLine = line.trim().split(/\t/);

    const [
      transcriptName, biotypeCompressed, strand
    ] = splitLine.slice(0, 3);

    const gene = transcriptName.split('-').slice(0, -1).join('-');

    const rawSubparts = splitLine.slice(3);
    const subparts = deserializeSubparts(rawSubparts);

    const biotype = biotypes[biotypeCompressed];

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

/** Get organism's metadata fields */
function parseOrgMetadata(orgName) {
  const taxid = getEarlyTaxid(orgName);
  return organismMetadata[taxid] || {};
}

/** Reports if current organism has a gene structure cache */
function hasGeneStructureCache(orgName) {
  const metadata = parseOrgMetadata(orgName);
  return (
    metadata.hasGeneStructureCache &&
    metadata.hasGeneStructureCache === true
  );
}

export async function cacheFetch(url) {

  const decompressedUrl = url.replace('.gz', '');
  const response = await Ideogram.cache.match(decompressedUrl);
  if (typeof response === 'undefined') {
    // If cache miss, then fetch and add response to cache
    // await Ideogram.cache.add(url);
    const rawResponse = await fetch(url);
    const blob = await rawResponse.blob();
    const uint8Array = new Uint8Array(await blob.arrayBuffer());
    const data = strFromU8(decompressSync(uint8Array));
    const decompressedResponse = new Response(
      new Blob([data], {type: 'text/tab-separated-values'}),
      rawResponse.init
    );
    await Ideogram.cache.put(decompressedUrl, decompressedResponse);
    return await Ideogram.cache.match(decompressedUrl);
  }
  return await Ideogram.cache.match(decompressedUrl);
}

/**
* Fetch cached gene data, transform it usefully, and set it as ideo prop
*/
export default async function initGeneStructureCache(
  orgName, ideo, cacheDir=null
) {

  const startTime = performance.now();
  perfTimes = {};

  console.log('in initGeneStructureCache')
  // Skip initialization if files needed to make cache don't exist
  if (!hasGeneStructureCache(orgName)) return;

  // Skip initialization if cache is already populated
  if (Ideogram.geneStructureCache && Ideogram.geneStructureCache[orgName]) {
    // Simplify chief use case, i.e. for single organism
    ideo.geneStructureCache = Ideogram.geneStructureCache[orgName];
    return;
  }

  if (!Ideogram.geneStructureCache) {
    Ideogram.geneStructureCache = {};
  }

  Ideogram.cache = await caches.open(`ideogram-${version}`);

  const cacheUrl = getCacheUrl(orgName, cacheDir, ideo);

  const fetchStartTime = performance.now();
  const response = await cacheFetch(cacheUrl);

  const data = await response.text();
  const fetchEndTime = performance.now();
  perfTimes.fetch = Math.round(fetchEndTime - fetchStartTime);

  const featuresByGene = parseCache(data);
  perfTimes.parseCache = Math.round(performance.now() - fetchEndTime);

  ideo.geneStructureCache = featuresByGene;
  Ideogram.geneStructureCache[orgName] = ideo.geneStructureCache;

  if (ideo.config.debug) {
    perfTimes.total = Math.round(performance.now() - startTime);
    console.log('perfTimes in initGeneStructureCache:', perfTimes);
  }
}
