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

import {slug, getEarlyTaxid} from './lib';
import {organismMetadata} from './init/organism-metadata';

/** Get URL for gene cache file */
function getCacheUrl(orgName, cacheDir, ideo) {
  const organism = slug(orgName);

  if (!cacheDir) {
    const splitDataDir = ideo.config.dataDir.split('/');
    const dataIndex = splitDataDir.indexOf('data');
    const baseDir = splitDataDir.slice(0, dataIndex).join('/') + '/data/';
    cacheDir = baseDir + 'annotations/gene-cache/';
  }

  const cacheUrl = cacheDir + organism + '-big.tsv';

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

function parseEnsemblId(rawEnsemblId, orgName) {
  const metadata = parseOrgMetadata(orgName);
  return metadata.ensemblPrefix + rawEnsemblId;
}

/** Parse a gene cache TSV file, return array of useful transforms */
function parseCache(rawTsv, orgName) {
  const citedNames = [];
  const lociByName = {};
  const lociById = {};
  const preAnnots = [];

  const lines = rawTsv.split(/\r\n|\n/);

  lines.forEach((line) => {
    if (line[0] === '#' || line === '') return; // Skip headers, empty lines
    const [
      chromosome, rawStart, rawStop, rawEnsemblId, gene
    ] = line.trim().split(/\t/);
    const start = parseInt(rawStart);
    const stop = parseInt(rawStop);
    const ensemblId = parseEnsemblId(rawEnsemblId, orgName);
    preAnnots.push([chromosome, start, stop, ensemblId, gene]);
    const locus = [chromosome, start, stop];

    citedNames.push(gene);
    lociByName[gene] = locus;
    lociById[gene] = locus;
  });

  const sortedAnnots = parseAnnots(preAnnots);

  return [citedNames, lociByName, lociById, sortedAnnots];
}

/** Get organism's metadata fields */
function parseOrgMetadata(orgName) {
  const taxid = getEarlyTaxid(orgName);
  return organismMetadata[taxid];
}

/** Reports if current organism has a gene cache */
function hasGeneCache(orgName) {
  const metadata = parseOrgMetadata(orgName);
  return ('hasGeneCache' in metadata && metadata.hasGeneCache === true);
}

/**
 * Fetch cached gene data, transform it usefully, and set it as ideo prop
 */
export default async function initGeneCache(orgName, ideo, cacheDir=null) {

  if (!hasGeneCache(orgName)) {
    return; // Skip initialization if cache doesn't exist
  }

  const cacheUrl = getCacheUrl(orgName, cacheDir, ideo);

  const response = await fetch(cacheUrl);
  const data = await response.text();

  const [
    citedNames, lociByName, lociById, sortedAnnots
  ] = parseCache(data, orgName);

  ideo.geneCache = {
    citedNames, // Array of gene names, ordered by citation count
    lociByName, // Object of gene positions, keyed by gene name
    lociById,
    sortedAnnots // Ideogram annotations sorted by genomic position
  };
}
