/**
 * @fileoverview Instance methods for sex chromosomes (allosomes).
 *
 * This module provides methods for drawing karyotypically normal
 * male and female mammalian genomes.
 */

import {getChromosomeModel} from './views/chromosome-model';

/**
 * Appends SVG elements depicting sex chromosomes to the document.
 */
function drawSexChromosomes(container, chrIndex) {
  var bandsArray, taxid, chrs,
    sexChromosomeIndexes, sciLength,
    chromosome, bands, chrModel, sci, homologIndex,
    ideo = this;

  bandsArray = ideo.bandsArray;
  taxid = ideo.config.taxid;
  chrs = ideo.config.chromosomes[taxid];

  if (ideo.config.sex === 'male') {
    sexChromosomeIndexes = [1, 0];
  } else {
    sexChromosomeIndexes = [0, 0];
  }

  sciLength = sexChromosomeIndexes.length;

  for (homologIndex = 0; homologIndex < sciLength; homologIndex++) {
    sci = sexChromosomeIndexes[homologIndex] + chrIndex;
    chromosome = chrs[sci];
    bands = bandsArray[taxid][sci];
    chrModel = getChromosomeModel(bands, chromosome, taxid, sci, ideo);
    ideo.appendHomolog(chrModel, chrIndex, homologIndex, container);
  }
}

/**
 * Sets instance properties regarding sex chromosomes.
 * Currently only supported for mammals.
 * TODO: Support all sexually reproducing taxa
 *   XY sex-determination (mammals):
 *     - Male: XY <- heterogametic
 *     - Female: XX
 *   ZW sex-determination (birds):
 *     - Male: ZZ
 *     - Female: ZW <- heterogametic
 *   X0 sex-determination (some insects):
 *     - Male: X0, i.e. only X <- heterogametic?
 *     - Female: XX
 * TODO: Support sex chromosome aneuploidies in mammals
 *     - Turner syndrome: X0
 *     - Klinefelter syndome: XXY
 *  More types:
 *  https://en.wikipedia.org/wiki/Category:Sex_chromosome_aneuploidies
 */
function setSexChromosomes(chrs) {
  var chr, i,
    ideo = this,
    sexChrs = {X: 1, Y: 1};

  if (this.config.ploidy !== 2 || !this.config.sex) return;

  ideo.sexChromosomes.list = [];

  for (i = 0; i < chrs.length; i++) {
    chr = chrs[i];
    if (ideo.config.sex === 'male' && chr in sexChrs) {
      ideo.sexChromosomes.list.push(chr);
      if (!ideo.sexChromosomes.index) {
        ideo.sexChromosomes.index = i;
      }
    } else if (chr === 'X') {
      ideo.sexChromosomes.list.push(chr, chr);
      ideo.sexChromosomes.index = i;
    }
  }
}

export {drawSexChromosomes, setSexChromosomes};
