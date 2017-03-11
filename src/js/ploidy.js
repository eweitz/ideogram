function Ploidy(config) {
  this._config = config;
  this._description = this._normalize(this._config.ploidyDesc);
}

// Get number of chromosomes in a chromosome set
Ploidy.prototype.getChromosomesNumber = function(setNumber) {
  if (this._config.ploidyDesc) {
    var chrSetCode = this._config.ploidyDesc[setNumber];
    if (chrSetCode instanceof Object) {
      return Object.keys(chrSetCode)[0].length;
    } else {
      return chrSetCode.length;
    }
  } else {
    return this._config.ploidy || 1;
  }
};

// Normalize use defined description
Ploidy.prototype._normalize = function(description) {

  var normalized, key, descValue;

  // Return the same if no description provided
  if (!description) {
    return description;
  }

  // Array of normalized description objects
  normalized = [];

  // Loop through description and normalize
  for (key in description) {
    descValue = description[key];
    if (typeof descValue === 'string') {
      if (this._config.orientation === 'vertical') {
        descValue = descValue.split('').reverse();
      }
      normalized.push({
        ancestors: descValue,
        existence: this._getexistenceArray(descValue.length)
      });
    } else {
      normalized.push({
        ancestors: Object.keys(descValue)[0],
        existence: descValue[Object.keys(descValue)[0]]
      });
    }
  }

  return normalized;
};

// Get array filled by '11' elements
Ploidy.prototype._getexistenceArray = function(length) {
  var array = [];

  for (var i = 0; i < length; i++) {
    array.push('11');
  }

  return array;
};

Ploidy.prototype.getSetSize = function(chrSetNumber) {
  if (this._description) {
    return this._description[chrSetNumber].ancestors.length;
  } else {
    return 1;
  }
};

// Get ancestor letter
Ploidy.prototype.getAncestor = function(chrSetNumber, chrNumber) {
  if (this._description) {
    return this._description[chrSetNumber].ancestors[chrNumber];
  } else {
    return '';
  }
};

// Check if chromosome's arm should be rendered.
// If no description was provided, method returns true and
// something another depending on user provided description.
Ploidy.prototype.exists = function(chrSetNumber, chrNumber, armNumber) {
  if (this._description) {
    var desc = this._description[chrSetNumber].existence[chrNumber][armNumber];
    return Number(desc) > 0;
  } else {
    return true;
  }
};
