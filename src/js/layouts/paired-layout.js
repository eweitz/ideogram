/**
* @fileoverview Paired layout class
* Ideograms with paired layout group each chromosome in a chromosome set.
* This enables ploidy support beyond the default haploid; e.g. diploid genomes.
*/

import Layout from './layout';

class PairedLayout extends Layout {

  constructor(config, ideo) {
    super(config, ideo);

    this._class = 'PairedLayout';

    this.margin = {
      left: 30
    };
  }

  getHeight() {
    return this._config.chrHeight + this.margin.left * 1.5;
  }

  getWidth() {
    return '97%';
  }

  getChromosomeBandTickY1(chrIndex) {
    return chrIndex % 2 ? this._config.chrWidth : this._config.chrWidth * 2;
  }

  getChromosomeBandTickY2(chrIndex) {
    var width = this._config.chrWidth;
    return chrIndex % 2 ? width - this._tickSize : width * 2 + this._tickSize;
  }

  getChromosomeBandLabelAnchor(chrIndex) {
    return chrIndex % 2 ? null : 'end';
  }

  getChromosomeBandLabelTranslate(band, chrIndex) {
    var x = chrIndex % 2 ? 10 : -this._config.chrWidth - 10;
    var y = this._ideo.round(band.px.start + band.px.width / 2) + 3;

    return {
      x: y,
      y: y,
      translate: 'rotate(-90) translate(' + x + ', ' + y + ')'
    };
  }

  getChromosomeLabelXPosition() {
    return -this._tickSize;
  }

  getChromosomeSetLabelXPosition() {
    return this._config.chrWidth / -2;
  }

  getChromosomeSetLabelTranslate() {
    return 'rotate(-90)';
  }

  getChromosomeSetTranslate(setIndex) {
    var chromosomeSetYTranslate = this.getChromosomeSetYTranslate(setIndex);
    return (
      'rotate(90) ' +
      'translate(' + this.margin.left + ', -' + chromosomeSetYTranslate + ')'
    );
  }

  getChromosomeSetYTranslate(setIndex) {
    return 200 * (setIndex + 1);
  }

}

export default PairedLayout;
