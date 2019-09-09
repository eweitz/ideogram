import {d3, getTaxid} from '../lib';

/**
 *  Returns the NCBI taxonomy identifier (taxid) for the configured organism
 */
function getTaxidFromEutils(orgName, ideo) {
  var taxonomySearch, taxid;

  console.log('in getTaxidFromEutils')

  taxonomySearch = ideo.esearch + '&db=taxonomy&term=' + orgName;

  return d3.json(taxonomySearch).then(function(data) {
    taxid = data.esearchresult.idlist[0];
    console.log('succeeded getTaxidFromEutils, taxid:', taxid)
    return taxid;
  });
}

function setTaxidData(taxid, ideo) {
  var dataDir, organism, urlOrg, taxids;

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
      // If request in `then` errs (404), fetch data from EUtils
      return new Promise(function(resolve) {
        ideo.coordinateSystem = 'bp';
        ideo.getAssemblyAndChromosomesFromEutils(taxid, resolve);
      });
    });
}

function setAssemblyAndChromosomes(taxid, resolve, ideo) {
  console.log('setAssemblyAndChromosomes')
  var assembly, chromosomes;

  setTaxidData(taxid, ideo)
    .then(function(asmChrTaxidsArray) {
      assembly = asmChrTaxidsArray[0];
      chromosomes = asmChrTaxidsArray[1];

      console.log('in setTaxidData.then, assembly, chromosomes:')
      console.log(assembly)
      console.log(chromosomes)
      if ('chromosomes' in ideo.config === false) {
        ideo.config.chromosomes = {};
      }
      ideo.config.chromosomes[taxid] = chromosomes;
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

// Augment "organisms" metadata with for any requested organism that is
// not natively supported (i.e., not in organism-metadata.js).
function populateNonNativeOrg(orgs, ideo) {
  var org, promise, i,
    getTaxidFromEutilsPromises = [],
    augmentedOrganismMetadata = {};

  console.log('entered populateNonNativeOrg')

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

  console.log('before Promise.all')

  return Promise.all(getTaxidFromEutilsPromises).then(function() {
    console.log('in Promise.all, ideo.organisms, augmentedOrganismMetadata:')
    console.log(ideo.organisms)
    console.log(augmentedOrganismMetadata)
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

    console.log('entering populateNonNativeOrg, orgMetadata:')
    console.log(orgMetadata)

    for (taxid in orgMetadata) {
      org = orgMetadata[taxid].scientificName;
      console.log('org')
      console.log(org)
      taxids.push(taxid);
      console.log('taxid')
      console.log(taxid)
      if (config.multiorganism) {
        console.log('config.chromosomes')
        console.log(config.chromosomes)
        if (typeof config.chromosomes !== 'undefined') {
          // Adjusts 'chromosomes' configuration parameter to make object
          // keys use taxid instead of common organism name
          tmpChrs[taxid] = config.chromosomes[org.toLowerCase()];
        } else {
          tmpChrs = null;
        }
      }
    }
    console.log('ending populateNonNativeOrg, [tmpChrs, taxids]')
    console.log([tmpChrs, taxids])
    return [tmpChrs, taxids];
  });
}

function getTaxidsForOrganismsInConfig(callback, ideo) {
  // var tmpChrs, taxids;

  console.log('entering getTaxidsForOrganismInConfig, ideo.config.organisms')
  console.log(ideo.config.organism)

  prepareTmpChrsAndTaxids(ideo).then(function([tmpChrs, taxids]) {
    var i, taxid, promise;
    console.log('in prepareTmpChrsAndTaxids.then, tmpChrs, taxids:')
    console.log(tmpChrs)
    console.log(taxids)

    var asmAndChrPromises = [];

    for (i = 0; i < taxids.length; i++) {
      taxid = taxids[i];
      if (
        ideo.organisms[taxid].assemblies.default === '' ||
        ideo.assemblyIsAccession() && /GCA_/.test(ideo.config.assembly)
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
          console.log('in prepareTmpChrsAndTaxids immediate promise')
          resolve();
        });
      }

      asmAndChrPromises.push(promise);
    }

    Promise.all(asmAndChrPromises).then(function() {
      console.log('in Promise.all(asmAndChrPromises)')
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
