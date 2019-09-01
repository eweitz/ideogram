import {d3} from '../lib';

/**
 *  Returns an NCBI taxonomy identifier (taxid) for the configured organism
 */
function getTaxidFromEutils(orgName, ideo) {
  var taxonomySearch, taxid;

  taxonomySearch = ideo.esearch + '&db=taxonomy&term=' + orgName;

  d3.json(taxonomySearch).then(function(data) {
    taxid = data.esearchresult.idlist[0];
    return taxid;
  });
}

function setTaxidData(taxid, ideo) {
  var dataDir, organism, urlOrg, taxids;

  dataDir = ideo.config.dataDir;
  organism = ideo.config.organism;
  urlOrg = organism.replace(' ', '-');

  taxids = [taxid];

  ideo.organisms[taxid] = {
    commonName: '',
    scientificName: organism,
    scientificNameAbbr: ''
  };

  var fullyBandedTaxids = ['9606', '10090', '10116'];
  if (fullyBandedTaxids.includes(taxid) && !ideo.config.showFullyBanded) {
    urlOrg += '-no-bands';
  }
  var chromosomesUrl = dataDir + urlOrg + '.json';

  var promise2 = new Promise(function(resolve, reject) {
    fetch(chromosomesUrl).then(function(response) {
      if (response.ok === false) {
        reject(Error('Fetch failed for ' + chromosomesUrl));
      } else {
        return response.json().then(function(json) {
          resolve(json);
        });
      }
    });
  });

  return promise2
    .then(function(data) {
      // Check if chromosome data exists locally.
      // This is used for pre-processed centromere data,
      // which is not accessible via EUtils.  See get_chromosomes.py.

      var asmAndChrTaxidsArray = [''],
        chromosomes = [],
        seenChrs = {},
        chr;

      window.chrBands = data.chrBands;

      for (var i = 0; i < chrBands.length; i++) {
        chr = chrBands[i].split(' ')[0];
        if (chr in seenChrs) {
          continue;
        } else {
          chromosomes.push({name: chr, type: 'nuclear'});
          seenChrs[chr] = 1;
        }
      }
      chromosomes = chromosomes.sort(Ideogram.sortChromosomes);
      asmAndChrTaxidsArray.push(chromosomes);
      asmAndChrTaxidsArray.push(taxids);
      ideo.coordinateSystem = 'iscn';
      return asmAndChrTaxidsArray;
    },
    function() {
      return new Promise(function(resolve) {
        ideo.coordinateSystem = 'bp';
        ideo.getAssemblyAndChromosomesFromEutils(resolve);
      });
    });
}

function setTaxidAndAssemblyAndChromosomes(orgName, callback, ideo) {
  console.log('setTaxidAndAssemblyAndChromosomes')
  var assembly, chromosomes, taxid, taxids;

  getTaxidFromEutils(orgName, ideo)
    .then(function(taxid) { return setTaxidData(taxid, ideo); })
    .then(function(asmChrTaxidsArray) {
      assembly = asmChrTaxidsArray[0];
      chromosomes = asmChrTaxidsArray[1];
      taxids = ideo.config.taxids;
      ideo.config.chromosomes = chromosomes;
      ideo.organisms[taxid].assemblies = {
        default: assembly
      };

      callback(taxids);
    });
}

function isOrganismSupported(sourceOrg, ideo) {
  var org = sourceOrg
    ideoOrg = ideo.organisms[taxid];

  return (
    taxid === org ||
    ideoOrg.commonName.toLowerCase() === org.toLowerCase() ||
    ideoOrg.scientificName.toLowerCase() === org.toLowerCase()
  );
}

