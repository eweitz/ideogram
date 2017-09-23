/**
 * Converts base pair coordinates to pixel offsets.
 * Bp-to-pixel scales differ among cytogenetic bands.
 */
function convertBpToPx(chr, bp) {
  var i, band, bpToIscnScale, iscn, px, offset, pxStart, pxLength, iscnStart,
    iscnStop, iscnLength, bpStart, bpStop, bpLength;

  for (i = 0; i < chr.bands.length; i++) {
    band = chr.bands[i];

    offset = this._bandsXOffset;
    bpStart = band.bp.start;
    bpStop = band.bp.stop;
    bpLength = bpStop - bpStart;
    iscnStart = band.iscn.start;
    iscnStop = band.iscn.stop;
    iscnLength = iscnStop - iscnStart;
    pxStart = band.px.start;
    pxLength = band.px.width;

    if (bp >= bpStart && bp <= bpStop) {
      bpToIscnScale = iscnLength / bpLength;
      iscn = iscnStart + (bp - bpStart) * bpToIscnScale;

      px = offset + pxStart + (pxLength * (iscn - iscnStart) / (iscnLength));

      return px;
    }
  }

  throw new Error(
    'Base pair out of range.  ' +
    'bp: ' + bp + '; length of chr' + chr.name + ': ' + band.bp.stop
  );
}

/**
 * Converts base pair coordinates to pixel offsets.
 * Bp-to-pixel scales differ among cytogenetic bands.
 */
function convertPxToBp(chr, px) {
  var i, band, pxToIscnScale, iscn, bp, pxLength,
    pxStart, pxStop, iscnStart, iscnStop, bpLength, iscnLength;

  if (px === 0) {
    px = chr.bands[0].px.start;
  }

  for (i = 0; i < chr.bands.length; i++) {
    band = chr.bands[i];

    pxStart = band.px.start;
    pxStop = band.px.stop;
    iscnStart = band.iscn.start;
    iscnStop = band.iscn.stop;

    if (px >= pxStart && px <= pxStop) {
      iscnLength = iscnStop - iscnStart;
      pxLength = pxStop - pxStart;
      bpLength = band.bp.stop - band.bp.start;

      pxToIscnScale = iscnLength / pxLength;
      iscn = iscnStart + (px - pxStart) * pxToIscnScale;

      bp = band.bp.start + (bpLength * (iscn - iscnStart) / iscnLength);

      return Math.round(bp);
    }
  }

  throw new Error(
    'Pixel out of range.  ' +
    'px: ' + px + '; length of chr' + chr.name + ': ' + pxStop
  );
}

export {convertBpToPx, convertPxToBp};