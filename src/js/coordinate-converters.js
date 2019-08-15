/**
 * @fileoverview Methods to convert to and from different types of coordinates.
 *
 * Ideogram.js uses multiple coordinate systems, e.g. base pairs (bp) and
 * pixels (px).  These methods interconvert between those coordinate systems.
 *
 * TODO:
 * - Add methods to interconvert between ISCN coordinates and base pairs,
 * pixels.
 */

function throwBpToPxError(bp, chr, band) {
  throw new Error(
    'Base pair out of range.  ' +
    'bp: ' + bp + '; length of chr' + chr.name + ': ' + band.bp.stop
  );
}

function getPx(chr, bp) {
  var i, px, band, bpToIscnScale, iscn, iscnStart, iscnStop, iscnLength,
    bpStart, bpStop, bpLength, pxStart, pxLength;

  for (i = 0; i < chr.bands.length; i++) {
    band = chr.bands[i];
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
      px = pxStart + (pxLength * (iscn - iscnStart) / (iscnLength));

      return [px, band];
    }
  }
  return [null, band];
}

/**
 * Converts base pair coordinates to pixel offsets.
 * Bp-to-pixel scales differ among cytogenetic bands.
 *
 * For example, if we want to depict a gene on a chromosome, then we need
 * to convert the gene's location in base pairs to a location in pixels offset
 * from the start of the chromosome.
 */
function convertBpToPx(chr, bp) {
  var band, px;

  if (chr.bands.length > 1) {
    [px, band] = getPx(chr, bp);
    if (px !== null) return px;
  } else if (bp >= 1 && bp <= chr.length) {
    px = chr.scale.bp * bp;
    return px;
  }

  throwBpToPxError(bp, chr, band);
}

function throwPxToBpError(px, chr, pxStop) {
  throw new Error(
    'Pixel out of range.  ' +
    'px: ' + px + '; length of chr' + chr.name + ': ' + pxStop
  );
}

function getBp(iscnStop, iscnStart, px, pxStop, pxStart, band, iscnLength) {
  var pxLength, bpLength, pxToIscnScale, iscn, bp;

  iscnLength = iscnStop - iscnStart;
  pxLength = pxStop - pxStart;
  bpLength = band.bp.stop - band.bp.start;

  pxToIscnScale = iscnLength / pxLength;
  iscn = iscnStart + (px - pxStart) * pxToIscnScale;

  bp = band.bp.start + (bpLength * (iscn - iscnStart) / iscnLength);

  return Math.round(bp);
}

/**
 * Converts pixel offsets to base pair coordinates.
 * Pixel-to-bp scales differ among cytogenetic bands.
 *
 * For example, if we want to determine the genomic location a user clicked on
 * (e.g. when creating a brush / sliding window region), then we need to
 * convert pixels to base pairs.
 */
function convertPxToBp(chr, px) {
  var i, band, bp, pxStart, pxStop, iscnStart, iscnStop, iscnLength;

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
      bp = getBp(iscnStop, iscnStart, px, pxStop, pxStart, band, iscnLength);
      return bp;
    }
  }
  throwPxToBpError(px, chr, pxStop);
}

export {convertBpToPx, convertPxToBp};
