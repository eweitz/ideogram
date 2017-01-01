// Telocentric chromosome view class
function TelocentricChromosome(model, config, ideo) {

    Chromosome.call(this, model, config, ideo);
    this._class = 'TelocentricChromosome';
    this._pArmOffset = 3;
}


TelocentricChromosome.prototype = Object.create(Chromosome.prototype);


TelocentricChromosome.prototype._addPArmShape = function(clipPath, isPArmRendered) {
    return clipPath.concat(this._getPArmShape());
};


TelocentricChromosome.prototype._getPArmShape = function() {

    var d = this._getShapeData();
    d.o = this._pArmOffset;

    return [{
        'class' : 'acen',
        'path' : 'M' + d.x2 + ',1' +
            'L' + (d.x2 - d.o) + ',1 ' +
            'L' + (d.x2 - d.o) + ',' + (d.w - 1) + ' ' +
            'L' + d.x2 + ',' + (d.w - 1)
    }, {
        'class' : 'gpos100',
        'path' : 'M' + (d.x2 - d.o + 1) + ',0' +
        'L' + (d.x2 - d.o) + ',0 ' +
        'L' + (d.x2 - d.o) + ',' + d.w + ' ' +
        'L' + (d.x2 - d.o + 1) + ',' + d.w
    }];
};


TelocentricChromosome.prototype._getQArmShape = function() {

    var d = this._getShapeData();

    return {
        'class' : '',
        'path' : 'M' + d.x2 + ',0 ' +
            'L' + (d.x3 - d.b) + ',0 ' +
            'Q' + (d.x3 + d.b) + ',' + (d.w / 2) + ',' + (d.x3 - d.b) + ',' + d.w + ' ' +
            'L' + d.x2 + ',' + d.w
    };
};
