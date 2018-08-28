// Default colors for tracks of annotations
var colorMap = [
  ['F00'], // If there is 1 track, then color it red.
  ['F00', '88F'], // If 2 tracks, color one red and one light blue.
  ['F00', 'CCC', '88F'], // If 3, color one red, one grey, one light blue.
  ['F00', 'FA0', '0AF', '88F'], // And so on.
  ['F00', 'FA0', 'CCC', '0AF', '88F'],
  ['F00', 'FA0', '875', '578', '0AF', '88F'],
  ['F00', 'FA0', '875', 'CCC', '578', '0AF', '88F'],
  ['F00', 'FA0', '7A0', '875', '0A7', '578', '0AF', '88F'],
  ['F00', 'FA0', '7A0', '875', 'CCC', '0A7', '578', '0AF', '88F'],
  ['F00', 'FA0', '7A0', '875', '552', '255', '0A7', '578', '0AF', '88F']
];

/**
 * Ensure annotation containers are ordered by chromosome.
 */
function orderAnnotContainers(annots, ideo) {
  var unorderedAnnots, i, j, annot, chr, chrs;

  unorderedAnnots = annots;
  annots = [];
  chrs = ideo.chromosomesArray;
  for (i = 0; i < chrs.length; i++) {
    chr = chrs[i].name;
    for (j = 0; j < unorderedAnnots.length; j++) {
      annot = unorderedAnnots[j];
      if (annot.chr === chr) {
        annots.push(annot);
      }
    }
  }

  return annots;
}

/**
 * Add client annotations, as in annotations-tracks.html
 */
function addClientAnnot(annots, annot, ra, m, ideo) {
  var annotTrack;

  annot.trackIndex = ra[3];
  annotTrack = ideo.config.annotationTracks[annot.trackIndex];
  if (annotTrack.color) {
    annot.color = annotTrack.color;
  }
  if (annotTrack.shape) {
    annot.shape = annotTrack.shape;
  }

  annots[m].annots.push(annot);

  return annots;
}

/**
 * Add sparse server annotations, as in annotations-track-filters.html
 */
function addSparseServertAnnot(annot, ra, omittedAnnots, annots, m, ideo) {
  var colors = colorMap[ideo.numAvailTracks - 1];

  annot.trackIndex = ra[3];
  annot.trackIndexOriginal = ra[4];
  annot.color = '#' + colors[annot.trackIndexOriginal];

  // Catch annots that will be omitted from display
  if (annot.trackIndex > ideo.config.numTracks - 1) {
    if (annot.trackIndex in omittedAnnots) {
      omittedAnnots[annot.trackIndex].push(annot);
    } else {
      omittedAnnots[annot.trackIndex] = [annot];
    }
    return [annots, omittedAnnots];
  }
  annots[m].annots.push(annot);

  return [annots, omittedAnnots];
}

function addDenseServerAnnot(keys, annots, annot, m) {
  var n, thisAnnot;

  // Dense server annotations
  for (n = 4; n < keys.length; n++) {
    thisAnnot = Object.assign({}, annot); // copy by value
    thisAnnot.trackIndex = n - 4;
    thisAnnot.trackIndexOriginal = n - 3;
    thisAnnot.color = '#' + colors[thisAnnot.trackIndexOriginal];
    annots[m].annots.push(thisAnnot);
  }

  return annots;
}

/**
 * Basic client annotations, as in annotations-basic.html
 * and annotations-external.html
 */
function addBasicClientAnnot(annots, annot, m, ideo) {
  annot.trackIndex = 0;
  if (!annot.color) {
    annot.color = ideo.config.annotationsColor;
  }
  if (!annot.shape) {
    annot.shape = 'triangle';
  }
  annots[m].annots.push(annot);

  return annots;
}

