import * as d3fetch from 'd3-fetch';

var d3 = Object.assign({}, d3fetch);

/**
 *  Returns an NCBI taxonomy identifier (taxid) for the configured organism
 */
function getTaxidFromEutils(callback) {
  var organism, taxonomySearch, taxid,
    ideo = this;

  organism = ideo.config.organism;

  taxonomySearch = ideo.esearch + '&db=taxonomy&term=' + organism;

  d3.json(taxonomySearch).then(function(data) {
    taxid = data.esearchresult.idlist[0];
    if (typeof ideo.config.taxids === 'undefined') {
      ideo.config.taxids = [taxid];
    } else {
      ideo.config.taxids.push(taxid);
    }
    return callback(taxid);
  });
}

function setTaxidData(taxid) {
  var organism, dataDir, urlOrg,
    ideo = this,
    multiorganism = ideo.config.multiorganism,
    taxids = [];

  organism = ideo.config.organism;
  dataDir = ideo.config.dataDir;
  urlOrg = organism.replace(' ', '-');


  // if (taxids.indexOf(taxid) === -1) {
    taxids.push(taxid);
  // }

  ideo.config.taxids = taxids;
  ideo.organisms[taxid] = {
    commonName: '',
    scientificName: ideo.config.organism,
    scientificNameAbbr: ''
  };

  var fullyBandedTaxids = ['9606', '10090', '10116'];
  if (
      fullyBandedTaxids.indexOf(taxid) !== -1 &&
      ideo.config.showFullyBanded === false
  ) {
    urlOrg += '-no-bands';
  }
  var chromosomesUrl = dataDir + urlOrg + '.js';

  var promise2 = new Promise(function(resolve, reject) {
    fetch(chromosomesUrl).then(function(response) {
      if (response.ok === false) {
        reject(Error('Fetch failed for ' + chromosomesUrl));
      } else {
        return response.text().then(function(text) {
          resolve(text);
        });
      }
    });
  });

  return promise2
  .then(
      function(data) {
        // Check if chromosome data exists locally.
        // This is used for pre-processed centromere data,
        // which is not accessible via EUtils.  See get_chromosomes.py.

        var asmAndChrTaxidsArray = [],
            chromosomes = [],
            seenChrs = {},
            chr;

        eval(data);

        asmAndChrTaxidsArray.push('');

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
      }
  );
}

function setTaxidAndAssemblyAndChromosomes(callback) {
  var assembly, chromosomes, getTaxidsFromEutils, taxid, taxids,
    ideo = this;

  getTaxidsFromEutils = new Promise(function(resolve) {
    ideo.getTaxidFromEutils(resolve);
  });

  getTaxidsFromEutils
  .then(function(data) {
    taxid = data;
    return ideo.setTaxidData(taxid);
  })
  .then(function(asmChrTaxidsArray) {
    assembly = asmChrTaxidsArray[0];
    chromosomes = asmChrTaxidsArray[1];
    taxids = asmChrTaxidsArray[2];
    ideo.config.chromosomes = chromosomes;
    ideo.organisms[taxid].assemblies = {
      default: assembly
    };

    callback(taxids);
  });
}

/**
 * Returns an array of taxids for the current ideogram
 * Also sets configuration parameters related to taxid(s), whether ideogram is
 * multiorganism, and adjusts chromosomes parameters as needed
 **/
function getTaxids(callback) {
  var ideo = this,
      taxid, taxids,
      org, orgs, i,
      taxidInit, tmpChrs,
      multiorganism;

  taxidInit = 'taxid' in ideo.config;

  ideo.config.multiorganism = (
      ('organism' in ideo.config && ideo.config.organism instanceof Array) ||
      (taxidInit && ideo.config.taxid instanceof Array)
  );

  multiorganism = ideo.config.multiorganism;

  if ('organism' in ideo.config) {
    // Ideogram instance was constructed using common organism name(s)
    if (multiorganism) {
      orgs = ideo.config.organism;
    } else {
      orgs = [ideo.config.organism];
    }

    taxids = [];
    tmpChrs = {};
    for (i = 0; i < orgs.length; i++) {
      // Gets a list of taxids from common organism names
      org = orgs[i];
      for (taxid in ideo.organisms) {
        if (ideo.organisms[taxid].commonName.toLowerCase() === org) {
          taxids.push(taxid);
          if (multiorganism) {
            // Adjusts 'chromosomes' configuration parameter to make object
            // keys use taxid instead of common organism name
            tmpChrs[taxid] = ideo.config.chromosomes[org];
          }
        }
      }
    }

    if (
        taxids.length === 0 ||
        ideo.assemblyIsAccession() && /GCA_/.test(ideo.config.assembly)
    ) {
      ideo.setTaxidAndAssemblyAndChromosomes(callback);
    } else {
      ideo.config.taxids = taxids;
      if (multiorganism) {
        ideo.config.chromosomes = tmpChrs;
      }
      callback(taxids);
    }
  } else {
    if (multiorganism) {
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
}

export {
  getTaxidFromEutils, setTaxidAndAssemblyAndChromosomes, getTaxids,
  setTaxidData
}