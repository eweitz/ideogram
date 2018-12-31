import * as d3fetch from 'd3-fetch';
import * as d3dispatch from 'd3-dispatch';

import {hasGenBankAssembly} from '../lib';
import {
  esearch, esummary, elink, getAssemblySearchUrl
} from './eutils-config.js';
import {
  getTaxidFromEutils, getTaxids, setTaxidAndAssemblyAndChromosomes,
  setTaxidData, getOrganismFromEutils
} from './organisms.js';

var d3 = Object.assign({}, d3fetch, d3dispatch);

function getNuccoreQueryString(gbUid, asmUid, recovering, ideo) {
  var qs;

  // Get a list of IDs for the chromosomes in this genome.
  //
  // If this is our first pass, or if assembly is GenBank-only, or if
  // a GenBank assembly was explicitly requested (GCA_), then query RefSeq
  // sequences in Nucleotide DB.  Otherwise, query the lesser-known
  // GenColl (Genomic Collections) DB.
  if (hasGenBankAssembly(ideo) || typeof recovering !== 'undefined') {
    // TODO: account for GenBank-only
    qs = '&db=nuccore&linkname=gencoll_nuccore_chr&from_uid=' + gbUid;
  } else {
    qs = '&db=nuccore&linkname=assembly_nuccore_refseq&from_uid=' + asmUid;
  }

  return qs;
}

function getAssemblyAndNuccoreLink(data, asmAndChrArray, recovering, ideo) {
  var assembly, qs, gbUid, nuccoreLink, asmUid;

  asmUid = data.result.uids[0];
  assembly = data.result[asmUid];
  // rsUid = assembly.rsuid; // RefSeq UID for this assembly
  gbUid = assembly.gbuid; // GenBank UID

  asmAndChrArray.push(assembly.assemblyaccession);

  qs = getNuccoreQueryString(gbUid, asmUid, recovering, ideo);
  nuccoreLink = ideo.elink + qs;

  return [asmAndChrArray, nuccoreLink];
}

/**
 *  If the list of presumed chromosomes is longer than 100 elements, then
 * we've likely fetched scaffolds instead of chromosomes.  This
 * happens with e.g. Sus scrofa (pig).  Try recovering once via a
 * different query, and throw an error upon any subsequent failure.
 */
function handleScaffoldData(data, asmAndChrArray, context) {
  var assemblyAccession = asmAndChrArray[0],
    ideo = context.ideo;
  if (data.linksets[0].linksetdbs[0].links.length > 100) {
    if (typeof context.recovering === 'undefined') {
      ideo.getAssemblyAndChromosomesFromEutils(context.callback, true);
      return Promise.reject(
        'Unexpectedly found genomic scaffolds instead of chromosomes ' +
        'while querying RefSeq.  Recovering.'
      );
    } else {
      // Avoid flooding NCBI with EUtils requests.
      throw Error(
        'Failed to find chromosomes for genome ' + assemblyAccession
      );
    }
  }
}

function fetchNucleotideSummary(data, assemblyAccession, context) {
  var links, ntSummary;

  handleScaffoldData(data, assemblyAccession, context);

  links = data.linksets[0].linksetdbs[0].links.join(',');
  ntSummary = context.ideo.esummary + '&db=nucleotide&id=' + links;

  return d3.json(ntSummary);
}

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

function parseChloroplastOrPlastid(ideo) {
  // Plastid encountered with rice genome IRGSP-1.0 (GCF_001433935.1)
  if (ideo.config.showNonNuclearChromosomes) {
    return ['CP', 'chloroplast'];
  } 
  return [null, null];
}

function parseApicoplast(ideo) {
  if (ideo.config.showNonNuclearChromosomes) {
    return ['AP', 'apicoplast'];
  } 
  return [null, null];
}

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
  var chrName, type, chromosome, result,

  [chrName, type] = getChrNameAndType(result, ideo);

  chromosome = {
    name: chrName,
    length: result.slen,
    type: type
  };

  return chromosome;
}

function parseChromosomes(results, asmAndChrArray, ideo) {
  var x, chromosome,
    chromosomes = [];

  for (x in results) {
    // omit list of result uids
    if (x === 'uids') continue;

    chromosome = parseChromosome(results[x], ideo);
    chromosomes.push(chromosome);
  }

  chromosomes = chromosomes.sort(Ideogram.sortChromosomes);

  ideo.coordinateSystem = 'bp';

  asmAndChrArray.push(chromosomes);

  return asmAndChrArray;
}

function fetchAssemblySummary(data, ideo) {
  var asmUid, asmSummaryUrl;

  // NCBI Assembly database's internal identifier (uid) for this assembly
  asmUid = data.esearchresult.idlist[0];
  asmSummaryUrl = ideo.esummary + '&db=assembly&id=' + asmUid;

  return d3.json(asmSummaryUrl);
}

/**
 * Returns names and lengths of chromosomes for an organism's best-known
 * genome assembly, or for a specified assembly.  Gets data from NCBI
 * EUtils web API.
 *
 * @param callback Function to call upon completion of this async method
 * @param recovering Boolean indicating attempt at failure recovery
 */
function getAssemblyAndChromosomesFromEutils(callback, recovering) {
  var asmSearchUrl, nuccoreLink,
    asmAndChrArray = [],
    ideo = this,
    context = {callback: callback, recovering: recovering, ideo: ideo};

  asmSearchUrl = getAssemblySearchUrl(ideo);

  d3.json(asmSearchUrl)
    .then(function(data) { return fetchAssemblySummary(data, ideo); })
    .then(function(data) {
      [asmAndChrArray, nuccoreLink] =
        getAssemblyAndNuccoreLink(data, asmAndChrArray, recovering, ideo);
      return d3.json(nuccoreLink);
    })
    .then(function(data) {
      return fetchNucleotideSummary(data, asmAndChrArray, context);
    })
    .then(function(data) {
      asmAndChrArray = parseChromosomes(data.result, asmAndChrArray, ideo);
      return callback(asmAndChrArray);
    }, function(rejectedReason) {
      console.warn(rejectedReason);
    });
}

export {
  esearch, esummary, elink, getTaxidFromEutils, getOrganismFromEutils,
  getTaxids, setTaxidAndAssemblyAndChromosomes, setTaxidData,
  getAssemblyAndChromosomesFromEutils
}
