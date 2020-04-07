export function getRegionsR1AndR2(regions, ideo, xOffset = null) {
  var r1, r2,
    r1Offset, r2Offset;

  r1 = regions.r1;
  r2 = regions.r2;

  if (typeof r1.chr === 'string') {
    const taxids = ideo.config.taxids;
    if (ideo.config.multiorganism) {
      r1.chr = ideo.chromosomes[taxids[0]][r1.chr];
      r2.chr = ideo.chromosomes[taxids[1]][r2.chr];
    } else {
      r1.chr = ideo.chromosomes[taxids[0]][r1.chr];
      r2.chr = ideo.chromosomes[taxids[0]][r2.chr];
    }
  }

  var r1ChrDom = document.querySelector('#' + r1.chr.id + '-chromosome-set');
  var r1GenomeOffset = r1ChrDom.getCTM().f;
  var r2ChrDom = document.querySelector('#' + r2.chr.id + '-chromosome-set');
  // var r2GenomeOffset = r2ChrDom.getBoundingClientRect().top;
  var r2GenomeOffset = r2ChrDom.getCTM().f;

  if (xOffset === null) {
    // When collinear
    r1Offset = r1GenomeOffset - 12;
    r2Offset = r2GenomeOffset - 12;
  } else {
    // When parallel
    r1Offset = xOffset;
    r2Offset = xOffset;
  }

  r1.startPx = ideo.convertBpToPx(r1.chr, r1.start) + r1Offset;
  r1.stopPx = ideo.convertBpToPx(r1.chr, r1.stop) + r1Offset;
  r2.startPx = ideo.convertBpToPx(r2.chr, r2.start) + r2Offset;
  r2.stopPx = ideo.convertBpToPx(r2.chr, r2.stop) + r2Offset;

  return [r1, r2];
}