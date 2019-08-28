import {d3, hasGenBankAssembly} from '../lib';
import {
  esearch, esummary, elink, getAssemblySearchUrl
} from './eutils-config.js';
import {
  getTaxids, getOrganismFromEutils
} from './organisms.js';

function getNuccoreLink(asmUid, ideo) {
  var qs;

  // Get a list of IDs for the chromosomes in this genome.
  //
  // If assembly is GenBank-only or if a GenBank assembly was explicitly
  // requested (GCA_), then query chromosomes sequences in Nucleotide DB via
  // INSDC link.  (GenBank is the American INSDC repository.)
  // Otherwise, query RefSeq chromosomes in Nucleotide DB.
  if (hasGenBankAssembly(ideo)) {
    // TODO: account for GenBank-only
    qs = '&db=nuccore&linkname=assembly_nuccore_insdc&from_uid=' + asmUid;
    return ideo.elink + qs;
  } else {
    qs = ('&db=nuccore&dbfrom=assembly&linkname=assembly_nuccore_refseq&' +
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
}

function fetchNucleotideSummary(data, ideo) {
  var links, ntSummary;

  if ('esearchresult' in data) {
    links = data.esearchresult.idlist.join(',');
  } else {
    links = data.linksets[0].linksetdbs[0].links.join(',');
  }
  ntSummary = ideo.esummary + '&db=nucleotide&id=' + links;

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
  var chrName, type, chromosome;

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
 */
function getAssemblyAndChromosomesFromEutils(callback) {
  var asmSearchUrl,
    asmAndChrArray = [],
    ideo = this;

  asmSearchUrl = getAssemblySearchUrl(ideo);

  d3.json(asmSearchUrl)
    .then(function(data) { return fetchAssemblySummary(data, ideo); })
    .then(function(data) {
      var asmUid, assembly;
      asmUid = data.result.uids[0];
      assembly = data.result[asmUid];
      asmAndChrArray.push(assembly.assemblyaccession);
      return getNuccoreLink(asmUid, ideo);
    }).then(function(nuccoreLink) { return d3.json(nuccoreLink); })
    .then(function(data) { return fetchNucleotideSummary(data, ideo); })
    .then(function(data) {
      asmAndChrArray = parseChromosomes(data.result, asmAndChrArray, ideo);
      return callback(asmAndChrArray);
    }, function(rejectedReason) {
      console.warn(rejectedReason);
    });
}

export {
  esearch, esummary, elink, getOrganismFromEutils,
  getTaxids, getAssemblyAndChromosomesFromEutils
};
