import {d3} from '../lib';
import {
  esearch, esummary, elink, getAssemblySearchUrl
} from './eutils-config.js';
import {
  getTaxids, getOrganismFromEutils
} from './organisms.js';

/**
 * Get a URL to ESearch the NCBI Nucleotide DB for an Assembly UID
 */
function getESearchUrlForChromosomes(asmUid, ideo) {
  var qs;

  // Get a list of IDs for the chromosomes in this genome.
  //
  // Query chromosomes sequences in Nucleotide DB (nuccore) via
  // Assembly DB E-Utils link.
  qs = ('&db=nuccore&dbfrom=assembly&linkname=assembly_nuccore&' +
    'cmd=neighbor_history&from_uid=' + asmUid);

  return d3.json(ideo.elink + qs)
    .then(function(data) {
      var webenv = data.linksets[0].webenv;
      qs =
        '&db=nuccore' +
        '&term=%231+AND+%28' +
          'sequence_from_chromosome[Properties]+OR+' +
          'sequence_from_plastid[Properties]+OR+' +
          'sequence_from_mitochondrion[Properties]%29' +
        '&WebEnv=' + webenv + '&usehistory=y&retmax=1000';
      return ideo.esearch + qs;
    });
}

/**
 * Request basic data on a list of chromosome IDs from ESearch
 */
function fetchNucleotideSummary(data, ideo) {
  var ids, ntSummary;
  ids = data.esearchresult.idlist.join(',');
  ntSummary = ideo.esummary + '&db=nucleotide&id=' + ids;
  return d3.json(ntSummary);
}

/**
 * Get name and type for mitochondrial chromosome
 *
 * See example of "MT" in yeast:
 * https://eweitz.github.io/ideogram/eukaryotes?org=saccharomyces-cerevisiae
 */
function parseMitochondrion(result, ideo) {
  var type, cnIndex, chrName;

  if (ideo.config.showNonNuclearChromosomes) {
    type = result.genome;
    cnIndex = result.subtype.split('|').indexOf('plasmid');
    if (cnIndex === -1) {
      chrName = 'MT';
    } else {
      // Seen in e.g. rice genome IRGSP-1.0 (GCF_001433935.1),
      // From https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?retmode=json&db=nucleotide&id=996703432,996703431,996703430,996703429,996703428,996703427,996703426,996703425,996703424,996703423,996703422,996703421,194033210,11466763,7524755
      // genome: 'mitochondrion',
      // subtype: 'cell_line|plasmid',
      // subname: 'A-58 CMS|B1',
      chrName = result.subname.split('|')[cnIndex];
    }
  } else {
    return [null, null];
  }

  return [chrName, type];
}

/**
 * Get name and type for chloroplastic chromosome.
 *
 * Plants have chloroplasts.  See e.g. green algae:
 * https://eweitz.github.io/ideogram/eukaryotes?org=micromonas-commoda
 */
function parseChloroplastOrPlastid(ideo) {
  // Plastid encountered with rice genome IRGSP-1.0 (GCF_001433935.1)
  if (ideo.config.showNonNuclearChromosomes) {
    return ['CP', 'chloroplast'];
  }
  return [null, null];
}

/**
 * Get name and type for apicoplast chromosome
 *
 * Plasmodium falciparum (malaria parasite) has such a chromosome, see e.g.:
 * https://eweitz.github.io/ideogram/eukaryotes?org=plasmodium-falciparum
 */
function parseApicoplast(ideo) {
  if (ideo.config.showNonNuclearChromosomes) {
    return ['AP', 'apicoplast'];
  }
  return [null, null];
}

/**
 * Get name and type for nuclear chromosome
 *
 * These are typical chromosomes, like chromosome 1.
 */
function parseNuclear(result) {
  var type, cnIndex, chrName;

  type = 'nuclear';
  cnIndex = result.subtype.split('|').indexOf('chromosome');
  chrName = result.subname.split('|')[cnIndex];

  if (typeof chrName !== 'undefined' && chrName.substr(0, 3) === 'chr') {
    // Convert "chr12" to "12", e.g. for banana (GCF_000313855.2)
    chrName = chrName.substr(3);
  }

  return [chrName, type];
}

