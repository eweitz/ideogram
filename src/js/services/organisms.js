import {d3} from '../lib';

/**
 *  Returns NCBI Taxonomy identifier (taxid) for organism name
 */
function getTaxidFromEutils(orgName, ideo) {
  var taxonomySearch, taxid;

  taxonomySearch = ideo.esearch + '&db=taxonomy&term=' + orgName;

  return d3.json(taxonomySearch).then(function(data) {
    taxid = data.esearchresult.idlist[0];
    return taxid;
  });
}

/**
 * Returns organism common name given an NCBI Taxonomy ID
 *
 * @param taxid NCBI Taxonomy ID
 * @param callback Function to call upon completing ESearch request
 */
function getOrganismFromEutils(taxid, callback) {
  var organism, taxonomySearch,
    ideo = this;

  taxid = ideo.config.organism;

  taxonomySearch = ideo.esummary + '&db=taxonomy&id=' + taxid;

  d3.json(taxonomySearch).then(function(data) {
    organism = data.result[String(taxid)].commonname;
    ideo.config.organism = organism;
    return callback(organism);
  });
}

function setTaxidData(taxid, ideo) {

  var dataDir, organism, urlOrg, taxids;

  if (ideo.assemblyIsAccession()) {
    return new Promise(function(resolve) {
      ideo.coordinateSystem = 'bp';
      ideo.getAssemblyAndChromosomesFromEutils(taxid, resolve);
    });
  }

  dataDir = ideo.config.dataDir;
  organism = ideo.organisms[taxid].scientificName.toLowerCase();
  urlOrg = organism.replace(' ', '-');

  taxids = [taxid];

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
          resolve(json.chrBands);
        });
      }
    });
  });

  return promise2
    .then(function(chrBands) {
      // Check if chromosome data exists locally.
      // This is used for pre-processed centromere data,
      // which is not accessible via EUtils.  See get_chromosomes.py.

      var asmAndChrTaxidsArray = [''],
        chromosomes = [],
        seenChrs = {},
        chr;

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
      return asmAndChrTaxidsArray;
    },
    function() {
      // If request in `then` errs (404), fetch data from EUtils
      return new Promise(function(resolve) {
        ideo.coordinateSystem = 'bp';
        ideo.getAssemblyAndChromosomesFromEutils(taxid, resolve);
      });
    });
}

function setAssemblyAndChromosomes(taxid, resolve, ideo) {
  var assembly, chrs, originalChrs, filteredChrs;

  setTaxidData(taxid, ideo)
    .then(function(asmChrTaxidsArray) {
      assembly = asmChrTaxidsArray[0];
      chrs = asmChrTaxidsArray[1];

      if ('chromosomes' in ideo.config === false) {
        ideo.config.chromosomes = {};
        ideo.config.chromosomes[taxid] = chrs;
      } else {
        if (ideo.config.multiorganism) {
          originalChrs = ideo.config.chromosomes[taxid];
        } else {
          originalChrs = ideo.config.chromosomes;
        }

        filteredChrs = chrs.filter(d => originalChrs.includes(d.name));
        ideo.config.chromosomes[taxid] = filteredChrs;
      }
      ideo.organisms[taxid].assemblies = {
        default: assembly
      };
      resolve();
    });
}

/**
 * Determine if organism is natively supported, using its name.
 */
