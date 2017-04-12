import d3 from 'd3';

export class SmallLayout extends Layout {

  constructor(config, ideo) {
    super(config, ideo);

    this._class = 'SmallLayout';

    this._margin = {
      left: 36.5,
      top: 10
    };
  }

  rotateForward(setNumber, chrNumber, chrElement, callback) {
    var ideoBox = d3.select(this._ideo.selector).node().getBoundingClientRect();
    var chrBox = chrElement.getBoundingClientRect();

    var scaleX = (ideoBox.width / chrBox.height) * 0.97;
    var scaleY = this._getYScale();

    transform = "translate(5, 25) scale(" + scaleX + ", " + scaleY + ")";

    d3.select(chrElement.parentNode)
          .transition()
          .attr("transform", transform)
          .on('end', callback);
  };

  rotateBack(setNumber, chrNumber, chrElement, callback) {
    var translate = this.getChromosomeSetTranslate(setNumber);

    d3.select(chrElement.parentNode)
          .transition()
          .attr("transform", translate)
          .on('end', callback);
  };

  getHeight() {
    return this._config.rows * (this._config.chrHeight + this._margin.top * 1.5);
  };

  getWidth() {
    return '97%';
  };

  getChromosomeBandLabelTranslate() {

  };

  getChromosomeSetLabelTranslate() {
    return 'rotate(-90)';
  };

  getChromosomeSetTranslate(setNumber) {
      // Get organisms id list
    var organisms = [];
    this._ideo.getTaxids(function(taxIdList) {
      organisms = taxIdList;
    });
      // Get first organism chromosomes amount
    var size = this._ideo.config.chromosomes[organisms[0]].length;
      // Amount of chromosomes per number
    var rowSize = size / this._config.rows;

    var xOffset;
    var yOffset;

    if (setNumber > rowSize - 1) {
      xOffset = this._margin.left + this._config.chrHeight * 1.4;
      yOffset = this.getChromosomeSetYTranslate(setNumber - rowSize);
    } else {
      xOffset = this._margin.left;
      yOffset = this.getChromosomeSetYTranslate(setNumber);
    }

    return 'rotate(90) translate(' + xOffset + ', -' + yOffset + ')';
  };

  getChromosomeSetYTranslate(setNumber) {
      // Get additional padding caused by annotation tracks
    var additionalPadding = this._getAdditionalOffset();
      // If no detailed description provided just use one formula for all cases
    return (
      this._margin.left * (setNumber) + this._config.chrWidth +
      additionalPadding * 2 + additionalPadding * setNumber
    );
  };

  getChromosomeSetLabelXPosition(setNumber) {
    return (
      ((this._ploidy.getSetSize(setNumber) * this._config.chrWidth + 20) / -2) +
      (this._config.ploidy > 1 ? 0 : this._config.chrWidth)
    );
  };

  getChromosomeLabelXPosition() {
    return this._config.chrWidth / -2;
  };

}