/**
 * Get name and type of any chromosome object from NCBI Nucleotide ESummary
 */
function getChrNameAndType(result, ideo) {
  var genome = result.genome;
  if (genome === 'mitochondrion') {
    return parseMitochondrion(result, ideo);
  } else if (genome === 'chloroplast' || genome === 'plastid') {
    return parseChloroplastOrPlastid(ideo);
  } else if (genome === 'apicoplast') {
    return parseApicoplast(ideo);
  } else {
    return parseNuclear(result);
  }
}

function parseChromosome(result, ideo) {
  var chrName, type, chromosome;

  [chrName, type] = getChrNameAndType(result, ideo);

  chromosome = {
    name: chrName,
    length: result.slen,
    type: type
  };

  return chromosome;
}

function parseChromosomes(results, taxid, ideo) {
  var x, chromosome, seenChrId, maxLength,
    seenChrs = {},
    chromosomes = [];

  for (x in results) {
    // omit list of result uids
    if (x === 'uids') continue;

    chromosome = parseChromosome(results[x], ideo);
    seenChrId = chromosome.name + '_' + chromosome.length;
    if (chromosome.type !== null && seenChrId in seenChrs === false) {
      // seenChrs accounts for duplicate chromosomes seen with
      // pig (Sus scrofa), likely GenBank and RefSeq copies.
      chromosomes.push(chromosome);
    }

    seenChrs[seenChrId] = 1;
  }

  chromosomes = chromosomes.sort(Ideogram.sortChromosomes);

  maxLength = {bp: 0, iscn: 0};
  chromosomes.forEach(chr => {
    if (chr.length > maxLength.bp) maxLength.bp = chr.length;
  });
  ideo.maxLength[taxid] = maxLength;

  ideo.coordinateSystem = 'bp';

  return chromosomes;
}

/**
 * Request ESummary data from an ESearch on a genome assembly
 */
function fetchAssemblySummary(data, ideo) {
  var asmUid, asmSummaryUrl;

  // NCBI Assembly database's internal identifier (uid) for this assembly
  asmUid = data.esearchresult.idlist[0];
  asmSummaryUrl = ideo.esummary + '&db=assembly&id=' + asmUid;

  return d3.json(asmSummaryUrl);
}

/**
 * Returns assembly accession, as well as names and lengths of chromosomes for
 * an organism's best-known genome assembly, or for a specified assembly.
 *
 * Gets data from NCBI EUtils web API.
 *
 * @param callback Function to call upon completion of this async method
 */
function getAssemblyAndChromosomesFromEutils(taxid, callback) {
  var assemblyAccession,
    ideo = this;

  // Search for assembly, then
  // get summary of that assembly, then
  // get search URL for chromosomes in that assembly, then
  // get search results containing chromosome IDs, then
  // get summaries of each of those chromosome IDs, then
  // format the chromosome summaries and pass them into callback function.
  var asmSearchUrl = getAssemblySearchUrl(taxid, ideo);
  d3.json(asmSearchUrl)
    .then(function(data) { return fetchAssemblySummary(data, ideo); })
    .then(function(data) {
      var asmUid = data.result.uids[0];
      assemblyAccession = data.result[asmUid];
      return getESearchUrlForChromosomes(asmUid, ideo);
    }).then(function(esearchUrl) { return d3.json(esearchUrl); })
    .then(function(data) { return fetchNucleotideSummary(data, ideo); })
    .then(function(data) {
      var chromosomes = parseChromosomes(data.result, taxid, ideo);
      return callback([assemblyAccession, chromosomes]);
    }, function(rejectedReason) {
      console.warn(rejectedReason);
    });
}

export {
  esearch, esummary, elink, getOrganismFromEutils,
  getTaxids, getAssemblyAndChromosomesFromEutils
};
