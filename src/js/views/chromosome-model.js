function getChromosomePixels(chr) {

  var bands, chrHeight, pxStop, hasBands, maxLength, band, cs, csLength,
    width, chrLength;

  bands = chr.bands;
  chrHeight = this.config.chrHeight;
  pxStop = 0;
  cs = this.coordinateSystem;
  hasBands = (typeof bands !== 'undefined');
  maxLength = this.maxLength;
  chrLength = chr.length;

  if (hasBands) {
    for (var i = 0; i < bands.length; i++) {
      band = bands[i];
      csLength = band[cs].stop - band[cs].start;

      // If ideogram is rotated (and thus showing only one chromosome),
      // then set its width independent of the longest chromosome in this
      // genome.
      if (this._layout._isRotated) {
        width = chrHeight * csLength / chrLength;
      } else {
        width = chrHeight * chr.length / maxLength[cs] * csLength / chrLength;
      }

      bands[i].px = {
        start: pxStop,
        stop: pxStop + width,
        width: width
      };

      pxStop = bands[i].px.stop;

      if (hasBands && band.stain === 'acen' && band.name[0] === 'p') {
        chr.pcenIndex = i;
      }
    }
  } else {
    pxStop = chrHeight * chr.length / maxLength[cs];
  }

  chr.width = pxStop;

  chr.scale = {};

  // TODO:
  //
  // A chromosome-level scale property is likely
  // nonsensical for any chromosomes that have cytogenetic band data.
  // Different bands tend to have ratios between number of base pairs
  // and physical length.
  //
  // However, a chromosome-level scale property is likely
  // necessary for chromosomes that do not have band data.
  //
  // This needs further review.
  if (this.config.multiorganism === true) {
    chr.scale.bp = 1;
    // chr.scale.bp = band.iscn.stop / band.bp.stop;
    chr.scale.iscn = chrHeight * chrLength / maxLength.bp;
  } else {
    chr.scale.bp = chrHeight / maxLength.bp;
    if (hasBands) {
      chr.scale.iscn = chrHeight / maxLength.iscn;
    }
  }
  chr.bands = bands;

  return chr;
}

/**
 * Generates a model object for each chromosome containing information on
 * its name, DOM ID, length in base pairs or ISCN coordinates, cytogenetic
 * bands, centromere position, etc.
 */
function getChromosomeModel(bands, chrName, taxid, chrIndex) {
  var chr = {},
    cs, hasBands;

  cs = this.coordinateSystem;
  hasBands = (typeof bands !== 'undefined');

  if (hasBands) {
    chr.name = chrName;
    chr.length = bands[bands.length - 1][cs].stop;
    chr.type = 'nuclear';
  } else {
    chr = chrName;
  }

  chr.chrIndex = chrIndex;

  chr.id = 'chr' + chr.name + '-' + taxid;

  if (this.config.fullChromosomeLabels === true) {
    var orgName = this.organisms[taxid].scientificNameAbbr;
    chr.name = orgName + ' chr' + chr.name;
  }

  chr.bands = bands;
  chr = this.getChromosomePixels(chr);

  chr.centromerePosition = '';

  if (
    hasBands && bands[0].name[0] === 'p' && bands[1].name[0] === 'q' &&
    bands[0].bp.stop - bands[0].bp.start < 2E6
  ) {
    // As with almost all mouse chromosome, chimpanzee chr22
    chr.centromerePosition = 'telocentric';
  }

  if (hasBands && chr.bands.length === 1) {
    // Encountered when processing an assembly that has chromosomes with
    // centromere data, but this chromosome does not.
    // Example: chromosome F1 in Felis catus.
    delete chr.bands;
  }

  return chr;
}

export {getChromosomeModel, getChromosomePixels};