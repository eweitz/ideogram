
/**
 * Returns and sets bars used for histogram
 */
function getHistogramBars(annots) {
  var t0 = new Date().getTime();

  var i, j, chr,
    chrModel, chrModels, chrPxStop, px, bp,
    chrAnnots, chrName, chrIndex, annot,
    bars, bar, barPx, nextBarPx, barWidth,
    maxAnnotsPerBar, color, lastBand,
    numBins, barAnnots, barCount, height,
    firstGet = false,
    histogramScaling,
    ideo = this;

  bars = [];

  barWidth = ideo.config.barWidth;
  chrModels = ideo.chromosomes[ideo.config.taxid];
  color = ideo.config.annotationsColor;

  if ('histogramScaling' in ideo.config) {
    histogramScaling = ideo.config.histogramScaling;
  } else {
    histogramScaling = 'relative';
  }

  if (typeof ideo.maxAnnotsPerBar === 'undefined') {
    ideo.maxAnnotsPerBar = {};
    firstGet = true;
  }

  for (chr in chrModels) {
    chrModel = chrModels[chr];
    chrIndex = chrModel.chrIndex;
    lastBand = chrModel.bands[chrModel.bands.length - 1];
    chrPxStop = lastBand.px.stop;
    numBins = Math.round(chrPxStop / barWidth);
    bar = {chr: chr, annots: []};
    for (i = 0; i < numBins; i++) {
      px = i * barWidth - ideo.bump;
      bp = ideo.convertPxToBp(chrModel, px + ideo.bump);
      bar.annots.push({
        bp: bp,
        px: px,
        count: 0,
        chrIndex: chrIndex,
        chrName: chr,
        color: color,
        annots: []
      });
    }
    bars.push(bar);
  }

  for (chr in annots) {
    chrAnnots = annots[chr].annots;
    chrName = annots[chr].chr;
    chrModel = chrModels[chrName];
    chrIndex = chrModel.chrIndex;
    barAnnots = bars[chrIndex].annots;
    for (i = 0; i < chrAnnots.length; i++) {
      annot = chrAnnots[i];
      px = annot.px - ideo.bump;
      for (j = 0; j < barAnnots.length; j++) {
        barPx = barAnnots[j].px;
        nextBarPx = barPx + barWidth;
        if (j === barAnnots.length - 1) {
          nextBarPx += barWidth;
        }
        if (px >= barPx && px < nextBarPx) {
          bars[chrIndex].annots[j].count += 1;
          bars[chrIndex].annots[j].annots.push(annot);
          break;
        }
      }
    }
  }

  if (firstGet === true || histogramScaling === 'relative') {
    maxAnnotsPerBar = 0;
    for (i = 0; i < bars.length; i++) {
      annots = bars[i].annots;
      for (j = 0; j < annots.length; j++) {
        barCount = annots[j].count;
        if (barCount > maxAnnotsPerBar) {
          maxAnnotsPerBar = barCount;
        }
      }
    }
    ideo.maxAnnotsPerBar[chr] = maxAnnotsPerBar;
  }

  // Set each bar's height to be proportional to
  // the height of the bar with the most annotations
  for (i = 0; i < bars.length; i++) {
    annots = bars[i].annots;
    for (j = 0; j < annots.length; j++) {
      barCount = annots[j].count;
      height = (barCount / ideo.maxAnnotsPerBar[chr]) * ideo.config.chrMargin;
      // console.log(height)
      bars[i].annots[j].height = height;
    }
  }

  var t1 = new Date().getTime();
  if (ideo.config.debug) {
    console.log('Time spent in getHistogramBars: ' + (t1 - t0) + ' ms');
  }

  ideo.bars = bars;

  return bars;
}

export {getHistogramBars}