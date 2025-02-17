import {shouldUseThreshold} from './heatmap-lib';

function histogramAnnots(ideo, annot) {
  var value, thresholds, histogramKeyIndexes, height;
  var keys = ideo.rawAnnots.keys;
  histogramKeyIndexes = [];
  for (var i = 0; i < ideo.config.histogram.length; i++) {
    var histogramKey = ideo.config.histogram[i].key;
    histogramKeyIndexes.push(keys.indexOf(histogramKey));
  }

  value = annot[keys[histogramKeyIndexes]];
  if (ideo.config.histogram) {
    thresholds = ideo.config.histogram.thresholds;
    height = getHistogramHeight(thresholds, value, ideo);
  }
  return height;
}

function getHistogramHeight(thresholds, value, ideo) {
  var thresholds = ideo.config.histogram[0].thresholds;
  var m, numThresholds, thresholdList, threshold, tvNum,
    prevThreshold, useThresholdHeight, height;

  for (m = 0; m < thresholds.length; m++) {
    numThresholds = thresholds.length - 1;
    thresholdList = thresholds[m];
    threshold = thresholdList[0];

    tvNum = parseFloat(threshold);
    if (isNaN(tvNum) === false) threshold = tvNum;
    if (m !== 0) prevThreshold = parseFloat(thresholds[m - 1][0]);

    useThresholdHeight = shouldUseThreshold(m, numThresholds, value,
      prevThreshold, threshold);

    if (useThresholdHeight) height = parseFloat(thresholdList[1]);
  }

  return height;
}

/**
 * Get containers to group individual annotations into higher-level "bar"
 * annotations.
 */
function getRawBars(chrModels, ideo) {
  var chr, chrModel, lastBand, numBins, bar, h, i, px,
    barWidth = ideo.config.barWidth,
    bars = [];

  for (h = 0; h < ideo.chromosomesArray.length; h++) {
    chr = ideo.chromosomesArray[h].name;
    chrModel = chrModels[chr];
    lastBand = chrModel.bands[chrModel.bands.length - 1];
    numBins = Math.round(lastBand.px.stop / barWidth); // chrPxStop / barWidth
    bar = {chr: chr, annots: []};

    for (i = 0; i < numBins; i++) {
      px = i * barWidth - ideo.bump;
      bar.annots.push({
        bp: ideo.convertPxToBp(chrModel, px + ideo.bump),
        px: px,
        count: 0,
        chrIndex: chrModel.chrIndex,
        chrName: chr,
        color: ideo.config.annotationsColor,
        annots: []
      });
    }
    bars.push(bar);
  }
  return bars;
}

/**
 * Assign how many, and which annotations each histogram bar contains
 */
function assignAnnotsToBars(annots, bars, chrModels, ideo) {
  var chrAnnots, chrModel, barAnnots, h, i, annot, px, j, barPx, nextBarPx,
    barWidth = ideo.config.barWidth;

  for (h = 0; h < annots.length; h++) {
    chrAnnots = annots[h].annots;
    chrModel = chrModels[annots[h].chr]; // get chr by name
    barAnnots = bars[chrModel.chrIndex].annots;
    for (i = 0; i < chrAnnots.length; i++) {
      annot = chrAnnots[i];
      px = annot.px - ideo.bump;
      for (j = 0; j < barAnnots.length; j++) {
        barPx = barAnnots[j].px;
        nextBarPx = barPx + barWidth;
        if (j === barAnnots.length - 1) nextBarPx += barWidth;
        if (px >= barPx && px < nextBarPx) {
          bars[chrModel.chrIndex].annots[j].count += 1;
          bars[chrModel.chrIndex].annots[j].annots.push(annot);
          break;
        }
      }
    }
  }
  return bars;
}

