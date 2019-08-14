import {hasNonGenBankAssembly} from '../lib';

var lastBandDataUrl = '';

function getBandUrl(bandDataFileNames, taxid, ideo) {
  return ideo.config.dataDir + bandDataFileNames[taxid];
}

function shouldFetchBands(bandDataFileNames, taxid, ideo) {
  var bandDataUrl = getBandUrl(bandDataFileNames, taxid, ideo);
  return (
    !(typeof window.chrBands !== 'undefined' && lastBandDataUrl === '') ||
    lastBandDataUrl !== bandDataUrl
  ) &&
  hasNonGenBankAssembly(ideo) &&
  taxid in bandDataFileNames;
}

function setBandData(url, fileNames, chrBands, ideo) {
  var taxid, fetchedTaxid, fileName;

  // Ensures correct taxid is processed in response callback;
  // using simply upstream 'taxid' variable gives the last
  // *requested* taxid, which fails when dealing with multiple taxa.
  for (taxid in fileNames) {
    fileName = fileNames[taxid];
    if (url.includes(fileName) && fileName !== '') {
      fetchedTaxid = taxid;
    }
  }

  ideo.bandData[fetchedTaxid] = chrBands;
}

function fetchBands(bandDataFileNames, taxid, t0, ideo) {
  var bandDataUrl = getBandUrl(bandDataFileNames, taxid, ideo);

  if (!ideo.numBandDataResponses) ideo.numBandDataResponses = 0;

  fetch(bandDataUrl)
    .then(function(response) {
      return response.json().then(function(rawBands) {
        lastBandDataUrl = bandDataUrl;

        delete window.chrBands; // Remove any previous chrBands variable
        window.chrBands = rawBands.chrBands;

        setBandData(response.url, bandDataFileNames, chrBands, ideo);

        ideo.numBandDataResponses += 1;

        if (ideo.numBandDataResponses === ideo.config.taxids.length) {
          var bandsArray = ideo.processBandData();
          ideo.writeContainer(bandsArray, taxid, t0);
          delete ideo.numBandDataResponses;
        }
      });
    });
}

export {shouldFetchBands, fetchBands};
