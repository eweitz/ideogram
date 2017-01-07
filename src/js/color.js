function Color(config) {
    // Ideogram config
    this._config = config;
    this._ploidy = new Ploidy(this._config);
}


Color.prototype.getArmColor = function(chrSetNumber, chrNmber, armNumber) {

    if (this._config.armColors) {
        return this._config.armColors[armNumber];
    } else if (this._config.ancestors) {
        return this._getPolyploidArmColor(chrSetNumber, chrNmber, armNumber);
    } else {
        return null;
    }
};


Color.prototype.getBorderColor = function(chrSetNumber, chrNmber, armNumber) {

    if (chrNmber < this._config.ploidy) {
        return '#000';
    } else if (this._ploidy.isExists(chrSetNumber, chrNmber, armNumber)) {
        return '#000';
    } else {
        return '#fff';
    }
};


Color.prototype._getPolyploidArmColor = function(chrSetNumber, chrNmber, armNumber) {

    if (! this._ploidy.isExists(chrSetNumber, chrNmber, armNumber)) {
        return 'transparent';
    } else {
        return this._config.ancestors[this._ploidy.getAncestor(chrSetNumber, chrNmber, armNumber)];
    }
};