function setIdeoMaxAnnotsPerBar(bars, isFirstGet, ideo) {
  var maxAnnotsPerBarAllChrs, i, maxAnnotsPerBar, annots, chr, j, barCount;

  if (isFirstGet || ideo.config.histogramScaling === 'relative') {
    maxAnnotsPerBarAllChrs = 0;
    for (i = 0; i < bars.length; i++) {
      maxAnnotsPerBar = 0;
      annots = bars[i].annots;
      chr = bars[i].chr;
      for (j = 0; j < annots.length; j++) {
        barCount = annots[j].count;
        if (barCount > maxAnnotsPerBar) maxAnnotsPerBar = barCount;
        if (barCount > maxAnnotsPerBarAllChrs) {
          maxAnnotsPerBarAllChrs = barCount;
        }
      }
      ideo.maxAnnotsPerBar[chr] = maxAnnotsPerBar;
    }
    ideo.maxAnnotsPerBarAllChrs = maxAnnotsPerBarAllChrs;
  }
}

/**
 * Set each bar's height to be proportional to the height of the bar with the
 * most annotations
 */
function setProportionalBarHeight(bars, ideo) {
  var i, annots, chr, j, barCount, barCountRatio, height,
    ideoIsRotated = ideo._layout._isRotated;

  for (i = 0; i < bars.length; i++) {
    annots = bars[i].annots;
    chr = bars[i].chr;
    for (j = 0; j < annots.length; j++) {
      barCount = annots[j].count;
      if (ideo.config.histogramScaling === 'relative') {
        barCountRatio = barCount / ideo.maxAnnotsPerBar[chr];
      } else {
        barCountRatio = barCount / ideo.maxAnnotsPerBarAllChrs;
      }
      if (ideoIsRotated === false) {
        height = barCountRatio * ideo.config.chrMargin;
      } else {
        height = barCountRatio * ideo.config.chrHeightOriginal * 3;
      }
      if (isNaN(height)) {
        height = 0;
      }
      bars[i].annots[j].height = height;
    }
  }
  return bars;
}

function reportGetHistogramBarPerformance(t0, ideo) {
  var t1 = new Date().getTime();
  if (ideo.config.debug) {
    console.log('Time spent in getHistogramBars: ' + (t1 - t0) + ' ms');
  }
}

function setIdeoHistogramScaling(ideo) {
  if ('histogramScaling' in ideo.config === false) {
    ideo.config.histogramScaling = 'absolute';
  }
}

/**
 * Returns and sets bars used for histogram
 */
function getHistogramBars(annots) {
  var chrModels, bars,
    isFirstGet = false,
    t0 = new Date().getTime(),
    ideo = this;

  chrModels = ideo.chromosomes[ideo.config.taxid];

  setIdeoHistogramScaling(ideo);

  if (typeof ideo.maxAnnotsPerBar === 'undefined') {
    ideo.maxAnnotsPerBar = {};
    isFirstGet = true;
  }

  bars = getRawBars(chrModels, ideo);
  bars = assignAnnotsToBars(annots, bars, chrModels, ideo);

  setIdeoMaxAnnotsPerBar(bars, isFirstGet, ideo);
  bars = setProportionalBarHeight(bars, ideo);

  reportGetHistogramBarPerformance(t0, ideo);
  ideo.bars = bars;
  return bars;
}

function getHistogramPoints(d, chrWidth, chrWidths, ideo) {
  var x1, x2, y1, y2;

  x1 = d.px + ideo.bump;
  x2 = d.px + ideo.config.barWidth + ideo.bump;
  y1 = chrWidth;
  y2 = chrWidth + d.height;

  var thisChrWidth = chrWidths[d.chr];

  if (x2 > thisChrWidth) {
    x2 = thisChrWidth;
  }

  return (
    x1 + ',' + y1 + ' ' +
    x2 + ',' + y1 + ' ' +
    x2 + ',' + y2 + ' ' +
    x1 + ',' + y2
  );
}

function writeHistogramAnnots(chrAnnot, ideo) {
  var chrs, chr,
    chrWidths = {},
    chrWidth = ideo.config.chrWidth;

  chrs = ideo.chromosomes[ideo.config.taxid];
  for (chr in chrs) {
    chrWidths[chr] = chrs[chr];
  }

  chrAnnot.append('polygon')
    // .attr('id', function(d, i) { return d.id; })
    .attr('class', 'annot')
    .attr('points', function(d) {
      return getHistogramPoints(d, chrWidth, chrWidths, ideo);
    })
    .attr('fill', function(d) {return d.color;});
}

export {
  getHistogramBars, writeHistogramAnnots,
  getHistogramHeight, histogramAnnots
};