function addAnnot(annot, keys, ra, omittedAnnots, annots, m, ideo) {

  if (ideo.config.annotationTracks) {
    annots = addClientAnnot(annots, annot, ra, m, ideo);
  } else if (keys[3] === 'trackIndex' && ideo.numAvailTracks !== 1) {
    [annots, omittedAnnots] = 
      addSparseServertAnnot(annot, ra, omittedAnnots, annots, m, ideo);
  } else if (
    keys.length > 3 &&
    keys[3] in {trackIndex: 1, color: 1, shape: 1} === false &&
    keys[4] === 'trackIndexOriginal'
  ) {
    annots = addDenseServerAnnot(keys, annots, annot, m);
  } else {
    annots = addBasicClientAnnot(annots, annot, m, ideo);
  }

  return [annots, omittedAnnots];
}

function addAnnotsForChr(annots, omittedAnnots, annotsByChr, chrModel,
  m, keys, ideo) {
  var j, k, annot, ra;

  for (j = 0; j < annotsByChr.annots.length; j++) {
    ra = annotsByChr.annots[j];
    annot = {};

    for (k = 0; k < keys.length; k++) {
      annot[keys[k]] = ra[k];
    }

    annot.stop = annot.start + annot.length;

    annot.chr = annotsByChr.chr;
    annot.chrIndex = m;
    annot.startPx = ideo.convertBpToPx(chrModel, annot.start);
    annot.stopPx = ideo.convertBpToPx(chrModel, annot.stop);
    annot.px = Math.round((annot.startPx + annot.stopPx) / 2);

    [annots, omittedAnnots] = 
      addAnnot(annot, keys, ra, omittedAnnots, annots, m, ideo);
  }

  return [annots, omittedAnnots];
}

function warnOfUndefinedChromosome(annotsByChr) {
  console.warn(
    'Chromosome "' + annotsByChr.chr + '" undefined in ideogram; ' +
    annotsByChr.annots.length + ' annotations not shown'
  );
}

function addAnnots(rawAnnots, keys, ideo) {
  var m, i, annotsByChr, chrModel,
    annots = [],
    omittedAnnots = {};

  m = -1;
  for (i = 0; i < rawAnnots.length; i++) {
    annotsByChr = rawAnnots[i];
    chrModel = ideo.chromosomes[ideo.config.taxid][annotsByChr.chr];

    if (typeof chrModel === 'undefined') {
      warnOfUndefinedChromosome(annotsByChr);
      continue;
    }

    m++;
    annots.push({chr: annotsByChr.chr, annots: []});

    [annots, omittedAnnots] =
      addAnnotsForChr(annots, omittedAnnots, annotsByChr, chrModel,
        m, keys, ideo);
  }

  return [annots, omittedAnnots];
}

function sendTrackAndAnnotWarnings(omittedAnnots, ideo) {
  var numOmittedTracks,
    numTracks = ideo.config.numAnnotTracks;;

  if (numTracks > 10) {
    console.error(
      'Ideogram only displays up to 10 tracks at a time.  ' +
      'You specified ' + numTracks + ' tracks.  ' +
      'Perhaps consider a different way to visualize your data.'
    );
  }

  numOmittedTracks = Object.keys(omittedAnnots).length;
  if (numOmittedTracks) {
    console.warn(
      'Ideogram configuration specified ' + numTracks + ' tracks, ' +
      'but loaded annotations contain ' + numOmittedTracks + ' ' +
      'extra tracks.'
    );
  }
}

/**
 * Proccesses genome annotation data.
 *
 * This method converts raw annotation data from server, which is structured as
 * an array of arrays, into a more verbose data structure consisting of an
 * array of objects.  It also adds pixel offset information.
 */
function processAnnotData(rawAnnots) {
  var keys, annots, omittedAnnots,
    ideo = this;

  keys = rawAnnots.keys;
  rawAnnots = rawAnnots.annots;

  [annots, omittedAnnots] = addAnnots(rawAnnots, keys, ideo);
  annots = orderAnnotContainers(annots, ideo);

  sendTrackAndAnnotWarnings(omittedAnnots, ideo)

  return annots;
}

export {processAnnotData}