function isOrganismSupported(org, ideo) {
  var taxid, ideoOrg;

  for (taxid in ideo.organisms) {
    ideoOrg = ideo.organisms[taxid];
    if (
      taxid === org ||
      ideoOrg.commonName.toLowerCase() === org.toLowerCase() ||
      ideoOrg.scientificName.toLowerCase() === org.toLowerCase()
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Augment "organisms" metadata with for any requested organism that is
 * not natively supported (i.e., not in organism-metadata.js).
*/
function populateNonNativeOrg(orgs, ideo) {
  var org, promise, i,
    getTaxidFromEutilsPromises = [],
    augmentedOrganismMetadata = {};

  for (i = 0; i < orgs.length; i++) {
    org = orgs[i];
    if (isOrganismSupported(org, ideo) === false) {
      promise = getTaxidFromEutils(org, ideo)
        .then(function(taxid) {

          augmentedOrganismMetadata[taxid] = {
            scientificName: org,
            scientificNameAbbr: '',
            commonName: '',
            assemblies: {default: ''}
          };

          Object.assign(ideo.organisms, augmentedOrganismMetadata);
        });
    } else {
      promise = new Promise(function(resolve) {
        var taxid = ideo.getTaxid(org);
        augmentedOrganismMetadata[taxid] = ideo.organisms[taxid];
        resolve();
      });
    }
    getTaxidFromEutilsPromises.push(promise);
  }

  return Promise.all(getTaxidFromEutilsPromises).then(function() {
    return augmentedOrganismMetadata;
  });
}

function prepareTmpChrsAndTaxids(ideo) {
  var orgs, taxids, tmpChrs, org, taxid,
    config = ideo.config;

  taxids = [];
  tmpChrs = {};
  orgs = (config.multiorganism) ? config.organism : [config.organism];

  return populateNonNativeOrg(orgs, ideo).then(function(orgMetadata) {
    var orgFields = orgMetadata[taxid];

    for (taxid in orgMetadata) {
      orgFields = orgMetadata[taxid];
      taxids.push(taxid);
      if (config.multiorganism) {
        if (typeof config.chromosomes !== 'undefined') {
          // Adjusts 'chromosomes' configuration parameter to make object
          // keys use taxid instead of common organism name
          if (orgFields.scientificName.toLowerCase() in config.chromosomes) {
            org = orgFields.scientificName;
          } else if (orgFields.commonName.toLowerCase() in config.chromosomes) {
            org = orgFields.commonName;
          }
          tmpChrs[taxid] = config.chromosomes[org.toLowerCase()];
        } else {
          tmpChrs = null;
        }
      }
    }
    return [tmpChrs, taxids];
  });
}

/**
 * Sort taxids by the "organism" configuration option
 *
 * TODO: Handle taxid being passed as organism
 */
function sortTaxidsByOriginalOrganismOption(ideo) {
  var configOrganisms, sortedTaxids, i;
  configOrganisms = ideo.config.organism;
  sortedTaxids = [];
  if (Array.isArray(configOrganisms)) {
    // Handling multi-organism ideogram
    for (i = 0; i < configOrganisms.length; i++) {
      sortedTaxids.push(ideo.getTaxid(configOrganisms[i]));
    }
  } else {
    // Handling single-organism ideogram
    sortedTaxids.push(ideo.getTaxid(configOrganisms));
  }
  return sortedTaxids;
}

function getTaxidsForOrganismsInConfig(callback, ideo) {

  prepareTmpChrsAndTaxids(ideo).then(function([tmpChrs, taxids]) {
    var i, taxid, promise, assemblies, asmAccs,
      config = ideo.config,
      asmAndChrPromises = [];

    for (i = 0; i < taxids.length; i++) {
      taxid = taxids[i];
      assemblies = ideo.organisms[taxid].assemblies;
      asmAccs = Object.values(assemblies);
      if (
        assemblies.default === '' ||
        ideo.assemblyIsAccession() && !asmAccs.includes(config.assembly)
      ) {
        promise = new Promise(function(resolve) {
          setAssemblyAndChromosomes(taxid, resolve, ideo);
        });
      } else {
        ideo.config.taxids = taxids;
        if (ideo.config.multiorganism) {
          ideo.config.chromosomes = tmpChrs;
        }
        promise = new Promise(function(resolve) {
          resolve();
        });
      }

      asmAndChrPromises.push(promise);
    }

    Promise.all(asmAndChrPromises).then(function() {
      taxids = sortTaxidsByOriginalOrganismOption(ideo);
      ideo.config.taxids = taxids;
      return callback(taxids);
    });
  });
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
  var taxidInit,
    ideo = this;

  taxidInit = 'taxid' in ideo.config;

  ideo.config.multiorganism = getIsMultiorganism(taxidInit, ideo);

  if (ideo.config.multiorganism) ideo.coordinateSystem = 'bp';

  if ('organism' in ideo.config) {
    getTaxidsForOrganismsInConfig(callback, ideo);
  } else {
    getTaxidsForOrganismsNotInConfig(taxidInit, callback, ideo);
  }
}

export {
  getTaxids, getOrganismFromEutils
};
