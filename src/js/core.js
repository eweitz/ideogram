// Developed by Eric Weitz (https://github.com/eweitz)

/* Constructs a prototypal Ideogram class */
var Ideogram = function(config) {

  var orientation,
    chrWidth, chrHeight,
    container, rect;

  // Clone the config object, to allow multiple instantiations
  // without picking up prior ideogram's settings
  this.config = JSON.parse(JSON.stringify(config));

  // Organism ploidy description
  this._ploidy = new Ploidy(this.config);

  // Chromosome's layout
  this._layout = Layout.getInstance(this.config, this);

  // TODO: Document this
  this._bandsXOffset = 30;

  this.debug = false;

  if (!this.config.ploidy) {
    this.config.ploidy = 1;
  }

  if (!this.config.bandDir) {
    this.config.bandDir = "../data/bands/";
  }

  if (!this.config.container) {
    this.config.container = "body";
  }

  if (!this.config.resolution) {
    this.config.resolution = 850;
  }

  if ("showChromosomeLabels" in this.config === false) {
    this.config.showChromosomeLabels = true;
  }

  if (!this.config.chrMargin) {
    this.config.chrMargin = 10;
  }

  if (!this.config.orientation) {
    orientation = "vertical";
    this.config.orientation = orientation;
  }

  if (!this.config.chrHeight) {
    container = this.config.container;
    rect = document.querySelector(container).getBoundingClientRect();

    if (orientation === "vertical") {
      chrHeight = rect.height;
    } else {
      chrHeight = rect.width;
    }

    if (container === "body") {
      chrHeight = 500;
    }
    this.config.chrHeight = chrHeight;
  }

  if (!this.config.chrWidth) {
    chrWidth = 10;
    chrHeight = this.config.chrHeight;

    if (chrHeight < 900 && chrHeight > 500) {
      chrWidth = Math.round(chrHeight / 40);
    } else if (chrHeight >= 900) {
      chrWidth = Math.round(chrHeight / 45);
    }
    this.config.chrWidth = chrWidth;
  }

  if (!this.config.showBandLabels) {
    this.config.showBandLabels = false;
  }

  if (!this.config.brush) {
    this.config.brush = false;
  }

  if (!this.config.rows) {
  	this.config.rows = 1;
  }

  this.bump = Math.round(this.config.chrHeight / 125);
  this.adjustedBump = false;
  if (this.config.chrHeight < 200) {
    this.adjustedBump = true;
    this.bump = 4;
  }

  if (config.showBandLabels) {
    this.config.chrMargin += 20;
  }

  if (config.chromosome) {
    this.config.chromosomes = [config.chromosome];
    if ("showBandLabels" in config === false) {
      this.config.showBandLabels = true;
    }
    if ("rotatable" in config === false) {
      this.config.rotatable = false;
    }
  }

  if (!this.config.showNonNuclearChromosomes) {
    this.config.showNonNuclearChromosomes = false;
  }

  this.initAnnotSettings();

  this.config.chrMargin = (
    this.config.chrMargin +
    this.config.chrWidth +
    this.config.annotTracksHeight * 2
  );

  if (config.onLoad) {
    this.onLoadCallback = config.onLoad;
  }

  if (config.onDrawAnnots) {
    this.onDrawAnnotsCallback = config.onDrawAnnots;
  }

  if (config.onBrushMove) {
    this.onBrushMoveCallback = config.onBrushMove;
  }

  this.coordinateSystem = "iscn";

  this.maxLength = {
    bp: 0,
    iscn: 0
  };

  // The E-Utilies In Depth: Parameters, Syntax and More:
  // https://www.ncbi.nlm.nih.gov/books/NBK25499/
  this.eutils = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
  this.esearch = this.eutils + "esearch.fcgi?retmode=json";
  this.esummary = this.eutils + "esummary.fcgi?retmode=json";
  this.elink = this.eutils + "elink.fcgi?retmode=json";

  this.organisms = {
    9606: {
      commonName: "Human",
      scientificName: "Homo sapiens",
      scientificNameAbbr: "H. sapiens",
      assemblies: { // technically, primary assembly unit of assembly
        default: "GCF_000001305.14", // GRCh38
        GRCh38: "GCF_000001305.14",
        GRCh37: "GCF_000001305.13"
      }
    },
    10090: {
      commonName: "Mouse",
      scientificName: "Mus musculus",
      scientificNameAbbr: "M. musculus",
      assemblies: {
        default: "GCF_000000055.19"
      }
    },
    7227: {
      commonName: "Fly",
      scientificName: "Drosophlia melanogaster",
      scientificNameAbbr: "D. melanogaster"
    },
    4641: {
      commonName: "banana",
      scientificName: "Musa acuminata",
      scientificNameAbbr: "M. acuminata",
      assemblies: {
        default: "mock"
      }
    }
  };

  // A flat array of chromosomes
  // (this.chromosomes is an object of
  // arrays of chromosomes, keyed by organism)
  this.chromosomesArray = [];

  this.bandsToShow = [];

  this.chromosomes = {};
  this.numChromosomes = 0;
  this.bandData = {};

  this.init();
};

/**
* Gets chromosome band data from a
* TSV file, or, if band data is prefetched, from an array
*
* UCSC: #chrom chromStart  chromEnd  name  gieStain
* http://genome.ucsc.edu/cgi-bin/hgTables
*  - group: Mapping and Sequencing
*  - track: Chromosome Band (Ideogram)
*
* NCBI: #chromosome  arm band  iscn_start  iscn_stop bp_start  bp_stop stain density
* ftp://ftp.ncbi.nlm.nih.gov/pub/gdp/ideogram_9606_GCF_000001305.14_550_V1
*/
Ideogram.prototype.getBands = function(content, taxid, chromosomes) {
  var lines = {},
    delimiter, tsvLines, columns, line, stain, chr,
    i, init, tsvLinesLength, source,
    start, stop, firstColumn;

  if (content.slice(0, 8) === "chrBands") {
    source = "native";
  }

  if (typeof chrBands === "undefined" && source !== "native") {
    delimiter = /\t/;
    tsvLines = content.split(/\r\n|\n/);
    init = 1;
  } else {
    delimiter = / /;
    if (source === "native") {
      tsvLines = eval(content);
    } else {
      tsvLines = content;
    }
    init = 0;
  }

  firstColumn = tsvLines[0].split(delimiter)[0];
  if (firstColumn === '#chromosome') {
    source = 'ncbi';
  } else if (firstColumn === '#chrom') {
    source = 'ucsc';
  } else {
    source = 'native';
  }

  tsvLinesLength = tsvLines.length;

  if (source === 'ncbi' || source === 'native') {
    for (i = init; i < tsvLinesLength; i++) {
      columns = tsvLines[i].split(delimiter);

      chr = columns[0];

      if (
        // If a specific set of chromosomes has been requested, and
        // the current chromosome
        typeof (chromosomes) !== "undefined" &&
        chromosomes.indexOf(chr) === -1
      ) {
        continue;
      }

      if (chr in lines === false) {
        lines[chr] = [];
      }

      stain = columns[7];
      if (columns[8]) {
        // For e.g. acen and gvar, columns[8] (density) is undefined
        stain += columns[8];
      }

      line = {
        chr: chr,
        bp: {
          start: parseInt(columns[5], 10),
          stop: parseInt(columns[6], 10)
        },
        iscn: {
          start: parseInt(columns[3], 10),
          stop: parseInt(columns[4], 10)
        },
        px: {
          start: -1,
          stop: -1,
          width: -1
        },
        name: columns[1] + columns[2],
        stain: stain,
        taxid: taxid
      };

      lines[chr].push(line);
    }
  } else if (source === 'ucsc') {
    for (i = init; i < tsvLinesLength; i++) {
      // #chrom chromStart  chromEnd  name  gieStain
      // e.g. for fly:
      // chr4	69508	108296	102A1	n/a
      columns = tsvLines[i].split(delimiter);

      if (columns[0] !== 'chr' + chromosomeName) {
        continue;
      }

      stain = columns[4];
      if (stain === 'n/a') {
        stain = 'gpos100';
      }
      start = parseInt(columns[1], 10);
      stop = parseInt(columns[2], 10);

      line = {
        chr: columns[0].split('chr')[1],
        bp: {
          start: start,
          stop: stop
        },
        iscn: {
          start: start,
          stop: stop
        },
        px: {
          start: -1,
          stop: -1,
          width: -1
        },
        name: columns[3],
        stain: stain,
        taxid: taxid
      };

      lines[chr].push(line);
    }
  }

  return lines;
};

