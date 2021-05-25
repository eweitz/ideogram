/**
 * @fileoverview Fetch cached gene data: name, position, etc.
 *
 * Gene cache eliminates needing to fetch names and positions of genes.
 *
 * Use cases:
 *
 * - test if a given string is a gene name, e.g. for gene search
 * - find genomic position of a given gene (or all genes)
 *
 */

import {slug} from './lib';

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

/**
 * Convert array of [chr, start, gene] arrays to Ideogram annotations
 * sorted by genomic position.
 */
function parseAnnots(chrStartGenes) {
  const chromosomes = {};

  chrStartGenes.forEach(([chromosome, start, gene]) => {
    if (!(chromosome in chromosomes)) {
      chromosomes[chromosome] = {chr: chromosome, annots: []};
    } else {
      chromosomes[chromosome].annots.push({name: gene, start})
    }
  });

  const annotsSortedByPosition = {};

  Object.entries(chromosomes).forEach(([chr, annotsByChr]) => {
    annotsSortedByPosition[chr] = {
      chr,
      annots: annotsByChr.annots.sort((a, b) => a.start - b.start)
    };
  });

  return annotsSortedByPosition;
}

function parseCache(rawTsv) {
  const citedNames = [];
  const lociByName = {};
  const chrStartGenes = [];

  const lines = rawTsv.split(/\r\n|\n/);

  lines.forEach((line) => {
    if (line[0] === '#' || line === '') return; // Skip headers, empty lines
    const [chromosome, rawStart, gene] = line.split(/\t/);
    const start = parseInt(rawStart);
    chrStartGenes.push([chromosome, start, gene]);

    citedNames.push(gene);
    lociByName[gene] = [chromosome, start];
  });

  const sortedAnnots = parseAnnots(chrStartGenes);

  return [citedNames, lociByName, sortedAnnots];
}

/**
 * Fetch cached gene data, transform it usefully, and set it as ideo prop
 */
export default async function initGeneCache(orgName, ideo, cacheDir=null) {
  const cacheUrl = getCacheUrl(orgName, cacheDir, ideo);

  const response = await fetch(cacheUrl);
  const data = await response.text();

  console.log('data', data)

  const [citedNames, lociByName, sortedAnnots] = parseCache(data);

  ideo.geneCache = {
    citedNames, // Array of gene names, ordered by citation count
    lociByName, // Object of gene positions, keyed by gene name
    sortedAnnots // Ideogram annotations sorted by genomic position
  };
}
