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

/**
 * Converts base pair coordinates to pixel offsets.
 * Bp-to-pixel scales differ among cytogenetic bands.
 *
 * For example, if we want to depict a gene on a chromosome, then we need
 * to convert the gene's location in base pairs to a location in pixels offset
 * from the start of the chromosome.
 */
function convertBpToPx(chr, bp) {
  var i, band, bpToIscnScale, iscn, px, pxStart, pxLength,
    iscnStart, iscnStop, iscnLength, bpStart, bpStop, bpLength;

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

      return px;
    }
  }

  throw new Error(
    'Base pair out of range.  ' +
    'bp: ' + bp + '; length of chr' + chr.name + ': ' + band.bp.stop
  );
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