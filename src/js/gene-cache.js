/**
 * @fileoverview Fetch cached gene data: name, position, etc.
 */

import {slug} from './lib'

/** Get URL for gene cache file */
function getCacheUrl(orgName, cacheDir, ideo) {
  const organism = slug(orgName);

  if (!cacheDir) {
    const splitDataDir = ideo.config.dataDir.split('/');
    const dataIndex = splitDataDir.indexOf('data');
    const baseDir = splitDataDir.slice(0, dataIndex).join('/') + '/data/';
    cacheDir = baseDir + 'annotations/gene-cache/';
  }

  const cacheUrl = cacheDir + organism + '.tsv';

  return cacheUrl;
}

function parseCache(rawTsv) {
  const citedNames = [];
  const lociByName = {};

  const lines = rawTsv.split(/\r\n|\n/);

  lines.forEach((line) => {
    if (line[0] === '#') return;
    const {gene, chromosome, start} = line.split(/\t/);

    citedNames.push(gene);
    lociByName[gene] = [chromosome, start];
  });

  return citedNames, lociByName;
}

/**
 * Fetch cached gene data, transform it usefully, and set it as ideo prop
 */
export default async function initGeneCache(orgName, cacheDir=null, ideo) {
  const cacheUrl = getCacheUrl(orgName, cacheDir, ideo);

  const response = await fetch(cacheUrl);
  const data = await response.text();

  const [citedNames, lociByName] = parseCache(data);

  ideo.geneCache = {
    citedNames, // Array of gene names, ordered by citation count
    lociByName // Object of gene positions, keyed by gene name
  };
}