// Augment "organisms" metadata with for any requested organism that is
// not natively supported (i.e., not in organism-metadata.js).
function populateNonNativeOrg(orgs, ideo) {
  var org,
    augmentedOrganismMetadata = {};

  return new Promise(function(resolve) {
    for (i = 0; i < orgs.length; i++) {
      org = orgs[i];
      if (isOrganismSupported(org, ideo) === false) {
        getTaxidFromEutils(org, ideo).then(function(taxid) {
          augmentedOrganismMetadata[taxid] = {
            scientificName: org,
            commonName: org
          };
          console.log(augmentedOrganismMetadata);
          if (org === orgs[org.length - 1]) {
            Object.assign(ideo.organisms, augmentedOrganismMetadata);
            resolve();
          }
        });
      }
    }
  });
}

function prepareTmpChrsAndTaxids(ideo) {
  var orgs, taxids, tmpChrs, i, org, taxid,
    config = ideo.config;

  taxids = [];
  tmpChrs = {};
  orgs = (config.multiorganism) ? config.organism : [config.organism];

  populateNonNativeOrg(orgs, ideo);

  for (i = 0; i < orgs.length; i++) {
    for (taxid in ideo.organisms) {
      taxids.push(taxid);
      if (config.multiorganism) {
        if (typeof config.chromosomes !== 'undefined') {
          // Adjusts 'chromosomes' configuration parameter to make object
          // keys use taxid instead of common organism name
          tmpChrs[taxid] = config.chromosomes[org];
        } else {
          tmpChrs = null;
        }
      }
    }
  }

  return [tmpChrs, taxids];
}

function getTaxidsForOrganismsInConfig(callback, ideo) {
  console.log('getTaxidsForOrganismInConfig')
  var tmpChrs, taxids;

  [tmpChrs, taxids] = prepareTmpChrsAndTaxids(ideo);
  if (
    taxids.length === 0 ||
    ideo.assemblyIsAccession() && /GCA_/.test(ideo.config.assembly)
  ) {
    setTaxidAndAssemblyAndChromosomes(callback, ideo);
  } else {
    console.log('taxids')
    ideo.config.taxids = taxids;
    if (ideo.config.multiorganism) {
      ideo.config.chromosomes = tmpChrs;
    }
    callback(taxids);
  }
}

function getIsMultiorganism(taxidInit, ideo) {
  return (
    ('organism' in ideo.config && ideo.config.organism instanceof Array) ||
    (taxidInit && ideo.config.taxid instanceof Array)
  );
}

/**
 * Configure Ideogram taxids when 'organism' is not in ideo.config
 */
function getTaxidsForOrganismsNotInConfig(taxidInit, callback, ideo) {
  var taxids;

  if (ideo.config.multiorganism) {
    ideo.coordinateSystem = 'bp';
    if (taxidInit) {
      taxids = ideo.config.taxid;
    }
  } else {
    if (taxidInit) {
      taxids = [ideo.config.taxid];
    }
    ideo.config.taxids = taxids;
  }
  callback(taxids);
}

/**
 * Returns an array of taxids for the current ideogram
 * Also sets configuration parameters related to taxid(s), whether ideogram is
 * multiorganism, and adjusts chromosomes parameters as needed
 **/
function getTaxids(callback) {
  console.log('getTaxids')
  var taxidInit,
    ideo = this;

  taxidInit = 'taxid' in ideo.config;

  ideo.config.multiorganism = getIsMultiorganism(taxidInit, ideo);

  if ('organism' in ideo.config) {
    getTaxidsForOrganismsInConfig(callback, ideo);
  } else {
    getTaxidsForOrganismsNotInConfig(taxidInit, callback, ideo);
  }
}

/**
 * Searches NCBI EUtils for the common organism name for this ideogram
 * instance's taxid (i.e. NCBI Taxonomy ID)
 *
 * @param callback Function to call upon completing ESearch request
 */
function getOrganismFromEutils(callback) {
  var organism, taxonomySearch, taxid,
    ideo = this;

  taxid = ideo.config.organism;

  taxonomySearch = ideo.esummary + '&db=taxonomy&id=' + taxid;

  d3.json(taxonomySearch).then(function(data) {
    organism = data.result[String(taxid)].commonname;
    ideo.config.organism = organism;
    return callback(organism);
  });
}

export {
  getTaxids, getOrganismFromEutils
};
