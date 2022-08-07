/**
 * @fileoverview Fetch cached paralogs: Ensembl IDs of <= 20 paralogs per genes
 *
 * Paralog cache eliminates needing to fetch IDs of paralogs for a given gene
 * from third-party APIs at runtime.  It achieves this by fetching a static
 * file containing gene data upon initializing Ideogram.
 */

import {cacheFetch, getEnsemblId, parseOrgMetadata} from './cache-lib';
import {slug, getEarlyTaxid, getDir} from '../../lib';
import {organismMetadata} from '../organism-metadata';
import version from '../../version';

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

/** Parse a gene cache TSV file, return array of useful transforms */
function parseCache(rawTsv) {
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
    const geneSlimId = columns[1];

    const paralogs = [];
    if (columns[2][0] === '_') {
      const pointer = columns[2].slice(1).toUpperCase();
      const paralogSuperList = paralogsByName[pointer];
      const geneId = getEnsemblId(ensemblPrefix, geneSlimId);
      for (let j = 0; j < paralogSuperList.length; j++) {
        const id = paralogSuperList[j];
        if (id !== geneId) {
          paralogs.push(id);
        }
      }
      paralogs.unshift(getEnsemblId(ensemblPrefix, columns[3]));
    } else {
      const slimEnsemblIds = columns.slice(2);
      for (let i = 0; i < slimEnsemblIds.length; i++) {
        const slimId = slimEnsemblIds[i];
        if (slimId !== geneSlimId) {
          paralogs.push(getEnsemblId(ensemblPrefix, slimId));
        }
      }
    }

    paralogsByName[gene.toUpperCase()] = paralogs;
  };
  const t1 = performance.now();
  perfTimes.parseCacheLoop = Math.round(t1 - t0);

  return paralogsByName;
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

  const paralogsByName = parseCache(data, orgName);
  perfTimes.parseCache = Math.round(performance.now() - fetchEndTime);

  ideo.paralogCache = {
    paralogsByName // Array of paralog Ensembl IDs by (uppercase) gene name
  };
  Ideogram.paralogCache[orgName] = ideo.paralogCache;

  if (ideo.config.debug) {
    perfTimes.total = Math.round(performance.now() - startTime);
    console.log('perfTimes in initParalogCache:', perfTimes);
  }
}


// idsMissingLocations = []
// // ideogram.geneCache.interestingNames.slice(0, 50).forEach(iGene => {
//     seekGene = 'CDK1'
//     // seekGene = iGene;
//     // pIndex = 12600
//     console.log(seekGene)
//     let pgenes = Object.entries(ideogram.paralogCache.paralogsByName).map(([k, v]) => [k, v]).sort((a, b) => b[1].length - a[1].length)
//     pgenes = pgenes.filter(pg => pg[0].slice(0, 3) !== 'RNU');
//     pgenenames = pgenes.map(pg => pg[0])
//     pIndex = pgenenames.indexOf(seekGene)
//     // if (pIndex === -1) return;
//     pids = pgenes[pIndex][1];
//     pnames = pids.map(id => ideogram.geneCache.namesById[id]);
//     console.log('pids', pids)
//     const indicesMissingLocations = []
//     plocs = pids.filter((id, i) => {
//         const hasLoc = id in ideogram.geneCache.lociById
//         if (!hasLoc) {
//             idsMissingLocations.push(id)
//             indicesMissingLocations.push(i)
//         }
//         return hasLoc
//     }).map(id => ideogram.geneCache.lociById[id].join(':'));
//     pnl = pnames.filter((_, i) => i in indicesMissingLocations === false).map((n, i) => n + ': ' + plocs[i]);
//     gene = pgenenames[pIndex]
//     // console.log('pnl before')
//     // console.log(pnl)
//     pnl.sort((a, b) => {
//         const [aChr, aStart] = a.split(':').slice(1).map(p => p.trim())
//         const [bChr, bStart] = b.split(':').slice(1).map(p => p.trim())
//         chrSort = Ideogram.sortChromosomes(aChr, bChr)
//         // console.log(aChr, bChr, chrSort)
//         if (chrSort !== 0) return chrSort
//         return aStart.localeCompare(bStart, 'en', {numeric: true});
//     })
//     console.log(seekGene, pnl.length)
//     console.log('numParalogs: ' + pgenes.length)
//     ideogram.plotRelatedGenes(gene)
//     console.log(pnl)
// // })
