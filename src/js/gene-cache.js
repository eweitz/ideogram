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
 * Convert pre-annotation arrays to annotation objects
 * sorted by genomic position.
 */
function parseAnnots(preAnnots) {
  const chromosomes = {};

  preAnnots.forEach(([chromosome, start, stop, ensemblId, gene]) => {
    if (!(chromosome in chromosomes)) {
      chromosomes[chromosome] = {chr: chromosome, annots: []};
    } else {
      const annot = {name: gene, start, stop, ensemblId};
      chromosomes[chromosome].annots.push(annot);
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

/** Fill out slim Ensembl ID to complete Ensembl gene ID */
function fillEnsemblId(slimEnsemblId, orgName) {
  const metadata = parseOrgMetadata(orgName);
  return metadata.ensemblPrefix + slimEnsemblId;
}

/** Parse a gene cache TSV file, return array of useful transforms */
function parseCache(rawTsv, orgName) {
  const names = [];
  const namesById = {};
  const idsByName = {};
  const lociByName = {};
  const lociById = {};
  const preAnnots = [];

  const lines = rawTsv.split(/\r\n|\n/);

  lines.forEach((line) => {
    if (line[0] === '#' || line === '') return; // Skip headers, empty lines
    const [
      chromosome, rawStart, rawStop, slimEnsemblId, gene
    ] = line.trim().split(/\t/);
    const start = parseInt(rawStart);
    const stop = parseInt(rawStop);
    const ensemblId = fillEnsemblId(slimEnsemblId, orgName);
    preAnnots.push([chromosome, start, stop, ensemblId, gene]);
    const locus = [chromosome, start, stop];

    names.push(gene);
    namesById[ensemblId] = gene;
    idsByName[gene] = ensemblId;
    lociByName[gene] = locus;
    lociById[ensemblId] = locus;
  });

  const sortedAnnots = parseAnnots(preAnnots);

  return [names, namesById, idsByName, lociByName, lociById, sortedAnnots];
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
    citedNames, namesById, idsByName, lociByName, lociById, sortedAnnots
  ] = parseCache(data, orgName);

  ideo.geneCache = {
    citedNames, // Array of gene names, ordered by citation count
    namesById,
    idsByName,
    lociByName, // Object of gene positions, keyed by gene name
    lociById,
    sortedAnnots // Ideogram annotations sorted by genomic position
  };
}
