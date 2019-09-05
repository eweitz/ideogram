/**
 * Get containers to group individual annotations into higher-level "bar"
 * annotations.
 */
function getRawBars(chrModels, ideo) {
    var chr, chrModel, lastBand, numBins, bar, i, px,
        barWidth = ideo.config.barWidth,
        bars = [];

    for (chr in chrModels) {
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
 * Assign how many, and which annotations each Barplot bar contains
 */
function assignAnnotsToBars(annots, bars, chrModels, ideo) {
    var chr, chrAnnots, chrModel, barAnnots, i, annot, px, j, barPx, nextBarPx,
        barWidth = ideo.config.barWidth;

    for (chr in annots) {
        chrAnnots = annots[chr].annots;
        chrModel = chrModels[annots[chr].chr]; // get chr by name
        barAnnots = bars[chrModel.chrIndex].annots;
        for (i = 0; i < chrAnnots.length; i++) {
            annot = chrAnnots[i];
            px = annot.px - ideo.bump;
            let var_count = annot["expression-level"];
            for (j = 0; j < barAnnots.length; j++) {
                barPx = barAnnots[j].px;
                nextBarPx = barPx + barWidth;
                if (j === barAnnots.length - 1) nextBarPx += barWidth;
                if (px >= barPx && px < nextBarPx) {
                    bars[chrModel.chrIndex].annots[j].count += var_count;
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

    if (isFirstGet || ideo.config.BarplotScaling === 'relative') {
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
            if (ideo.config.BarplotScaling === 'relative') {
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

function reportGetBarplotBarPerformance(t0, ideo) {
    var t1 = new Date().getTime();
    if (ideo.config.debug) {
        console.log('Time spent in getBarplotBars: ' + (t1 - t0) + ' ms');
    }
}

function setIdeoBarplotScaling(ideo) {
    if ('BarplotScaling' in ideo.config === false) {
        ideo.config.BarplotScaling = 'absolute';
    }
}

/**
 * Returns and sets bars used for Barplot
 */
function getBarplotBars(annots) {
    var chrModels, bars,
        isFirstGet = false,
        t0 = new Date().getTime(),
        ideo = this;

    chrModels = ideo.chromosomes[ideo.config.taxid];

    setIdeoBarplotScaling(ideo);

    if (typeof ideo.maxAnnotsPerBar === 'undefined') {
        ideo.maxAnnotsPerBar = {};
        isFirstGet = true;
    }

    bars = getRawBars(chrModels, ideo);
    bars = assignAnnotsToBars(annots, bars, chrModels, ideo);
    setIdeoMaxAnnotsPerBar(bars, isFirstGet, ideo);
    bars = setProportionalBarHeight(bars, ideo);

    reportGetBarplotBarPerformance(t0, ideo);
    ideo.bars = bars;
    return bars;
}

function getBarplotPoints(d, chrWidth, chrWidths, ideo) {
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

function writeBarplotAnnots(chrAnnot, ideo) {
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
            return getBarplotPoints(d, chrWidth, chrWidths, ideo);
        })
        .attr('fill', function(d) { return d.color; });
}

export {getBarplotBars, writeBarplotAnnots};
