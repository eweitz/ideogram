import {d3} from '../lib';
import collinearizeChromosomes from '../collinear';

/**
 * Reset displayed tracks to those originally displayed
 */
function restoreDefaultTracks() {
  var ideo = this;
  ideo.config.numAnnotTracks = ideo.config.annotationsNumTracks;
  d3.selectAll(ideo.selector + ' .annot').remove();
  ideo.drawAnnots(ideo.processAnnotData(ideo.rawAnnots));
}

function getDisplayedRawAnnotsByChr(annotsByChr, trackIndexes) {
  var annot, displayedRawAnnotsByChr, annots, i, displayedAnnots, j,
    trackIndex;

  displayedRawAnnotsByChr = [];

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

  return displayedRawAnnotsByChr;
}

/**
 * Adds or removes tracks from the displayed list of tracks.
 * Only works when raw annotations are dense.
 *
 * @param trackIndexes Array of indexes of tracks to display
 */
function updateDisplayedTracks(trackIndexes) {
  var displayedRawAnnotsByChr, displayedAnnots, rawAnnots,
    ideo = this,
    annotsByChr = ideo.rawAnnots.annots;

  ideo.config.numAnnotTracks = trackIndexes.length;

  displayedRawAnnotsByChr =
    getDisplayedRawAnnotsByChr(annotsByChr, trackIndexes);
  rawAnnots = {keys: ideo.rawAnnots.keys, annots: displayedRawAnnotsByChr};

  if (ideo.config.geometry === 'collinear') {
    collinearizeChromosomes(ideo);
  }

  displayedAnnots = ideo.processAnnotData(rawAnnots);

  d3.selectAll(ideo.selector + ' .annot').remove();
  ideo.displayedTrackIndexes = trackIndexes;
  ideo.drawAnnots(displayedAnnots);

  return displayedAnnots;
}

function getSetAnnotsByChr(annotsByChr, ideo) {
  var i, j, annots, annot, setAnnots, trackIndexOriginal, numAvailTracks,
    setAnnotsByChr = [];

  numAvailTracks = 1;

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

  ideo.numAvailTracks = numAvailTracks;

  return setAnnotsByChr;
}

function setOriginalTrackIndexes(rawAnnots) {
  var keys, annotsByChr, setAnnotsByChr,
    ideo = this;

  keys = rawAnnots.keys;

  // If this method is unnecessary, pass through
  if (
    keys.length < 4 ||
    keys[3] !== 'trackIndex' ||
    keys[4] === 'trackIndexOriginal'
  ) {
    return rawAnnots;
  }

  annotsByChr = rawAnnots.annots;
  setAnnotsByChr = getSetAnnotsByChr(annotsByChr, ideo);

  keys.splice(4, 0, 'trackIndexOriginal');
  rawAnnots = {keys: keys, annots: setAnnotsByChr};
  if (ideo.rawAnnots.metadata) rawAnnots.metadata = ideo.rawAnnots.metadata;

  return rawAnnots;
}

export {restoreDefaultTracks, setOriginalTrackIndexes, updateDisplayedTracks};