/**
* Generates a model object for each chromosome
* containing information on its name, DOM ID,
* length in base pairs or ISCN coordinates,
* cytogenetic bands, centromere position, etc.
*/
Ideogram.prototype.getChromosomeModel = function(bands, chromosome, taxid,
  chrIndex) {
  var chr = {},
    band,
    width, pxStop,
    chrHeight = this.config.chrHeight,
    maxLength = this.maxLength,
    chrLength,
    cs, hasBands;

  cs = this.coordinateSystem;
  hasBands = (typeof bands !== "undefined");

  if (hasBands) {
    chr.name = chromosome;
    chr.length = bands[bands.length - 1][cs].stop;
    chr.type = "nuclear";
  } else {
    chr = chromosome;
  }

  chr.chrIndex = chrIndex;

  chr.id = "chr" + chr.name + "-" + taxid;

  if (this.config.fullChromosomeLabels === true) {
    var orgName = this.organisms[taxid].scientificNameAbbr;
    chr.name = orgName + " chr" + chr.name;
  }

  chrLength = chr.length;

  pxStop = 0;

  if (hasBands) {
    for (var i = 0; i < bands.length; i++) {
      band = bands[i];
      var csLength = band[cs].stop - band[cs].start;
      width = chrHeight * chr.length / maxLength[cs] * csLength / chrLength;

      bands[i].px = {start: pxStop, stop: pxStop + width, width: width};

      pxStop = bands[i].px.stop;

      if (hasBands && band.stain === "acen" && band.name[0] === "p") {
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

  chr.centromerePosition = "";
  if (hasBands && bands[0].bp.stop - bands[0].bp.start === 1) {
    // As with mouse
    chr.centromerePosition = "telocentric";

    // Remove placeholder pter band
    chr.bands = chr.bands.slice(1);
  }

  return chr;
};

/**
* Draws labels for each chromosome, e.g. "1", "2", "X".
* If ideogram configuration has 'fullChromosomeLabels: True',
* then labels includes name of taxon, which can help when
* depicting orthologs.
*/
Ideogram.prototype.drawChromosomeLabels = function() {
  var ideo = this;

  var chromosomeLabelClass = ideo._layout.getChromosomeLabelClass();

  // Append chromosomes set's labels
  d3.selectAll(".chromosome-set-container")
        .append("text")
        .data(ideo.chromosomesArray)
        .attr("class", 'chromosome-set-label ' + chromosomeLabelClass)
        .attr("transform", ideo._layout.getChromosomeSetLabelTranslate())
        .attr("x", function(d, i) {
          return ideo._layout.getChromosomeSetLabelXPosition(i);
        }).attr("y", function(d, i) {
          return ideo._layout.getChromosomeSetLabelYPosition(i);
        }).attr("text-anchor", ideo._layout.getChromosomeSetLabelAnchor())
        .each(function(d, i) {
            // Get label lines
          var lines;
          if (d.name.indexOf(' ') === -1) {
            lines = [d.name];
          } else {
            lines = d.name.match(/^(.*)\s+([^\s]+)$/).slice(1).reverse();
          }

            // Render label lines
          d3.select(this).selectAll('tspan')
                .data(lines)
                .enter()
                .append('tspan')
                .attr('dy', function(d, i) {
                  return i * -1.2 + 'em';
                }).attr('x', ideo._layout.getChromosomeSetLabelXPosition(i))
                .attr('class', function(a, i) {
                  var fullLabels = ideo.config.fullChromosomeLabels;
                  return i === 1 && fullLabels ? 'italic' : null;
                }).text(String);
        });

  var setLabelTranslate = ideo._layout.getChromosomeSetLabelTranslate();

  // Append chromosomes labels
  d3.selectAll(".chromosome-set-container")
        .each(function(a, chrSetNumber) {
          d3.select(this).selectAll(".chromosome")
                .append("text")
                .attr("class", "chrLabel")
                .attr("transform", setLabelTranslate)
                .attr("x", function(d, i) {
                  return ideo._layout.getChromosomeLabelXPosition(i);
                }).attr("y", function(d, i) {
                  return ideo._layout.getChromosomeLabelYPosition(i);
                }).text(function(d, chrNumber) {
                  return ideo._ploidy.getAncestor(chrSetNumber, chrNumber);
                }).attr("text-anchor", "middle");
        });
};

/**
* Draws labels and stalks for cytogenetic bands.
*
* Band labels are text like "p11.11".
* Stalks are small lines that visually connect labels to their bands.
*/
Ideogram.prototype.drawBandLabels = function(chromosomes) {
  var i, chr, chrs, taxid, ideo, chrModel;

  ideo = this;

  chrs = [];

  for (taxid in chromosomes) {
    for (chr in chromosomes[taxid]) {
      chrs.push(chromosomes[taxid][chr]);
    }
  }

  var textOffsets = {};

  chrIndex = 0;
  for (i = 0; i < chrs.length; i++) {
    chrIndex += 1;

    chrModel = chrs[i];

    chr = d3.select("#" + chrModel.id);

    var chrMargin = this.config.chrMargin * chrIndex,
      lineY1, lineY2;

    lineY1 = chrMargin;
    lineY2 = chrMargin - 8;

    if (
      chrIndex === 1 &&
      "perspective" in this.config && this.config.perspective === "comparative"
    ) {
      lineY1 += 18;
      lineY2 += 18;
    }

    textOffsets[chrModel.id] = [];

    chr.selectAll("text")
      .data(chrModel.bands)
      .enter()
      .append("g")
        .attr("class", function(d, i) {
          return "bandLabel bsbsl-" + i;
        })
        .attr("transform", function(d) {
          var transform = ideo._layout.getChromosomeBandLabelTranslate(d, i);

          var x = transform.x;
          // var y = transform.y;

          textOffsets[chrModel.id].push(x + 13);

          return transform.translate;
        })
        .append("text")
        .attr('text-anchor', ideo._layout.getChromosomeBandLabelAnchor(i))
        .text(function(d) {
          return d.name;
        });

    // var adapter = ModelAdapter.getInstance(ideo.chromosomesArray[i]);
    // var view = Chromosome.getInstance(adapter, ideo.config, ideo);

    chr.selectAll("line.bandLabelStalk")
      .data(chrModel.bands)
      .enter()
      .append("g")
      .attr("class", function(d, i) {
        return "bandLabelStalk bsbsl-" + i;
      })
      .attr("transform", function(d) {
        var x, y;

        x = ideo.round(d.px.start + d.px.width / 2);

        textOffsets[chrModel.id].push(x + 13);
        y = -10;

        return "translate(" + x + "," + y + ")";
      })
        .append("line")
        .attr("x1", 0)
        .attr("y1", function() {
          return ideo._layout.getChromosomeBandTickY1(i);
        }).attr("x2", 0)
        .attr("y2", function() {
          return ideo._layout.getChromosomeBandTickY2(i);
        });
  }

  for (i = 0; i < chrs.length; i++) {
    chrModel = chrs[i];

    var textsLength = textOffsets[chrModel.id].length,
      overlappingLabelXRight,
      index,
      indexesToShow = [],
      prevHiddenBoxIndex,
      xLeft,
      prevLabelXRight,
      textPadding;

    overlappingLabelXRight = 0;

    textPadding = 5;

    for (index = 0; index < textsLength; index++) {
      // Ensures band labels don't overlap

      xLeft = textOffsets[chrModel.id][index];

      if (xLeft < overlappingLabelXRight + textPadding === false) {
        indexesToShow.push(index);
      } else {
        prevHiddenBoxIndex = index;
        overlappingLabelXRight = prevLabelXRight;
        continue;
      }

      if (prevHiddenBoxIndex !== index) {
        // This getBoundingClientRect() forces Chrome's
        // 'Recalculate Style' and 'Layout', which takes 30-40 ms on Chrome.
        // TODO: This forced synchronous layout would be nice to eliminate.
        // prevTextBox = texts[index].getBoundingClientRect();
        // prevLabelXRight = prevTextBox.left + prevTextBox.width;

        // TODO: Account for number of characters in prevTextBoxWidth,
        // maybe also zoom.
        prevTextBoxLeft = textOffsets[chrModel.id][index];
        prevTextBoxWidth = 36;

        prevLabelXRight = prevTextBoxLeft + prevTextBoxWidth;
      }

      if (
        xLeft < prevLabelXRight + textPadding
      ) {
        prevHiddenBoxIndex = index;
        overlappingLabelXRight = prevLabelXRight;
      } else {
        indexesToShow.push(index);
      }
    }

    var selectorsToShow = [],
      ithLength = indexesToShow.length,
      j;

    for (j = 0; j < ithLength; j++) {
      index = indexesToShow[j];
      selectorsToShow.push("#" + chrModel.id + " .bsbsl-" + index);
    }

    this.bandsToShow = this.bandsToShow.concat(selectorsToShow);
  }
};

// Rotates chromosome labels by 90 degrees, e.g. upon clicking a chromosome to focus.
Ideogram.prototype.rotateChromosomeLabels = function(chr, chrIndex,
  orientation, scale) {
  var chrMargin, chrWidth, ideo, x, y,
    numAnnotTracks, scaleSvg, tracksHeight;

  chrWidth = this.config.chrWidth;
  chrMargin = this.config.chrMargin * chrIndex;
  numAnnotTracks = this.config.numAnnotTracks;

  ideo = this;

  if (
    typeof (scale) !== "undefined" &&
    scale.hasOwnProperty("x") &&
    !(scale.x === 1 && scale.y === 1)
  ) {
    scaleSvg = "scale(" + scale.x + "," + scale.y + ")";
    x = -6;
    y = (scale === "" ? -16 : -14);
  } else {
    x = -8;
    y = -16;
    scale = {x: 1, y: 1};
    scaleSvg = "";
  }

  if (orientation === "vertical" || orientation === "") {
    var ci = chrIndex - 1;

    if (numAnnotTracks > 1 || orientation === "") {
      ci -= 1;
    }

    chrMargin2 = -4;
    if (ideo.config.showBandLabels === true) {
      chrMargin2 = ideo.config.chrMargin + chrWidth + 26;
    }

    chrMargin = ideo.config.chrMargin * ci;

    if (numAnnotTracks > 1 === false) {
      chrMargin += 1;
    }

    y = chrMargin + chrMargin2;

    chr.selectAll("text.chrLabel")
      .attr("transform", scaleSvg)
      .selectAll("tspan")
        .attr("x", x)
        .attr("y", y);
  } else {
    chrIndex -= 1;

    chrMargin2 = -chrWidth - 2;
    if (ideo.config.showBandLabels === true) {
      chrMargin2 = ideo.config.chrMargin + 8;
    }

    tracksHeight = ideo.config.annotTracksHeight;
    if (ideo.config.annotationsLayout !== "overlay") {
      tracksHeight *= 2;
    }

    chrMargin = ideo.config.chrMargin * chrIndex;
    x = -(chrMargin + chrMargin2) + 3 + tracksHeight;
    x /= scale.x;

    chr.selectAll("text.chrLabel")
      .attr("transform", "rotate(-90)" + scaleSvg)
      .selectAll("tspan")
      .attr("x", x)
      .attr("y", y);
  }
};

/**
* Rotates band labels by 90 degrees, e.g. upon clicking a chromosome to focus.
*
* This method includes proportional scaling, which ensures that
* while the parent chromosome group is scaled strongly in one dimension to fill
* available space, the text in the chromosome's band labels is
* not similarly distorted, and remains readable.
*/
Ideogram.prototype.rotateBandLabels = function(chr, chrIndex, scale) {
  var chrMargin, scaleSvg,
    orientation, bandLabels,
    ideo = this;

  bandLabels = chr.selectAll(".bandLabel");

  chrWidth = this.config.chrWidth;
  chrMargin = this.config.chrMargin * chrIndex;

  orientation = chr.attr("data-orientation");

  if (typeof (scale) === "undefined") {
    scale = {x: 1, y: 1};
    scaleSvg = "";
  } else {
    scaleSvg = "scale(" + scale.x + "," + scale.y + ")";
  }

  if (
    chrIndex === 1 &&
    "perspective" in this.config && this.config.perspective === "comparative"
  ) {
    bandLabels
      .attr("transform", function(d) {
        var x, y;
        x = (8 - chrMargin) - 26;
        y = ideo.round(2 + d.px.start + d.px.width / 2);
        return "rotate(-90)translate(" + x + "," + y + ")";
      })
      .selectAll("text")
        .attr("text-anchor", "end");
  } else if (orientation === "vertical") {
    bandLabels
      .attr("transform", function(d) {
        var x, y;
        x = 8 - chrMargin;
        y = ideo.round(2 + d.px.start + d.px.width / 2);
        return "rotate(-90)translate(" + x + "," + y + ")";
      })
      .selectAll("text")
        .attr("transform", scaleSvg);
  } else {
    bandLabels
      .attr("transform", function(d) {
        var x, y;
        x = ideo.round(-8 * scale.x + d.px.start + d.px.width / 2);
        y = chrMargin - 10;
        return "translate(" + x + "," + y + ")";
      })
      .selectAll("text")
        .attr("transform", scaleSvg);

    chr.selectAll(".bandLabelStalk line")
      .attr("transform", scaleSvg);
  }
};

Ideogram.prototype.round = function(coord) {
  // Rounds an SVG coordinates to two decimal places
  // e.g. 42.1234567890 -> 42.12
  // Per http://stackoverflow.com/a/9453447, below method is fastest
  return Math.round(coord * 100) / 100;
};

/**
* Renders all the bands and outlining boundaries of a chromosome.
*/
Ideogram.prototype.drawChromosome = function(chrModel, chrIndex, container, k) {
    // Get chromosome model adapter class
  var adapter = ModelAdapter.getInstance(chrModel);

    // Append chromosome's container
  var chromosome = container
        .append("g")
        .attr("id", chrModel.id)
        .attr("class", "chromosome " + adapter.getCssClass())
        .attr("transform", "translate(0, " + k * 20 + ")");

    // Render chromosome
  return Chromosome.getInstance(adapter, this.config, this)
        .render(chromosome, chrIndex, k);
};

/**
* Rotates a chromosome 90 degrees and shows or hides all other chromosomes
* Useful for focusing or defocusing a particular chromosome
*/
Ideogram.prototype.rotateAndToggleDisplay = function(chromosome) {
  /*
   * Do nothing if taxId not defined. But it should be defined.
   * To fix that bug we should have a way to find chromosome set number.
   */
  if (!this.config.taxid) {
    return;
  }

  var chrSetNumber =
    Number(d3.select(chromosome.parentNode).attr('data-set-number'));

  var chrNumber = Array.prototype.slice.call(
          d3.select(chromosome.parentNode).selectAll("g.chromosome")._groups[0]
      ).indexOf(chromosome);

  return this._layout.rotate(chrSetNumber, chrNumber, chromosome);
};

/**
* Converts base pair coordinates to pixel offsets.
* Bp-to-pixel scales differ among cytogenetic bands.
*/
Ideogram.prototype.convertBpToPx = function(chr, bp) {

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
    "Base pair out of range.  " +
    "bp: " + bp + "; length of chr" + chr.name + ": " + band.bp.stop
  );
};


/**
* Converts base pair coordinates to pixel offsets.
* Bp-to-pixel scales differ among cytogenetic bands.
*/
Ideogram.prototype.convertPxToBp = function(chr, px) {
  var i, band, pxToIscnScale, iscn,
      pxStart, pxStop, iscnStart, iscnStop, bpLength, iscnLength;

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
    "Pixel out of range.  " +
    "px: " + bp + "; length of chr" + chr.name + ": " + pxStop
  );
};

/**
* Draws a trapezoid connecting a genomic range on
* one chromosome to a genomic range on another chromosome;
* a syntenic region.
*/
Ideogram.prototype.drawSynteny = function(syntenicRegions) {
  var t0 = new Date().getTime();

  var r1, r2,
    syntenies,
    i, color, opacity,
    regionID,
    ideo = this;

  syntenies = d3.select("svg")
    .insert("g", ":first-child")
    .attr("class", "synteny");

  for (i = 0; i < syntenicRegions.length; i++) {
    regions = syntenicRegions[i];

    r1 = regions.r1;
    r2 = regions.r2;

    color = "#CFC";
    if ("color" in regions) {
      color = regions.color;
    }

    opacity = 1;
    if ("opacity" in regions) {
      opacity = regions.opacity;
    }

    r1.startPx = this.convertBpToPx(r1.chr, r1.start);
    r1.stopPx = this.convertBpToPx(r1.chr, r1.stop);
    r2.startPx = this.convertBpToPx(r2.chr, r2.start);
    r2.stopPx = this.convertBpToPx(r2.chr, r2.stop);

    regionID = (
      r1.chr.id + "_" + r1.start + "_" + r1.stop + "_" +
      "__" +
      r2.chr.id + "_" + r2.start + "_" + r2.stop
    );

    syntenicRegion = syntenies.append("g")
      .attr("class", "syntenicRegion")
      .attr("id", regionID)
      .on("click", function() {
        var activeRegion = this;
        var others = d3.selectAll(".syntenicRegion")
          .filter(function() {
            return (this !== activeRegion);
          });

        others.classed("hidden", !others.classed("hidden"));
      })
      .on("mouseover", function() {
        var activeRegion = this;
        d3.selectAll(".syntenicRegion")
          .filter(function() {
            return (this !== activeRegion);
          })
          .classed("ghost", true);
      })
      .on("mouseout", function() {
        d3.selectAll(".syntenicRegion").classed("ghost", false);
      });

    var x1 = this._layout.getChromosomeSetYTranslate(0);
    var x2 = this._layout.getChromosomeSetYTranslate(1) - ideo.config.chrWidth;

    syntenicRegion.append("polygon")
      .attr("points",
        x1 + ', ' + r1.startPx + ' ' +
        x1 + ', ' + r1.stopPx + ' ' +
        x2 + ', ' + r2.stopPx + ' ' +
        x2 + ', ' + r2.startPx
      )
      .attr('style', "fill: " + color + "; fill-opacity: " + opacity);

    syntenicRegion.append("line")
      .attr("class", "syntenyBorder")
      .attr("x1", x1)
      .attr("x2", x2)
      .attr("y1", r1.startPx)
      .attr("y2", r2.startPx);

    syntenicRegion.append("line")
      .attr("class", "syntenyBorder")
      .attr("x1", x1)
      .attr("x2", x2)
      .attr("y1", r1.stopPx)
      .attr("y2", r2.stopPx);
  }

  var t1 = new Date().getTime();
  if (ideo.debug) {
    console.log("Time in drawSyntenicRegions: " + (t1 - t0) + " ms");
  }
};

/**
* Initializes various annotation settings.  Constructor help function.
*/
Ideogram.prototype.initAnnotSettings = function() {
  if (this.config.annotationsPath || this.config.localAnnotationsPath ||
    this.annots || this.config.annotations) {
    if (!this.config.annotationHeight) {
      var annotHeight = Math.round(this.config.chrHeight / 100);
      this.config.annotationHeight = annotHeight;
    }

    if (this.config.annotationTracks) {
      this.config.numAnnotTracks = this.config.annotationTracks.length;
    } else {
      this.config.numAnnotTracks = 1;
    }
    this.config.annotTracksHeight =
      this.config.annotationHeight * this.config.numAnnotTracks;

    if (typeof this.config.barWidth === "undefined") {
      this.config.barWidth = 3;
    }
  } else {
    this.config.annotTracksHeight = 0;
  }

  if (typeof this.config.annotationsColor === "undefined") {
    this.config.annotationsColor = "#F00";
  }
};

/**
* Draws annotations defined by user
*/
Ideogram.prototype.drawAnnots = function(friendlyAnnots) {
  var ideo = this,
    i, j, annot,
    rawAnnots = [],
    rawAnnot, keys,
    chr,
    chrs = ideo.chromosomes[ideo.config.taxid]; // TODO: multiorganism

  // Occurs when filtering
  if ("annots" in friendlyAnnots[0]) {
    return ideo.drawProcessedAnnots(friendlyAnnots);
  }

  for (chr in chrs) {
    rawAnnots.push({chr: chr, annots: []});
  }

  for (i = 0; i < friendlyAnnots.length; i++) {
    annot = friendlyAnnots[i];

    for (j = 0; j < rawAnnots.length; j++) {
      if (annot.chr === rawAnnots[j].chr) {
        rawAnnot = [
          annot.name,
          annot.start,
          annot.stop - annot.start
        ];
        if ("color" in annot) {
          rawAnnot.push(annot.color);
        }
        if ("shape" in annot) {
          rawAnnot.push(annot.shape);
        }
        rawAnnots[j].annots.push(rawAnnot);
        break;
      }
    }
  }

  keys = ["name", "start", "length"];
  if ("color" in friendlyAnnots[0]) {
    keys.push("color");
  }
  if ("shape" in friendlyAnnots[0]) {
    keys.push("shape");
  }
  ideo.rawAnnots = {keys: keys, annots: rawAnnots};

  ideo.annots = ideo.processAnnotData(ideo.rawAnnots);

  ideo.drawProcessedAnnots(ideo.annots);
};

/**
* Proccesses genome annotation data.
* Genome annotations represent features like a gene, SNP, etc. as
* a small graphical object on or beside a chromosome.
* Converts raw annotation data from server, which is structured as
* an array of arrays, into a more verbose data structure consisting
* of an array of objects.
* Also adds pixel offset information.
*/
Ideogram.prototype.processAnnotData = function(rawAnnots) {
  var keys,
    i, j, annot, annots, annotsByChr,
    chr,
    chrModel, ra,
    startPx, stopPx, px,
    color,
    ideo = this;

  keys = rawAnnots.keys;
  rawAnnots = rawAnnots.annots;

  annots = [];

  for (i = 0; i < rawAnnots.length; i++) {
    annotsByChr = rawAnnots[i];

    annots.push({chr: annotsByChr.chr, annots: []});

    for (j = 0; j < annotsByChr.annots.length; j++) {
      chr = annotsByChr.chr;
      ra = annotsByChr.annots[j];
      annot = {};

      for (var k = 0; k < keys.length; k++) {
        annot[keys[k]] = ra[k];
      }

      annot.stop = annot.start + annot.length;

      chrModel = ideo.chromosomes["9606"][chr];

      startPx = ideo.convertBpToPx(chrModel, annot.start);
      stopPx = ideo.convertBpToPx(chrModel, annot.stop);

      px = Math.round((startPx + stopPx) / 2) - 28;

      color = ideo.config.annotationsColor;
      if (ideo.config.annotationTracks) {
        annot.trackIndex = ra[3];
        color = ideo.config.annotationTracks[annot.trackIndex].color;
      } else {
        annot.trackIndex = 0;
      }

      if ('color' in annot) {
        color = annot.color;
      }

      annot.chr = chr;
      annot.chrIndex = i;
      annot.px = px;
      annot.color = color;

      annots[i].annots.push(annot);
    }
  }

  return annots;
};

/*
* Can be used for bar chart or sparkline
*/
Ideogram.prototype.getHistogramBars = function(annots) {
  var t0 = new Date().getTime();

  var i, j, chr,
    chrModels, chrPxStop, px,
    chrAnnots, chrName, chrIndex, annot,
    bars, bar, barPx, nextBarPx, barWidth,
    maxAnnotsPerBar, color,
    firstGet = false,
    histogramScaling,
    ideo = this;

  bars = [];

  barWidth = ideo.config.barWidth;
  chrModels = ideo.chromosomes[ideo.config.taxid];
  color = ideo.config.annotationsColor;

  if ("histogramScaling" in ideo.config) {
    histogramScaling = ideo.config.histogramScaling;
  } else {
    histogramScaling = "relative";
  }

  if (typeof ideo.maxAnnotsPerBar === "undefined") {
    ideo.maxAnnotsPerBar = {};
    firstGet = true;
  }

  for (chr in chrModels) {
    chrModel = chrModels[chr];
    chrIndex = chrModel.chrIndex;
    lastBand = chrModel.bands[chrModel.bands.length - 1];
    chrPxStop = lastBand.px.stop;
    numBins = Math.round(chrPxStop / barWidth);
    bar = {chr: chr, annots: []};
    for (i = 0; i < numBins; i++) {
      px = i * barWidth - ideo.bump;
      bp = ideo.convertPxToBp(chrModel, px + ideo.bump);
      bar.annots.push({
        bp: bp,
        px: px - ideo.bump,
        count: 0,
        chrIndex: chrIndex,
        chrName: chr,
        color: color,
        annots: []
      });
    }
    bars.push(bar);
  }

  for (chr in annots) {
    chrAnnots = annots[chr].annots;
    chrName = annots[chr].chr;
    chrModel = chrModels[chrName];
    chrIndex = chrModel.chrIndex - 1;
    barAnnots = bars[chrIndex].annots;
    for (i = 0; i < chrAnnots.length; i++) {
      annot = chrAnnots[i];
      px = annot.px - ideo.bump;
      for (j = 0; j < barAnnots.length; j++) {
        barPx = barAnnots[j].px;
        nextBarPx = barPx + barWidth;
        if (j === barAnnots.length - 1) {
          nextBarPx += barWidth;
        }
        if (px >= barPx && px < nextBarPx) {
          bars[chrIndex].annots[j].count += 1;
          bars[chrIndex].annots[j].annots.push(annot);
          break;
        }
      }
    }
  }

  if (firstGet === true || histogramScaling === "relative") {
    maxAnnotsPerBar = 0;
    for (i = 0; i < bars.length; i++) {
      annots = bars[i].annots;
      for (j = 0; j < annots.length; j++) {
        barCount = annots[j].count;
        if (barCount > maxAnnotsPerBar) {
          maxAnnotsPerBar = barCount;
        }
      }
    }
    ideo.maxAnnotsPerBar[chr] = maxAnnotsPerBar;
  }

  // Set each bar's height to be proportional to
  // the height of the bar with the most annotations
  for (i = 0; i < bars.length; i++) {
    annots = bars[i].annots;
    for (j = 0; j < annots.length; j++) {
      barCount = annots[j].count;
      height = (barCount / ideo.maxAnnotsPerBar[chr]) * ideo.config.chrMargin;
      // console.log(height)
      bars[i].annots[j].height = height;
    }
  }

  var t1 = new Date().getTime();
  if (ideo.debug) {
    console.log("Time spent in getHistogramBars: " + (t1 - t0) + " ms");
  }

  ideo.bars = bars;

  return bars;
};

/**
* Draws genome annotations on chromosomes.
* Annotations can be rendered as either overlaid directly
* on a chromosome, or along one or more "tracks"
* running parallel to each chromosome.
*/
Ideogram.prototype.drawProcessedAnnots = function(annots) {
  var chrWidth, layout,
    annotHeight, triangle, circle, r, chrAnnot,
    x1, x2, y1, y2,
    ideo = this;

  chrMargin = this.config.chrMargin;
  chrWidth = this.config.chrWidth;

  layout = "tracks";
  if (this.config.annotationsLayout) {
    layout = this.config.annotationsLayout;
  }

  if (layout === "histogram") {
    annots = ideo.getHistogramBars(annots);
  }

  annotHeight = ideo.config.annotationHeight;

  triangle =
    'l -' + annotHeight + ' ' +
    (2 * annotHeight) +
    ' l ' + (2 * annotHeight) + ' 0 z';

  // From http://stackoverflow.com/a/10477334, with a minor change ("m -r, r")
  // Circles are supported natively via <circle>, but having it as a path
  // simplifies handling triangles, circles and other shapes in the same
  // D3 call
  r = annotHeight;
  circle =
    'm -' + r + ', ' + r +
    'a ' + r + ',' + r + ' 0 1,0 ' + (r * 2) + ',0' +
    'a ' + r + ',' + r + ' 0 1,0 -' + (r * 2) + ',0';

  chrAnnot = d3.selectAll(".chromosome")
    .data(annots)
      .selectAll("path.annot")
      .data(function(d) {
        return d.annots;
      })
      .enter();

  if (layout === "tracks") {
    chrAnnot
      .append("g")
      .attr("id", function(d) {
        return d.id;
      })
      .attr("class", "annot")
      .attr("transform", function(d) {
        var y = ideo.config.chrWidth + (d.trackIndex * annotHeight * 2);
        return "translate(" + d.px + "," + y + ")";
      })
      .append("path")
      .attr("d", function(d) {
        if (!d.shape || d.shape === "triangle") {
          return "m0,0" + triangle;
        } else if (d.shape === "circle") {
          return circle;
        }
      })
      .attr("fill", function(d) {
        return d.color;
      });
  } else if (layout === "overlay") {
      // Overlaid annotations appear directly on chromosomes

    chrAnnot.append("polygon")
        .attr("id", function(d) {
          return d.id;
        })
        .attr("class", "annot")
        .attr("points", function(d) {
          x1 = d.px - 0.5;
          x2 = d.px + 0.5;
          y1 = chrWidth;
          y2 = 0;

          return (
            x1 + "," + y1 + " " +
            x2 + "," + y1 + " " +
            x2 + "," + y2 + " " +
            x1 + "," + y2
          );
        })
        .attr("fill", function(d) {
          return d.color;
        });
  } else if (layout === "histogram") {
    chrAnnot.append("polygon")
        // .attr("id", function(d, i) { return d.id; })
        .attr("class", "annot")
        .attr("points", function(d) {
          x1 = d.px + ideo.bump;
          x2 = d.px + ideo.config.barWidth + ideo.bump;
          y1 = chrWidth;
          y2 = chrWidth + d.height;

          var thisChrWidth = ideo.chromosomesArray[d.chrIndex - 1].width;

          if (x2 > thisChrWidth) {
            x2 = thisChrWidth;
          }

          return (
            x1 + "," + y1 + " " +
            x2 + "," + y1 + " " +
            x2 + "," + y2 + " " +
            x1 + "," + y2
          );
        })
        .attr("fill", function(d) {
          return d.color;
        });
  }

  if (ideo.onDrawAnnotsCallback) {
    ideo.onDrawAnnotsCallback();
  }
};

Ideogram.prototype.onBrushMove = function() {
  call(this.onBrushMoveCallback);
};

Ideogram.prototype.createBrush = function(from, to) {
  var ideo = this,
    width = ideo.config.chrWidth + 6.5,
    length = ideo.config.chrHeight,
    chr = ideo.chromosomesArray[0],
    chrLengthBp = chr.bands[chr.bands.length - 1].bp.stop,
    x0, x1,
    xOffset = this._layout.getMargin().left,
    xScale = d3.scaleLinear()
          .domain([0, d3.max(chr.bands, function(band) {
            return band.bp.stop;
          })]).range([xOffset, d3.max(chr.bands, function(band) {
            return band.px.stop;
          }) + xOffset]);

  if (typeof from === "undefined") {
    from = Math.floor(chrLengthBp / 10);
  }

  if (typeof right === "undefined") {
    to = Math.ceil(from * 2);
  }

  x0 = ideo.convertBpToPx(chr, from);
  x1 = ideo.convertBpToPx(chr, to);

  ideo.selectedRegion = {from: from, to: to, extent: (to - from)};

  ideo.brush = d3.brushX()
    .extent([[xOffset, 0], [length + xOffset, width]])
    .on("brush", onBrushMove);

  var yTranslate = this._layout.getChromosomeSetYTranslate(0);
  var yOffset = yTranslate + (ideo.config.chrWidth - width) / 2;
  d3.select("#_ideogram").append("g")
    .attr("class", "brush")
    .attr("transform", "translate(0, " + yOffset + ")")
    .call(ideo.brush)
    .call(ideo.brush.move, [x0, x1]);

  function onBrushMove() {
    var extent = d3.event.selection.map(xScale.invert),
      from = Math.floor(extent[0]),
      to = Math.ceil(extent[1]);

    ideo.selectedRegion = {from: from, to: to, extent: (to - from)};

    if (ideo.onBrushMove) {
      ideo.onBrushMoveCallback();
    }
  }
};

/**
* Called when Ideogram has finished initializing.
* Accounts for certain ideogram properties not being set until
* asynchronous requests succeed, etc.
*/
Ideogram.prototype.onLoad = function() {
  call(this.onLoadCallback);
};

Ideogram.prototype.onDrawAnnots = function() {
  call(this.onDrawAnnotsCallback);
};

Ideogram.prototype.getBandColorGradients = function() {
  var colors,
    stain, color1, color2, color3,
    css,
    gradients = "";

  colors = [
    ["gneg", "#FFF", "#FFF", "#DDD"],
    ["gpos25", "#C8C8C8", "#DDD", "#BBB"],
    ["gpos33", "#BBB", "#BBB", "#AAA"],
    ["gpos50", "#999", "#AAA", "#888"],
    ["gpos66", "#888", "#888", "#666"],
    ["gpos75", "#777", "#777", "#444"],
    ["gpos100", "#444", "#666", "#000"],
    ["acen", "#FEE", "#FEE", "#FDD"],
    ["noBands", "#BBB", "#BBB", "#AAA"]
  ];

  for (var i = 0; i < colors.length; i++) {
    stain = colors[i][0];
    color1 = colors[i][1];
    color2 = colors[i][2];
    color3 = colors[i][3];
    gradients +=
      '<linearGradient id="' + stain + '" x1="0%" y1="0%" x2="0%" y2="100%">';
    if (stain === "gneg") {
      gradients +=
        '<stop offset="70%" stop-color="' + color2 + '" />' +
        '<stop offset="95%" stop-color="' + color3 + '" />' +
        '<stop offset="100%" stop-color="' + color1 + '" />';
    } else {
      gradients +=
        '<stop offset="5%" stop-color="' + color1 + '" />' +
        '<stop offset="15%" stop-color="' + color2 + '" />' +
        '<stop offset="60%" stop-color="' + color3 + '" />';
    }
    gradients +=
      '</linearGradient>';
  }

  gradients +=
    '<pattern id="stalk" width="2" height="1" patternUnits="userSpaceOnUse" ' +
      'patternTransform="rotate(30 0 0)">' +
      '<rect x="0" y="0" width="10" height="2" fill="#CCE" /> ' +
       '<line x1="0" y1="0" x2="0" y2="100%" style="stroke:#88B; ' +
        'stroke-width:0.7;" />' +
    '</pattern>' +
    '<pattern id="gvar" width="2" height="1" patternUnits="userSpaceOnUse" ' +
      'patternTransform="rotate(-30 0 0)">' +
      '<rect x="0" y="0" width="10" height="2" fill="#DDF" /> ' +
       '<line x1="0" y1="0" x2="0" y2="100%" style="stroke:#99C; ' +
          'stroke-width:0.7;" />' +
    '</pattern>';

  gradients = "<defs>" + gradients + "</defs>";
  css = "<style>" +
    '.gneg {fill: url("#gneg")} ' +
    '.gpos25 {fill: url("#gpos25")} ' +
    '.gpos33 {fill: url("#gpos33")} ' +
    '.gpos50 {fill: url("#gpos50")} ' +
    '.gpos66 {fill: url("#gpos66")} ' +
    '.gpos75 {fill: url("#gpos75")} ' +
    '.gpos100 {fill: url("#gpos100")} ' +
    '.acen {fill: url("#acen")} ' +
    '.stalk {fill: url("#stalk")} ' +
    '.gvar {fill: url("#gvar")} ' +
    '.noBands {fill: url("#noBands")} ' +
  '</style>';
  gradients = css + gradients;

  // alert(gradients)

  return gradients;
};

/*
  Returns an NCBI taxonomy identifier (taxid) for the configured organism
*/
Ideogram.prototype.getTaxidFromEutils = function(callback) {
  var organism, taxonomySearch, taxid,
    ideo = this;

  organism = ideo.config.organism;

  taxonomySearch = ideo.esearch + "&db=taxonomy&term=" + organism;

  d3.json(taxonomySearch, function(data) {
    taxid = data.esearchresult.idlist[0];
    return callback(taxid);
  });
};

/**
* Returns an array of taxids for the current ideogram
* Also sets configuration parameters related to taxid(s), whether ideogram is
* multiorganism, and adjusts chromosomes parameters as needed
**/
Ideogram.prototype.getTaxids = function(callback) {
  var ideo = this,
    taxid, taxids,
    org, orgs, i,
    taxidInit, tmpChrs,
    assembly, chromosomes,
    multiorganism;

  taxidInit = "taxid" in ideo.config;

  ideo.config.multiorganism = (
    ("organism" in ideo.config && ideo.config.organism instanceof Array) ||
    (taxidInit && ideo.config.taxid instanceof Array)
  );

  multiorganism = ideo.config.multiorganism;

  if ("organism" in ideo.config) {
    // Ideogram instance was constructed using common organism name(s)
    if (multiorganism) {
      orgs = ideo.config.organism;
    } else {
      orgs = [ideo.config.organism];
    }

    taxids = [];
    tmpChrs = {};
    for (i = 0; i < orgs.length; i++) {
      // Gets a list of taxids from common organism names
      org = orgs[i];
      for (taxid in ideo.organisms) {
        if (ideo.organisms[taxid].commonName.toLowerCase() === org) {
          taxids.push(taxid);
          if (multiorganism) {
            // Adjusts 'chromosomes' configuration parameter to make object
            // keys use taxid instead of common organism name
            tmpChrs[taxid] = ideo.config.chromosomes[org];
          }
        }
      }
    }

    if (taxids.length === 0) {
      promise = new Promise(function(resolve) {
        ideo.getTaxidFromEutils(resolve);
      });
      promise.then(function(data) {
        taxid = data;
        taxids.push(taxid);

        ideo.config.taxids = taxids;
        ideo.organisms[taxid] = {
          commonName: "",
          scientificName: ideo.config.organism,
          scientificNameAbbr: ""
        };
        return new Promise(function(resolve) {
          ideo.getAssemblyAndChromosomesFromEutils(resolve);
        });
      })
      .then(function(asmChrArray) {
        assembly = asmChrArray[0];
        chromosomes = asmChrArray[1];

        ideo.config.chromosomes = chromosomes;
        ideo.organisms[taxid].assemblies = {
          default: assembly
        };

        callback(taxids);
      });
    } else {
      ideo.config.taxids = taxids;
      if (multiorganism) {
        ideo.config.chromosomes = tmpChrs;
      }

      callback(taxids);
    }
  } else {
    if (multiorganism) {
      ideo.coordinateSystem = "bp";
      if (taxidInit) {
        taxids = ideo.config.taxid;
      }
    } else {
      if (taxidInit) {
        taxids = [ideo.config.taxid];
      }
      ideo.config.taxids = taxids;
    }

    callback(taxids);
  }
};

Ideogram.prototype.sortChromosomes = function(a, b) {
  var aIsNuclear = a.type === "nuclear",
    bIsNuclear = b.type === "nuclear",
    aIsCP = a.type === "chloroplast",
    bIsCP = b.type === "chloroplast",
    aIsMT = a.type === "mitochondrion",
    bIsMT = b.type === "mitochondrion";
    // aIsPlastid = aIsMT && a.name !== "MT", // e.g. B1 in rice genome GCF_001433935.1
    // bIsPlastid = bIsMT && b.name !== "MT";

  if (aIsNuclear && bIsNuclear) {
    return naturalSort(a.name, b.name);
  } else if (!aIsNuclear && bIsNuclear) {
    return 1;
  } else if (aIsMT && bIsCP) {
    return 1;
  } else if (aIsCP && bIsMT) {
    return -1;
  } else if (!aIsMT && !aIsCP && (bIsMT || bIsCP)) {
    return -1;
  }
};

/**
  Returns names and lengths of chromosomes for an organism's best-known
  genome assembly.  Gets data from NCBI EUtils web API.
*/
Ideogram.prototype.getAssemblyAndChromosomesFromEutils = function(callback) {
  var asmAndChrArray, // [assembly_accession, chromosome_objects_array]
    assemblyAccession, chromosomes, asmSearch,
    asmUid, asmSummary,
    rsUid, nuccoreLink,
    links, ntSummary,
    results, result, cnIndex, chrName, chrLength, chromosome, type,
    ideo = this;

  organism = ideo.config.organism;

  asmAndChrArray = [];
  chromosomes = [];

  asmSearch =
    ideo.esearch +
    "&db=assembly" +
    "&term=%22" + organism + "%22[organism]" +
      "AND%20(%22latest%20refseq%22[filter])%20" +
      "AND%20%22chromosome%20level%22[filter]";

  var promise = d3.promise.json(asmSearch);

  promise
      .then(function(data) {
        // NCBI Assembly database's internal identifier (uid) for this assembly
        asmUid = data.esearchresult.idlist[0];
        asmSummary = ideo.esummary + "&db=assembly&id=" + asmUid;

        return d3.promise.json(asmSummary);
      })
      .then(function(data) {
        // RefSeq UID for this assembly
        rsUid = data.result[asmUid].rsuid;
        assemblyAccession = data.result[asmUid].assemblyaccession;

        asmAndChrArray.push(assemblyAccession);

        // Get a list of IDs for the chromosomes in this genome.
        //
        // This information does not seem to be available from well-known
        // NCBI databases like Assembly or Nucleotide, so we use GenColl,
        // a lesser-known NCBI database.
        var qs = "&db=nuccore&linkname=gencoll_nuccore_chr&from_uid=" + rsUid;
        nuccoreLink = ideo.elink + qs;

        return d3.promise.json(nuccoreLink);
      })
      .then(function(data) {
        links = data.linksets[0].linksetdbs[0].links.join(",");
        ntSummary = ideo.esummary + "&db=nucleotide&id=" + links;

        return d3.promise.json(ntSummary);
      })
      .then(function(data) {
        results = data.result;

        for (var x in results) {
          result = results[x];

          // omit list of reult uids
          if (x === "uids") {
            continue;
          }

          if (result.genome === "mitochondrion") {
            if (ideo.config.showNonNuclearChromosomes) {
              type = result.genome;
              cnIndex = result.subtype.split("|").indexOf("plasmid");
              if (cnIndex === -1) {
                chrName = "MT";
              } else {
                // Seen in e.g. rice genome IRGSP-1.0 (GCF_001433935.1),
                // From https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?retmode=json&db=nucleotide&id=996703432,996703431,996703430,996703429,996703428,996703427,996703426,996703425,996703424,996703423,996703422,996703421,194033210,11466763,7524755
                  // genome: "mitochondrion",
                  // subtype: "cell_line|plasmid",
                  // subname: "A-58 CMS|B1",
                chrName = result.subname.split("|")[cnIndex];
              }
            } else {
              continue;
            }
          } else if (
            result.genome === "chloroplast" ||
            result.genome === "plastid"
          ) {
            type = "chloroplast";
            // Plastid encountered with rice genome IRGSP-1.0 (GCF_001433935.1)
            if (ideo.config.showNonNuclearChromosomes) {
              chrName = "CP";
            } else {
              continue;
            }
          } else {
            type = "nuclear";
            cnIndex = result.subtype.split("|").indexOf("chromosome");

            chrName = result.subname.split("|")[cnIndex];

            if (
              typeof chrName !== "undefined" &&
              chrName.substr(0, 3) === "chr"
            ) {
              // Convert "chr12" to "12", e.g. for banana (GCF_000313855.2)
              chrName = chrName.substr(3);
            }
          }

          chrLength = result.slen;

          chromosome = {
            name: chrName,
            length: chrLength,
            type: type
          };

          chromosomes.push(chromosome);
        }

        chromosomes = chromosomes.sort(ideo.sortChromosomes);
        asmAndChrArray.push(chromosomes);

        ideo.coordinateSystem = "bp";

        return callback(asmAndChrArray);
      });
};

Ideogram.prototype.initDrawChromosomes = function(bandsArray) {
  var ideo = this,
    taxids = ideo.config.taxids,
    taxid,
    chrIndex = 0,
    chrSetNumber = 0,
    i, j, chrs, chromosome, chrModel,
    defs, transform;

  defs = d3.select("defs");

  for (i = 0; i < taxids.length; i++) {
    taxid = taxids[i];
    chrs = ideo.config.chromosomes[taxid];

    ideo.chromosomes[taxid] = {};

    for (j = 0; j < chrs.length; j++) {
      chromosome = chrs[j];
      bands = bandsArray[chrIndex];
      chrIndex += 1;

      chrModel = ideo.getChromosomeModel(bands, chromosome, taxid, chrIndex);

      ideo.chromosomes[taxid][chromosome] = chrModel;
      ideo.chromosomesArray.push(chrModel);

      transform = ideo._layout.getChromosomeSetTranslate(chrSetNumber);
      chrSetNumber += 1;

      // Append chromosome set container
      var container = d3.select("svg")
        .append("g")
        .attr("class", "chromosome-set-container")
        .attr("data-set-number", j)
        .attr("transform", transform)
        .attr("id", chrModel.id + "-chromosome-set");

      var shape;
      for (var k = 0; k < this._ploidy.getChromosomesNumber(j); k++) {
        shape = ideo.drawChromosome(chrModel, chrIndex - 1, container, k);
      }

      defs.append("clipPath")
        .attr("id", chrModel.id + "-chromosome-set-clippath")
        .selectAll('path')
        .data(shape)
        .enter()
        .append('path')
        .attr('d', function(d) {
          return d.path;
        }).attr('class', function(d) {
          return d.class;
        });
    }

    if (ideo.config.showBandLabels === true) {
      ideo.drawBandLabels(ideo.chromosomes);
    }
  }
};

// Get ideogram SVG container
Ideogram.prototype.getSvg = function() {
  return d3.select('#_ideogram').node();
};

/**
* Initializes an ideogram.
* Sets some high-level properties based on instance configuration,
* fetches band and annotation data if needed, and
* writes an SVG element to the document to contain the ideogram
*
*/
Ideogram.prototype.init = function() {
  var bandDataFileNames,
    taxid, i, svgClass;

  var ideo = this;

  var t0 = new Date().getTime();

  var bandsArray = [],
    numBandDataResponses = 0,
    resolution = this.config.resolution,
    accession;

  var promise = new Promise(function(resolve) {
    ideo.getTaxids(resolve);
  });

  promise.then(function(taxids) {
    taxid = taxids[0];
    ideo.config.taxid = taxid;
    ideo.config.taxids = taxids;

    for (i = 0; i < taxids.length; i++) {
      taxid = taxids[i];

      if (!ideo.config.assembly) {
        ideo.config.assembly = "default";
      }
      accession = ideo.organisms[taxid].assemblies[ideo.config.assembly];

      bandDataFileNames = {
      // Homo sapiens (human)
        9606: "native/ideogram_9606_" + accession + "_" + resolution + "_V1.js",
      // 9606: "ncbi/ideogram_9606_" + accession + "_" + resolution + "_V1.tsv",

      // Mus musculus (mouse)
        10090: "native/ideogram_10090_" + accession + "_NA_V2.js"

      // Drosophila melanogaster (fly)
      // 7227: "ucsc/drosophila_melanogaster_dm6.tsv"
      };

      if (typeof chrBands === "undefined" && taxid in bandDataFileNames) {
        d3.request(ideo.config.bandDir + bandDataFileNames[taxid])
        .on("beforesend", function(data) {
          // Ensures correct taxid is processed in response callback; using
          // simply 'taxid' variable gives the last *requested* taxid, which
          // fails when dealing with multiple taxa.
          data.taxid = taxid;
        })
        .get(function(error, data) {
          ideo.bandData[data.taxid] = data.response;
          numBandDataResponses += 1;

          if (numBandDataResponses === taxids.length) {
            processBandData();
            writeContainer();
          }
        });
      } else {
        if (typeof chrBands !== "undefined") {
        // If bands already available,
        // e.g. via <script> tag in initial page load
          ideo.bandData[taxid] = chrBands;
        }
        processBandData();
        writeContainer();
      }
    }
  });

  function writeContainer() {
    if (ideo.config.annotationsPath) {
      d3.json(
        ideo.config.annotationsPath, // URL
        function(data) { // Callback
          ideo.rawAnnots = data;
        }
      );
    }

    svgClass = "";
    if (ideo.config.showChromosomeLabels) {
      if (ideo.config.orientation === "horizontal") {
        svgClass += "labeledLeft ";
      } else {
        svgClass += "labeled ";
      }
    }

    if (
      ideo.config.annotationsLayout &&
      ideo.config.annotationsLayout === "overlay"
    ) {
      svgClass += "faint";
    }

    var gradients = ideo.getBandColorGradients();
    var svgHeight = ideo._layout.getHeight(taxid);

    d3.select(ideo.config.container)
      .append("svg")
        .attr("id", "_ideogram")
        .attr("class", svgClass)
        .attr("width", "97%")
        .attr("height", svgHeight)
        .html(gradients);

    finishInit();
  }

  /*
  * Completes default ideogram initialization
  * by calling downstream functions to
  * process raw band data into full JSON objects,
  * render chromosome and cytoband figures and labels,
  * apply initial graphical transformations,
  * hide overlapping band labels, and
  * execute callbacks defined by client code
  */
  function processBandData() {
    var j, k, chromosome, bands,
      chrLength, chr,
      bandData, bandsByChr,
      taxid, taxids, chrs, chrsByTaxid;

    bandsArray = [];
    maxLength = 0;

    if (ideo.config.multiorganism === true) {
      ideo.coordinateSystem = "bp";
      taxids = ideo.config.taxids;
      for (i = 0; i < taxids.length; i++) {
        taxid = taxids[i];
      }
    } else {
      if (typeof ideo.config.taxid === "undefined") {
        ideo.config.taxid = ideo.config.taxids[0];
      }
      taxid = ideo.config.taxid;
      taxids = [taxid];
      ideo.config.taxids = taxids;
    }

    if ("chromosomes" in ideo.config) {
      chrs = ideo.config.chromosomes;
    }
    if (ideo.config.multiorganism) {
      chrsByTaxid = chrs;
    }

    ideo.config.chromosomes = {};

    var t0B = new Date().getTime();

    for (j = 0; j < taxids.length; j++) {
      taxid = taxids[j];

      if (ideo.config.multiorganism) {
        chrs = chrsByTaxid[taxid];
      }

      if (ideo.coordinateSystem === "iscn" || ideo.config.multiorganism) {
        bandData = ideo.bandData[taxid];

        bandsByChr = ideo.getBands(bandData, taxid, chrs);

        chrs = Object.keys(bandsByChr);

        ideo.config.chromosomes[taxid] = chrs.slice();
        ideo.numChromosomes += ideo.config.chromosomes[taxid].length;

        for (k = 0; k < chrs.length; k++) {
          chromosome = chrs[k];
          bands = bandsByChr[chromosome];
          bandsArray.push(bands);

          chrLength = {
            iscn: bands[bands.length - 1].iscn.stop,
            bp: bands[bands.length - 1].bp.stop
          };

          if (chrLength.iscn > ideo.maxLength.iscn) {
            ideo.maxLength.iscn = chrLength.iscn;
          }

          if (chrLength.bp > ideo.maxLength.bp) {
            ideo.maxLength.bp = chrLength.bp;
          }
        }
      } else if (ideo.coordinateSystem === "bp") {
        // If lacking band-level data

        ideo.config.chromosomes[taxid] = chrs.slice();
        ideo.numChromosomes += ideo.config.chromosomes[taxid].length;

        for (k = 0; k < chrs.length; k++) {
          chr = chrs[k];
          if (chr.length > ideo.maxLength.bp) {
            ideo.maxLength.bp = chr.length;
          }
        }
      }
    }

    var t1B = new Date().getTime();
    if (ideo.debug) {
      console.log("Time in processBandData: " + (t1B - t0B) + " ms");
    }
  }

  function finishInit() {
    try {
      var t0A = new Date().getTime();

      var i;

      ideo.initDrawChromosomes(bandsArray);

      // Waits for potentially large annotation dataset
      // to be received by the client, then triggers annotation processing
      if (ideo.config.annotationsPath) {
        function pa() {
          if (typeof timeout !== "undefined") {
            window.clearTimeout(timeout);
          }

          ideo.annots = ideo.processAnnotData(ideo.rawAnnots);
          ideo.drawProcessedAnnots(ideo.annots);

          if (ideo.initCrossFilter) {
            ideo.initCrossFilter();
          }
        }

        if (ideo.rawAnnots) {
          pa();
        } else {
          (function checkAnnotData() {
            timeout = setTimeout(function() {
              if (!ideo.rawAnnots) {
                checkAnnotData();
              } else {
                pa();
              }
            },
            50
          );
          })();
        }
      }

      if (ideo.config.showBandLabels === true) {
        var bandsToShow = ideo.bandsToShow.join(",");

      // d3.selectAll resolves to querySelectorAll (QSA).
      // QSA takes a surprisingly long time to complete,
      // and scales with the number of selectors.
      // Most bands are hidden, so we can optimize by
      // Hiding all bands, then QSA'ing and displaying the
      // relatively few bands that are shown.
        var t0C = new Date().getTime();
        d3.selectAll(".bandLabel, .bandLabelStalk").style("display", "none");
        d3.selectAll(bandsToShow).style("display", "");
        var t1C = new Date().getTime();
        if (ideo.debug) {
          console.log("Time in showing bands: " + (t1C - t0C) + " ms");
        }

        if (ideo.config.orientation === "vertical") {
          var chrID;
          for (i = 0; i < ideo.chromosomesArray.length; i++) {
            chrID = "#" + ideo.chromosomesArray[i].id;
            ideo.rotateChromosomeLabels(d3.select(chrID), i);
          }
        }
      }

      if (ideo.config.showChromosomeLabels === true) {
        ideo.drawChromosomeLabels(ideo.chromosomes);
      }

      if (ideo.config.brush === true) {
        ideo.createBrush();
      }

      if (ideo.config.annotations) {
        ideo.drawAnnots(ideo.config.annotations);
      }

      var t1A = new Date().getTime();
      if (ideo.debug) {
        console.log("Time in drawChromosome: " + (t1A - t0A) + " ms");
      }

      var t1 = new Date().getTime();
      if (ideo.debug) {
        console.log("Time constructing ideogram: " + (t1 - t0) + " ms");
      }

      if (ideo.onLoadCallback) {
        ideo.onLoadCallback();
      }

      if (!("rotatable" in ideo.config && ideo.config.rotatable === false)) {
        d3.selectAll(".chromosome").on("click", function() {
          ideogram.rotateAndToggleDisplay(this);
        });
      } else {
        d3.selectAll(".chromosome").style("cursor", "default");
      }
    } catch (e) {
      console.log(e);
      //  throw e;
    }
  }
};
