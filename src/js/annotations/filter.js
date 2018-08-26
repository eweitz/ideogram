import * as d3selection from 'd3-selection';

import {Object} from '../lib.js';

var d3 = Object.assign({}, d3selection);

/**
 * Reset displayed tracks to those originally displayed
 */
function restoreDefaultTracks() {
  var ideo = this;
  ideo.config.numAnnotTracks = ideo.config.annotationsNumTracks;
  d3.selectAll(ideo.selector + ' .annot').remove();
  ideo.drawAnnots(ideo.processAnnotData(ideo.rawAnnots));
}

/**
 * Adds or removes tracks from the displayed list of tracks.
 * Only works when raw annotations are dense.
 *
 * @param trackIndexes Array of indexes of tracks to display
 */
function updateDisplayedTracks(trackIndexes) {
  var displayedRawAnnotsByChr, displayedAnnots, i, j, rawAnnots, annots, annot,
    trackIndex,
    ideo = this,
    annotsByChr = ideo.rawAnnots.annots;

  displayedRawAnnotsByChr = [];

  ideo.config.numAnnotTracks = trackIndexes.length;

  // Filter displayed tracks by selected track indexes
  for (i = 0; i < annotsByChr.length; i++) {
    annots = annotsByChr[i];
    displayedAnnots = [];
    for (j = 0; j < annots.annots.length; j++) {
      annot = annots.annots[j].slice(); // copy array by value
      trackIndex = annot[3] + 1;
      if (trackIndexes.includes(trackIndex)) {
        annot[3] = trackIndexes.indexOf(trackIndex);
        displayedAnnots.push(annot);
      }
    }
    displayedRawAnnotsByChr.push({chr: annots.chr, annots: displayedAnnots});
  }

  rawAnnots = {keys: ideo.rawAnnots.keys, annots: displayedRawAnnotsByChr};

  displayedAnnots = ideo.processAnnotData(rawAnnots);

  d3.selectAll(ideo.selector + ' .annot').remove();
  ideo.drawAnnots(displayedAnnots);

  ideogram.displayedTrackIndexes = trackIndexes;

  return displayedAnnots;
}

function setOriginalTrackIndexes(rawAnnots) {
  var keys, annotsByChr, annots, annot, i, j, trackIndexOriginal,
    setAnnotsByChr, setAnnots, numAvailTracks;

  keys = rawAnnots.keys;

  // If this method is unnecessary, pass through
  if (
    keys.length < 4 ||
    keys[3] !== 'trackIndex' ||
    keys[4] === 'trackIndexOriginal'
  ) {
    return rawAnnots;
  }

  numAvailTracks = 1;

  annotsByChr = rawAnnots.annots;
  setAnnotsByChr = [];

  for (i = 0; i < annotsByChr.length; i++) {
    annots = annotsByChr[i];
    setAnnots = [];
    for (j = 0; j < annots.annots.length; j++) {
      annot = annots.annots[j].slice();
      trackIndexOriginal = annot[3];
      if (trackIndexOriginal + 1 > numAvailTracks) {
        numAvailTracks = trackIndexOriginal + 1;
      }
      annot.splice(4, 0, trackIndexOriginal);
      setAnnots.push(annot);
    }
    setAnnotsByChr.push({chr: annots.chr, annots: setAnnots});
  }

  keys.splice(4, 0, 'trackIndexOriginal');
  rawAnnots = {keys: keys, annots: setAnnotsByChr};

  this.numAvailTracks = numAvailTracks;

  return rawAnnots;
}

export {restoreDefaultTracks, setOriginalTrackIndexes, updateDisplayedTracks}