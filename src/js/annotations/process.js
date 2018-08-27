/**
 * Proccesses genome annotation data.
 *
 * This method converts raw annotation data from server, which is structured as
 * an array of arrays, into a more verbose data structure consisting of an
 * array of objects.  It also adds pixel offset information.
 */
function processAnnotData(rawAnnots) {
  var keys, numTracks, i, j, k, m, n, annot, annots, thisAnnot, annotsByChr,
    chr, chrs, chrModel, ra, startPx, stopPx, px, annotTrack,
    unorderedAnnots, colorMap, colors, omittedAnnots, numOmittedTracks, numAvailTracks,
    ideo = this,
    config = ideo.config;

  omittedAnnots = {};

  colorMap = [
    ['F00'],
    ['F00', '88F'],
    ['F00', 'CCC', '88F'],
    ['F00', 'FA0', '0AF', '88F'],
    ['F00', 'FA0', 'CCC', '0AF', '88F'],
    ['F00', 'FA0', '875', '578', '0AF', '88F'],
    ['F00', 'FA0', '875', 'CCC', '578', '0AF', '88F'],
    ['F00', 'FA0', '7A0', '875', '0A7', '578', '0AF', '88F'],
    ['F00', 'FA0', '7A0', '875', 'CCC', '0A7', '578', '0AF', '88F'],
    ['F00', 'FA0', '7A0', '875', '552', '255', '0A7', '578', '0AF', '88F']
  ];

  keys = rawAnnots.keys;
  rawAnnots = rawAnnots.annots;

  numTracks = config.numAnnotTracks;
  numAvailTracks = ideo.numAvailTracks;

  colors = colorMap[numAvailTracks - 1];

  if (numTracks > 10) {
    console.error(
      'Ideogram only displays up to 10 tracks at a time.  ' +
      'You specified ' + numTracks + ' tracks.  ' +
      'Perhaps consider a different way to visualize your data.'
    );
  }

  annots = [];

  m = -1;
  for (i = 0; i < rawAnnots.length; i++) {

    annotsByChr = rawAnnots[i];

    chr = annotsByChr.chr;
    chrModel = ideo.chromosomes[config.taxid][chr];

    if (typeof chrModel === 'undefined') {
      console.warn(
        'Chromosome "' + chr + '" undefined in ideogram; ' +
        annotsByChr.annots.length + ' annotations not shown'
      );
      continue;
    }

    m++;
    annots.push({chr: annotsByChr.chr, annots: []});

    for (j = 0; j < annotsByChr.annots.length; j++) {
      ra = annotsByChr.annots[j];
      annot = {};

      for (k = 0; k < keys.length; k++) {
        annot[keys[k]] = ra[k];
      }

      annot.stop = annot.start + annot.length;

      startPx = ideo.convertBpToPx(chrModel, annot.start);
      stopPx = ideo.convertBpToPx(chrModel, annot.stop);
      px = Math.round((startPx + stopPx) / 2);

      annot.chr = chr;
      annot.chrIndex = i;
      annot.px = px;
      annot.startPx = startPx;
      annot.stopPx = stopPx;

      if (config.annotationTracks) {
        // Client annotations, as in annotations-tracks.html
        annot.trackIndex = ra[3];
        annotTrack = config.annotationTracks[annot.trackIndex];
        if (annotTrack.color) {
          annot.color = annotTrack.color;
        }
        if (annotTrack.shape) {
          annot.shape = annotTrack.shape;
        }
        annots[m].annots.push(annot);
      } else if (keys[3] === 'trackIndex' && numAvailTracks !== 1) {
        // Sparse server annotations, as in annotations-track-filters.html
        annot.trackIndex = ra[3];
        annot.trackIndexOriginal = ra[4];
        annot.color = '#' + colors[annot.trackIndexOriginal];

        // Catch annots that will be omitted from display
        if (annot.trackIndex > numTracks - 1) {
          if (annot.trackIndex in omittedAnnots) {
            omittedAnnots[annot.trackIndex].push(annot);
          } else {
            omittedAnnots[annot.trackIndex] = [annot];
          }
          continue;
        }
        annots[m].annots.push(annot);
      } else if (
        keys.length > 3 &&
        keys[3] in {trackIndex: 1, color: 1, shape: 1} === false &&
        keys[4] === 'trackIndexOriginal'
      ) {
        // Dense server annotations
        for (n = 4; n < keys.length; n++) {
          thisAnnot = Object.assign({}, annot); // copy by value
          thisAnnot.trackIndex = n - 4;
          thisAnnot.trackIndexOriginal = n - 3;
          thisAnnot.color = '#' + colors[thisAnnot.trackIndexOriginal];
          annots[m].annots.push(thisAnnot);
        }
      } else {
        // Basic client annotations, as in annotations-basic.html
        // and annotations-external.html
        annot.trackIndex = 0;
        if (!annot.color) {
          annot.color = config.annotationsColor;
        }
        if (!annot.shape) {
          annot.shape = 'triangle';
        }
        annots[m].annots.push(annot);
      }
    }
  }

  numOmittedTracks = Object.keys(omittedAnnots).length;
  if (numOmittedTracks) {
    console.warn(
      'Ideogram configuration specified ' + numTracks + ' tracks, ' +
      'but loaded annotations contain ' + numOmittedTracks + ' ' +
      'extra tracks.'
    );
  }

  // Ensure annotation containers are ordered by chromosome
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

export {processAnnotData}