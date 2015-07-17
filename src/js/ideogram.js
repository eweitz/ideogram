// Developed by Eric Weitz (https://github.com/eweitz)

/* Constructs a prototypal Ideogram class */
var Ideogram = function(config) {

  this.config = config;

  if ("chrHeight" in config === false) {
    config.chrHeight = 500;
  } 

  this.bump = Math.round(config.chrHeight / 125);

  if (config.showBandLabels) {
    this.config.chrMargin += 20;
  }

  if (this.config.annotationsPath) {
    
    if (!this.config.annotationHeight) {
      this.config.annotationHeight = 3;
    }

    if (this.config.annotationTracks) {
      this.config.numAnnotTracks = this.config.annotationTracks.length;
    } else {
      this.config.numAnnotTracks = 1;
    }
    this.config.annotTracksHeight = this.config.annotationHeight * this.config.numAnnotTracks;

    if (typeof this.config.barWidth === "undefined") {
      this.config.barWidth = 10;
    }

  } else {
    this.config.annotTracksHeight = 0;
  }

  this.config.chrMargin = (
    this.config.chrMargin + 
    this.config.chrWidth + 
    this.config.annotTracksHeight * 2
  )

  if (config.onLoad) {
    this.onLoadCallback = config.onLoad;
  }

  this.coordinateSystem = "iscn";

  this.maxLength = {
    "bp": 0,
    "iscn": 0
  }

  this.organisms = {
    "9606": {
      "commonName": "Human",
      "scientificName": "Homo sapiens",
      "scientificNameAbbr": "H. sapiens",
    }, 
    "10090": {
      "commonName": "Mouse",
      "scientificName": "Mus musculus",
      "scientificNameAbbr": "M. musculus",
    }, 
  }

  if (this.config.annotationsPath) {
    if (!this.config.annotationHeight) {
      this.config.annotationHeight = 3;
    }
  }

  // A flat array of chromosomes
  // (this.chromosomes is an object of 
  // arrays of chromosomes, keyed by organism)
  this.chromosomesArray = [];

  this.bandsToShow = [];

  this.chromosomes = {};
  this.bandData = {};

  this.init();

}

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
Ideogram.prototype.getBands = function(content, chromosomeName, taxid) {

  var lines = [];
  var tsvLines, columns, line, stain,
      i, prefetched, init, tsvLinesLength;

  if (typeof chrBands === "undefined") {
    delimiter = /\t/;
    tsvLines = content.split(/\r\n|\n/);
    init = 1;
  } else {
    delimiter = / /;
    tsvLines = content;
    init = 0;
  }

  tsvLinesLength = tsvLines.length;

  for (i = init; i < tsvLinesLength; i++) {

    columns = tsvLines[i].split(delimiter);

    if (columns[0] !== chromosomeName) {
      continue;
    }

    stain = columns[7];
    if (columns[8]) {
      // For e.g. acen and gvar, columns[8] (density) is undefined
      stain += columns[8];
    }

    line = {
      "chr": columns[0],
      "bp": {
        "start": parseInt(columns[5], 10),
        "stop": parseInt(columns[6], 10)
      },
      "iscn": {
        "start": parseInt(columns[3], 10),
        "stop": parseInt(columns[4], 10)
      },
      "px": {
        "start": -1,
        "stop": -1,
        "width": -1
      },
      "name": columns[1] + columns[2],
      "stain": stain,
      "taxid": taxid
    };

    lines.push(line);

  }

  return lines;

};

/**
* Generates a model object for each chromosome
* containing information on its name, DOM ID, 
* length in base pairs or ISCN coordinates,
* cytogenetic bands, centromere position, etc.
*/
Ideogram.prototype.getChromosomeModel = function(bands, chromosomeName, taxid, chrIndex) {

  var chr = {};
  var band, scale, 
      width,
      startType, stopType,
      chrHeight = this.config.chrHeight,
      maxLength = this.maxLength,
      chrLength,
      cs;

  cs = this.coordinateSystem;

  chr["chrIndex"] = chrIndex;
  chr["name"] = chromosomeName;

  if (this.config.fullChromosomeLabels === true) {
    var orgName = this.organisms[taxid].scientificNameAbbr;
    chr["name"] = orgName + " chr" + chr.name;
  }

  chr["id"] = "chr" + chromosomeName + "-" + taxid;

  chr["length"] = bands[bands.length - 1][cs].stop;
  chrLength = chr["length"]

  pxStop = 0;

  for (var i = 0; i < bands.length; i++) {
    band = bands[i];

    width = chrHeight * chr["length"]/maxLength[cs] * (band[cs].stop - band[cs].start)/chrLength;

    bands[i]["px"] = {"start": pxStop, "stop": pxStop + width, "width": width};

    pxStop = bands[i].px.stop;

    if (band.stain === "acen" && band.name[0] === "p") {
      chr["pcenIndex"] = i;
    }

  }

  chr["width"] = pxStop;

  chr["scale"] = {}

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
    chr["scale"].bp = 1;
    //chr["scale"].bp = band.iscn.stop / band.bp.stop;
    chr["scale"].iscn = chrHeight * chrLength/maxLength.bp;
  } else {
    chr["scale"].bp = chrHeight / maxLength.bp;
    chr["scale"].iscn = chrHeight / maxLength.iscn;
  }
  chr["bands"] = bands;

  chr["centromerePosition"] = "";
  if (bands[0].bp.stop - bands[0].bp.start == 1) {
    // As with mouse
    chr["centromerePosition"] = "telocentric";

    // Remove placeholder pter band
    chr["bands"] = chr["bands"].slice(1);
  }

  return chr;
}

/**
* Draws labels for each chromosome, e.g. "1", "2", "X".
* If ideogram configuration has 'fullChromosomeLabels: True', 
* then labels includes name of taxon, which can help when
* depicting orthologs. 
*/
Ideogram.prototype.drawChromosomeLabels = function(chromosomes) {

  var i, chr, chrs, taxid, ideo,
      chrMargin2;

  chrs = [];

  for (taxid in chromosomes) {
    for (chr in chromosomes[taxid]) {
      chrs.push(chromosomes[taxid][chr]);
    }
  }
  
  ideo = this;

  chrMargin2 = ideo.config.chrMargin - ideo.config.chrWidth - 2;
  if (ideo.config.orientation === "vertical" && ideo.config.showBandLabels === true) {
    chrMargin2 = ideo.config.chrMargin + 8;
  }

  if (ideo.config.orientation === "vertical") {

    d3.selectAll(".chromosome")
      .append("text")
       .data(chrs)
        .attr("class", "chrLabel")
        .attr("transform", "rotate(-90)")
        .attr("y", -16)
        .each(function (d, i) {

          var i, chrMargin, x, cls;

          var arr = d.name.split(" ");
          var lines = [];

          if (arr != undefined) {
              lines.push(arr.slice(0, arr.length - 1).join(" "))
              lines.push(arr[arr.length - 1]);

              if (!ideo.config.showBandLabels) {
                i += 1;
              }

              chrMargin = (ideo.config.chrMargin) * i;
              x = -(chrMargin + chrMargin2) + 3 + ideo.config.annotTracksHeight * 2;

              for (var i = 0; i < lines.length; i++) {

                  cls = "";
                  if (i == 0 && ideo.config.fullChromosomeLabels) {
                    cls = "italic";
                  }

                  d3.select(this).append("tspan")
                    .text(lines[i])
                    .attr("dy", i ? "1.2em" : 0)
                    .attr("x", x)
                    .attr("text-anchor", "middle")
                    .attr("class", cls);
              }
          }
        })
        
  } else {

     d3.selectAll(".chromosome")
        .append("text")
         .data(chrs)
          .attr("class", "chrLabel")
          .attr("x", -5)
          .each(function (d, i) {

            var i, chrMargin, y, cls;

            var arr = d.name.split(" ");
            var lines = [];

            if (arr != undefined) {
                lines.push(arr.slice(0, arr.length - 1).join(" "))
                lines.push(arr[arr.length - 1]);

                chrMargin = ideo.config.chrMargin * i;
                y = (chrMargin + chrMargin2) + 9;

                for (var i = 0; i < lines.length; i++) {

                    cls = "";
                    if (i == 0 && ideo.config.fullChromosomeLabels) {
                      cls = "italic";
                    }

                    d3.select(this).append("tspan")
                      .text(lines[i])
                      .attr("dy", i ? "1.2em" : 0)
                      .attr("y", y)
                      .attr("x", -8)
                      .attr("text-anchor", "middle")
                      .attr("class", cls);
                }
            }
          })

  }
   
}

/**
* Draws labels and stalks for cytogenetic bands.  
* 
* Band labels are text like "p11.11".  
* Stalks are small lines that visually connect labels to their bands.
*/
Ideogram.prototype.drawBandLabels = function(chromosomes) {
  
  var i, chr, chrs, taxid, ideo,
      chrMargin2;

  ideo = this;

  chrs = [];

  for (taxid in chromosomes) {
    for (chr in chromosomes[taxid]) {
      chrs.push(chromosomes[taxid][chr]);
    }
  }

  var textOffsets = {};

  chrIndex = 0;
  for (var i = 0; i < chrs.length; i++) {

    chrIndex += 1;
    
    chrModel = chrs[i];

    chr = d3.select("#" + chrModel.id);

    var chrMargin = this.config.chrMargin * chrIndex,
        lineY1, lineY2,
        ideo = this;

    lineY1 = chrMargin;
    lineY2 = chrMargin - 8;

    if (
      chrIndex == 1 &&
      "perspective" in this.config && this.config.perspective == "comparative"
    ) {
      lineY1 += 18;
      lineY2 += 18;
    } 

    textOffsets[chrModel.id] = [];

    chr.selectAll("text")
      .data(chrModel.bands)
      .enter()
      .append("g")
        .attr("class", function(d, i) { return "bandLabel bsbsl-" + i  })
        .attr("transform", function(d) {

          var x, y;

          x = -8 + d.px.start + d.px.width/2;

          textOffsets[chrModel.id].push(x + 13);
          y = chrMargin - 10;

          return "translate(" + x + "," + y + ")";
        })
        .append("text")
        .text(function(d) { return d.name; })

    chr.selectAll("line.bandLabelStalk")
      .data(chrModel.bands)
      .enter()
      .append("g")
      .attr("class", function(d, i) { return "bandLabelStalk bsbsl-" + i  })
      .attr("transform", function(d) {
        var x = d.px.start + d.px.width/2;
        return "translate(" + x + ", " + lineY1 + ")";
      })
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", -8)   
  }

  for (var i = 0; i < chrs.length; i++) {

    chrModel = chrs[i];

    var textsLength = textOffsets[chrModel.id].length,
        overlappingLabelXRight,
        index,
        indexesToShow = [],
        prevHiddenBoxIndex,
        prevTextBox,
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
        //prevTextBox = texts[index].getBoundingClientRect();
        //prevLabelXRight = prevTextBox.left + prevTextBox.width;

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

    for (var j = 0; j < ithLength; j++) {
      index = indexesToShow[j];
      selectorsToShow.push("#" + chrModel.id + " .bsbsl-" + index);
    }
    
    this.bandsToShow = this.bandsToShow.concat(selectorsToShow);

  }

}

/**
* Rotates chromosome labels by 90 degrees, e.g. upon clicking a chromosome to focus.
*/
Ideogram.prototype.rotateChromosomeLabels = function(chr, chrIndex, orientation, scale) {

  var chrMargin, chrWidth, ideo, x, y,
      numAnnotTracks, scaleSvg;

  chrWidth = this.config.chrWidth;
  chrMargin = this.config.chrMargin * chrIndex;
  numAnnotTracks = this.config.numAnnotTracks;

  ideo = this;

  if (typeof(scale) !== "undefined" && scale.hasOwnProperty("x") && !(scale.x == 1 && scale.y == 1)) {
    scaleSvg = "scale(" + scale.x + "," + scale.y + ")";
    x = -2;
    y = (scale === "" ? -16 : -12);
  } else {
    x = -8;
    y = -16;
    scale = {"x": 1, "y": 1};
    scaleSvg = "";
  }

  if (orientation == "vertical" || orientation == "") {

    chr.selectAll("text.chrLabel")
      .attr("transform", scaleSvg)
      .selectAll("tspan")
        .attr("x", x)
        .attr("y", function(d, i) { 

          var ci = chrIndex - 1;

          if (numAnnotTracks > 1 || orientation == "") {
            ci -= 1;
          }

          chrMargin2 = -4;
          if (ideo.config.showBandLabels === true) {
            chrMargin2 = ideo.config.chrMargin + chrWidth + 26;
          }

          var chrMargin = ideo.config.chrMargin * ci;

          if (numAnnotTracks > 1 == false) {
            chrMargin += 1;
          }

          return chrMargin + chrMargin2;
        })

  } else {

    chrIndex -= 1;

    chrMargin2 = -chrWidth - 2;
    if (ideo.config.showBandLabels === true) {
      chrMargin2 = ideo.config.chrMargin + 8;
    } 

    chr.selectAll("text.chrLabel")
      .attr("transform", "rotate(-90)" + scaleSvg)
      .selectAll("tspan")
      .attr("x", function(d, i) { 

        chrMargin = ideo.config.chrMargin * chrIndex;
        x = -(chrMargin + chrMargin2) + 3 + ideo.config.annotTracksHeight * 2;
        x = x/scale.x
        return x;
      })
      .attr("y", y)

  }

}

/** 
* Rotates band labels by 90 degrees, e.g. upon clicking a chromosome to focus.
*
* This method includes proportional scaling, which ensures that 
* while the parent chromosome group is scaled strongly in one dimension to fill
* available space, the text in the chromosome's band labels is 
* not similarly distorted, and remains readable.
*/
Ideogram.prototype.rotateBandLabels = function(chr, chrIndex, scale) {
  
  var chrMargin, chrWidth, scaleSvg,
      orientation, bandLabels;

  bandLabels = chr.selectAll(".bandLabel");

  chrWidth = this.config.chrWidth;
  chrMargin = this.config.chrMargin * chrIndex;

  orientation = chr.attr("data-orientation");

  if (typeof(scale) == "undefined") {
    scale = {x: 1, y: 1};
    scaleSvg = "";
  } else {
    scaleSvg = "scale(" + scale.x + "," + scale.y + ")";
  }

  if (
    chrIndex == 1 &&
    "perspective" in this.config && this.config.perspective == "comparative"
  ) {
    bandLabels
      .attr("transform", function(d) {
        var x, y;
        x = (8 - chrMargin) - 26;
        y = 2 + d.px.start + d.px.width/2;
        return "rotate(-90)translate(" + x + "," + y + ")";
      })
      .selectAll("text")
        .attr("text-anchor", "end")
  } else if (orientation == "vertical")  {
    bandLabels
      .attr("transform", function(d) {
        var x, y;
        x = 8 - chrMargin;
        y = 2 + d.px.start + d.px.width/2;
        return "rotate(-90)translate(" + x + "," + y + ")";
      })
      .selectAll("text")
        .attr("transform", scaleSvg)
  } else {
    bandLabels
      .attr("transform", function(d) {
        var x, y;
        x = -8*scale.x + d.px.start + d.px.width/2;
        y = chrMargin - 10;
        return "translate(" + x + "," + y + ")";
      })
      .selectAll("text")
        .attr("transform", scaleSvg)

    chr.selectAll(".bandLabelStalk line")
      .attr("transform", scaleSvg)
  }

}

/**
* Renders all the bands and outlining boundaries of a chromosome.
*/
Ideogram.prototype.drawChromosome = function(chrModel, chrIndex) {

  var chr, chrWidth, width,
      pArmWidth, selector, qArmStart, qArmWidth,
      pTerPad, chrClass, 
      annotHeight, numAnnotTracks, annotTracksHeight,
      bump, ideo;

  ideo = this;

  bump = ideo.bump;

  // p-terminal band padding
  if (chrModel.centromerePosition != "telocentric") {
    pTerPad = bump;
  } else {
    pTerPad = Math.round(bump/4);
  }

  chr = d3.select("svg")
    .append("g")
      .attr("id", chrModel.id)
      .attr("class", "chromosome");

  chrWidth = ideo.config.chrWidth;
  width = chrModel.width;

  var chrMargin = ideo.config.chrMargin * chrIndex;

  // Draw chromosome bands
  chr.selectAll("path")   
    .data(chrModel.bands)    
    .enter()
    .append("path")       
      .attr("id", function(d) { 
        // e.g. 1q31
        var band = d.name.replace(".", "-"); 
        return chrModel.id + "-" + band; 
      })
      .attr("class", function(d) { 
        var cls = "band " + d.stain;
        if (d.stain == "acen") {
          var arm = d.name[0]; // e.g. p in p11
          cls += " " + arm + "-cen";
        } 
        return cls;
      })
      .attr("d", function(d, i) {
        var x = d.px.width,
            left = d.px.start;

        if (d.stain == "acen") {
          // Pericentromeric bands get curved 
          x -= bump/2;
          if (d.name[0] == "p") {
            // p arm
            d = 
              "M " + (left) + " " + chrMargin + " " + 
              "l " + x + " 0 " + 
              "q " + bump + " " + chrWidth/2 + " 0 " + chrWidth + " " + 
              "l -" + x + " 0 z";
          } else {
            // q arm
            d = 
              "M " + (left + x + bump/2) + " " + chrMargin + " " + 
              "l -" + x + " 0 " + 
              "q -" + (bump + 0.5) + " " + chrWidth/2 + " 0 " + chrWidth + " " + 
              "l " + x + " 0 z";
          }
        } else {  
          // Normal bands

          if (i == 0) {
            left += pTerPad;

            // TODO: this is a minor kludge to preserve visible
            // centromeres in mouse, when viewing mouse and
            // human chromosomes for e.g. orthology analysis
            if (ideo.config.multiorganism === true) {
              left += pTerPad;
            }

          }

          d = 
            "M " + left + " " + chrMargin + " " + 
            "l " + x + " 0 " + 
            "l 0 " + chrWidth + " " + 
            "l -" + x + " 0 z";
        }

        return d;
      })

  if (chrModel.centromerePosition != "telocentric") {
    // As in human
    chr.append('path')
      .attr("class", "p-ter chromosomeBorder " + chrModel.bands[0].stain)
      .attr("d", 
        "M " + pTerPad + " " + chrMargin + " " + 
        "q -" + pTerPad + " " + (chrWidth/2) + " 0 " + chrWidth)
  } else {
    // As in mouse
    chr.append('path')
      .attr("class", "p-ter chromosomeBorder " + chrModel.bands[0].stain)
      .attr("d", 
        "M " + pTerPad + " " + chrMargin + " " + 
        "l -" + pTerPad + " 0 " + 
        "l 0 " + chrWidth + " " + 
        "l " + pTerPad + " 0 z")  

    chr.insert('path', ':first-child')
      .attr("class", "acen")
      .attr("d",
        "M " + (pTerPad - 1) + " " + (chrMargin + chrWidth * 0.1) + " " +
        "l " + (pTerPad + bump/2 + 1) + " 0 " + 
        "l 0 " + chrWidth * 0.8 + " " + 
        "l -" + (pTerPad + bump/2 + 1) + " 0 z")
      
  }

  chr.append('path')
    .attr("class", "q-ter chromosomeBorder " + chrModel.bands[chrModel.bands.length - 1].stain)
    .attr("d", 
      "M " + width + " " + chrMargin + " " + 
      "q " + bump + " " +  chrWidth/2 + " 0 " + chrWidth
    )
  
  var pcenIndex = chrModel["pcenIndex"],
      pcen = chrModel.bands[pcenIndex],
      qcen = chrModel.bands[pcenIndex + 1];

  // Why does human chromosome 11 lack a centromeric p-arm band?
  // Answer: because of a bug in the data.  Hack removed; won't work
  // for human 550 resolution until data is fixed.
  if (pcenIndex > 0) {
    pArmWidth = pcen.px.start;
    qArmStart = qcen.px.stop;
  } else {
    // For telocentric centromeres, as in many mouse chromosomes
    pArmWidth = 5;
    qArmStart = document.querySelectorAll("#" + chrModel.id + " .band")[0].getBBox().x;
  }

  qArmWidth = chrModel.width - qArmStart;

  chr.append('line')
    .attr("class", "cb-p-arm-top chromosomeBorder")
    .attr('x1', bump)
    .attr('y1', chrMargin)
    .attr('x2', pArmWidth)
    .attr("y2", chrMargin)

  chr.append('line')
    .attr("class", "cb-p-arm-bottom chromosomeBorder")
    .attr('x1', bump)
    .attr('y1', chrWidth + chrMargin)
    .attr('x2', pArmWidth)
    .attr("y2", chrWidth + chrMargin)

  chr.append('line')
    .attr("class", "cb-q-arm-top chromosomeBorder")
    .attr('x1', qArmStart)
    .attr('y1', chrMargin)
    .attr('x2', qArmStart + qArmWidth)
    .attr("y2", chrMargin)

  chr.append('line')
    .attr("class", "cb-q-arm-bottom chromosomeBorder")
    .attr('x1', qArmStart)
    .attr('y1', chrWidth + chrMargin)
    .attr('x2', qArmStart + qArmWidth)
    .attr("y2", chrWidth + chrMargin)

}


/**
* Rotates and translates chromosomes upon initialization as needed.
*/
Ideogram.prototype.initTransformChromosome = function(chr, chrIndex) {

  if (this.config.orientation == "vertical") {

    var chrMargin, chrWidth, tPadding;

    chrWidth = this.config.chrWidth;
    chrMargin = this.config.chrMargin * chrIndex;

    if (!this.config.showBandLabels) {
      chrIndex += 2;
    }

    tPadding = chrMargin + (chrWidth-4)*(chrIndex - 1);

    chr
      .attr("data-orientation", "vertical")
      .attr("transform", "rotate(90, " + (tPadding - 30) + ", " + (tPadding) + ")")

    this.rotateBandLabels(chr, chrIndex);

  } else {
    chr.attr("data-orientation", "horizontal")
  }
}

/**
* Rotates a chromosome 90 degrees and shows or hides all other chromosomes
* Useful for focusing or defocusing a particular chromosome
*/
Ideogram.prototype.rotateAndToggleDisplay = function(chromosomeID) {

  var id, chr, chrModel, chrIndex, chrMargin, chrWidth,
      chrHeight, ideoBox, ideoWidth, ideoHeight, scaleX, scaleY,
      initOrientation, currentOrientation,
      cx, cy, cy2,
      ideo = this;

  id = chromosomeID;

  chr = d3.select("#" + id);

  chrModel = ideo.chromosomes[ideo.config.taxid][id.split("-")[0].split("chr")[1]]

  chrIndex = chrModel["chrIndex"];

  otherChrs = d3.selectAll("g.chromosome").filter(function(d, i) { return this.id !== id; });

  initOrientation = ideo.config.orientation;
  currentOrientation = chr.attr("data-orientation");  

  chrMargin = this.config.chrMargin * chrIndex;
  chrWidth = this.config.chrWidth;

  ideoBox = d3.select("#ideogram")[0][0].getBoundingClientRect();
  ideoHeight = ideoBox.height;
  ideoWidth = ideoBox.width;

  if (initOrientation == "vertical") {

    chrLength = chr[0][0].getBoundingClientRect().height;

    scaleX = (ideoWidth/chrLength)*0.99;
    scaleY = 1.5;
    scale = "scale(" + scaleX + ", " + scaleY + ")";

    inverseScaleX = 2/scaleX;
    inverseScaleY = 1;

    if (!this.config.showBandLabels) {
      chrIndex += 2;
    }

    cx = chrMargin + (chrWidth-4)*(chrIndex - 1) - 30;
    cy = cx + 30; 

    verticalTransform = "rotate(90, " + cx + ", " + cy + ")";

    cy2 = -1*(chrMargin - this.config.annotTracksHeight)*scaleY;

    if (this.config.showBandLabels) {
      cy2 += 25;
    }

    horizontalTransform = 
      "rotate(0)" + 
      "translate(0, " + cy2 + ")" + 
      scale;

  } else {

    chrLength = chr[0][0].getBoundingClientRect().width;

    scaleX = (ideoHeight/chrLength)*0.99;
    scaleY = 1.5;
    scale = "scale(" + scaleX + ", " + scaleY + ")";

    inverseScaleX = 2/scaleX;
    inverseScaleY = 1;

    var bandPad = 20;
    if (!this.config.showBandLabels) {
      chrIndex += 2;
      bandPad = 15;
    }
    cx = chrMargin + (chrWidth-bandPad)*(chrIndex - 2);
    cy = cx;

    if (!this.config.showBandLabels) {
      cx += bandPad;
      cy += bandPad;
    }

    verticalTransform = (
      "rotate(90, " + cx + ", " + cy + ")" + 
      scale
    )
    horizontalTransform = "";
    
  }

  inverseScale = "scale(" + inverseScaleX + "," + inverseScaleY + ")";

  if (currentOrientation != "vertical") {

    if (initOrientation == "horizontal") {
      otherChrs.style("display", "none");

    }

    chr.selectAll(".annot>path")
      .attr("transform", (initOrientation == "vertical" ? "" : inverseScale));   

    chr
      .attr("data-orientation", "vertical")
      .transition()
      .attr("transform", verticalTransform)
      .each("end", function() {

        if (initOrientation == "vertical") {
          scale = "";
        } else {
          scale = {"x": inverseScaleY, "y": inverseScaleX};
        }

        ideo.rotateBandLabels(chr, chrIndex, scale);
        ideo.rotateChromosomeLabels(chr, chrIndex, "horizontal", scale); 

        if (initOrientation == "vertical") {
          otherChrs.style("display", "");
        }

      })

  } else {

    chr.attr("data-orientation", "");

    if (initOrientation == "vertical") {
      otherChrs.style("display", "none");
    } 

    chr.selectAll(".annot>path")
      .transition()
      .attr("transform", (initOrientation == "vertical" ? inverseScale : ""));   

    chr
      .transition()
      .attr("transform", horizontalTransform)
      .each("end", function() {

        if (initOrientation == "horizontal") {
          if (currentOrientation == "vertical") {
            inverseScale = {"x": 1, "y": 1}; 
          } else {
            inverseScale = "";
          }
        } else {
          inverseScale = {"x": inverseScaleX, "y": inverseScaleY}; 
        }

        ideo.rotateBandLabels(chr, chrIndex, inverseScale);
        ideo.rotateChromosomeLabels(chr, chrIndex, "", inverseScale);

        if (initOrientation == "horizontal") {
          otherChrs.style("display", "");
        }
      
      })
      

  }
}



/**
* Converts base pair coordinates to pixel offsets.
* Bp-to-pixel scales differ among cytogenetic bands.
*/
Ideogram.prototype.convertBpToPx = function(chr, bp) {

  var i, band, bpToIscnScale, iscn, px;

  for (i = 0; i < chr.bands.length; i++) {
    band = chr.bands[i];
    if (bp >= band.bp.start && bp <= band.bp.stop) {
      
      bpToIscnScale = (band.iscn.stop - band.iscn.start)/(band.bp.stop - band.bp.start);
      iscn = band.iscn.start + (bp - band.bp.start) * bpToIscnScale;

      px = 30 + band.px.start + (band.px.width * (iscn - band.iscn.start)/(band.iscn.stop - band.iscn.start))
 
      return px;
    }
  }

  throw new Error(
    "Base pair out of range.  " + 
    "bp: " + bp + "; length of chr" + chr.name + ": " + band.bp.stop
  );

}

/**
* Converts base pair coordinates to pixel offsets.
* Bp-to-pixel scales differ among cytogenetic bands.
*/
Ideogram.prototype.convertPxToBp = function(chr, px) {

  var i, band, prevBand, bpToIscnScale, iscn;

  for (i = 0; i < chr.bands.length; i++) {
    band = chr.bands[i];
    if (px >= band.px.start && px <= band.px.stop) {
      
      pxToIscnScale = (band.iscn.stop - band.iscn.start)/(band.px.stop - band.px.start);
      iscn = band.iscn.start + (px - band.px.start) * pxToIscnScale;

      bp = band.bp.start + ((band.bp.stop - band.bp.start) * (iscn - band.iscn.start)/(band.iscn.stop - band.iscn.start))

      return Math.round(bp);
    }
  }

  throw new Error(
    "Pixel out of range.  " + 
    "px: " + bp + "; length of chr" + chr.name + ": " + band.px.stop
  );

}

/**
* Draws a trapezoid connecting a genomic range on 
* one chromosome to a genomic range on another chromosome;
* a syntenic region.
*/
Ideogram.prototype.drawSynteny = function(syntenicRegions) {

  var t0 = new Date().getTime();

  var r1, r2,
      c1Box, c2Box,
      chr1Plane, chr2Plane, 
      polygon, 
      region,
      syntenies, synteny,
      i, svg, color, opacity,
      regionID;

  syntenies = d3.select("svg")
    .append("g")
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

    c1Box = document.querySelectorAll("#" + r1.chr.id + " path")[0].getBBox();
    c2Box = document.querySelectorAll("#" + r2.chr.id + " path")[0].getBBox();
    
    chr1Plane = c1Box.y - 30
    chr2Plane = c2Box.y - 29;

    regionID = (
      r1.chr.id + "_" + r1.start + "_" + r1.stop + "_" + 
      "__" + 
      r2.chr.id + "_" + r2.start + "_" + r2.stop
    )

    syntenicRegion = syntenies.append("g")
      .attr("class", "syntenicRegion")
      .attr("id", regionID)
      .on("click", function() {

        var activeRegion = this;
        var others = d3.selectAll(".syntenicRegion")
          .filter(function(d, i) {
            return (this !== activeRegion);
          })

        others.classed("hidden", !others.classed("hidden"))
      
      })
      .on("mouseover", function() {
        var activeRegion = this;
        d3.selectAll(".syntenicRegion")
          .filter(function(d, i) {
            return (this !== activeRegion);
          })
          .classed("ghost", true)
      })  
      .on("mouseout", function() {
        d3.selectAll(".syntenicRegion").classed("ghost", false)
      })
      

    syntenicRegion.append("polygon")
      .attr("points",
        chr1Plane + ', ' + r1.startPx + ' ' + 
        chr1Plane + ', ' + r1.stopPx + ' ' + 
        chr2Plane + ', ' + r2.stopPx + ' ' +  
        chr2Plane + ', ' + r2.startPx
      )
      .attr('style', "fill: " + color + "; fill-opacity: " + opacity)
      
    syntenicRegion.append("line")
      .attr("class", "syntenyBorder")
      .attr("x1", chr1Plane)
      .attr("x2", chr2Plane)
      .attr("y1", r1.startPx)
      .attr("y2", r2.startPx)
      
    syntenicRegion.append("line")
      .attr("class", "syntenyBorder")
      .attr("x1", chr1Plane)
      .attr("x2", chr2Plane)
      .attr("y1", r1.stopPx)
      .attr("y2", r2.stopPx)
  }

  var t1 = new Date().getTime();
  console.log("Time in drawSyntenicRegions: " + (t1 - t0) + " ms");

}

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

  var i, j, annot, annots, rawAnnot,
      chr, start, stop,
      chrModel, 
      startPx, stopPx, px,
      trackIndex, color,
      ideo = this;

  annots = [];

  for (i = 0; i < rawAnnots.length; i++) {
    annotsByChr = rawAnnots[i]
    
    annots.push({"chr": annotsByChr.chr, "annots": []});

    for (j = 0; j < annotsByChr.annots.length; j++) {

      chr = annotsByChr.chr; 
      ra = annotsByChr.annots[j];

      start = ra[1],
      stop = ra[2]

      chrModel = ideo.chromosomes["9606"][chr]

      startPx = ideo.convertBpToPx(chrModel, start);
      stopPx = ideo.convertBpToPx(chrModel, stop);

      px = Math.round((startPx + stopPx)/2) - 28;

      // TODO: Make color configurable
      color = "#F00";
      if (ideo.config.annotationTracks) {
        trackIndex = ra[3]
        color = ideo.config.annotationTracks[trackIndex].color;
      } else {
        trackIndex = 0;
      }

      annot = {
        id: ra[0],
        chrIndex: i,
        start: start,
        stop: stop,
        px: px,
        color: color,
        trackIndex: trackIndex
      }

      annots[i]["annots"].push(annot)
    }
  }

  return annots;

}

/*
* Can be used for bar chart or sparkline
*/
Ideogram.prototype.getHistogramBars = function(annots) {

  var t0 = new Date().getTime();

  var i, j, chrs, chr, 
      chrModels, chrPxStop, px,
      chrAnnots, annot, start, stop,
      bars, bar, barPx, nextBarPx, barIndex, barWidth,
      maxAnnotsPerBar, barHeight,
      ideo = this;

  bars = [];

  barWidth = ideo.config.barWidth;

  chrModels = ideo.chromosomes[ideo.config.taxid];
  
  for (chr in chrModels) {
    chrModel = chrModels[chr];
    chrIndex = chrModel.chrIndex
    lastBand = chrModel["bands"][chrModel["bands"].length - 1]
    chrPxStop = lastBand.px.stop;
    numBins = Math.round(chrPxStop / barWidth);
    bar = {"chr": chr, "annots": []}
    for (i = 0; i < numBins; i++) {
      px = i*barWidth;
      bp = ideo.convertPxToBp(chrModel, px);
      bar["annots"].push({"bp": bp, "px": px, "count": 0, "chrIndex": chrIndex, "color": "#F00"});
    }
    bars.push(bar);
  }

  for (chr in annots) {
    chrAnnots = annots[chr].annots;
    chrName = annots[chr].chr;
    chrModel = chrModels[chrName];
    chrIndex = chrModel.chrIndex;
    barAnnots = bars[chrIndex - 1]["annots"];
    for (i = 0; i < chrAnnots.length; i++) {
      annot = chrAnnots[i];
      px = annot.px;
      for (j = 0; j < barAnnots.length - 1; j++) {
        barPx = barAnnots[j].px;
        nextBarPx = barAnnots[j + 1].px;
        if (px > barPx && px < nextBarPx) {
          bars[chrIndex - 1]["annots"][j]["count"] += 1;
          break;
        }
      }
    }
  }

  maxAnnotsPerBar = 0;
  for (i = 0; i < bars.length; i++) {
    annots = bars[i]["annots"];
    for (j = 0; j < annots.length; j++) {
      barCount = annots[j]["count"];
      if (barCount > maxAnnotsPerBar) {
        maxAnnotsPerBar = barCount;
      }
    }
  }

  // Set each bar's height to be proportional to 
  // the height of the bar with the most annotations
  for (i = 0; i < bars.length; i++) {
    annots = bars[i]["annots"];
    for (j = 0; j < annots.length; j++) {
      barCount = annots[j]["count"];
      height = (barCount/maxAnnotsPerBar) * ideo.config.chrMargin - 1;
      //console.log(height)
      bars[i]["annots"][j]["height"] = height;
    }
  }

  var t1 = new Date().getTime();
  console.log("Time spent in getHistogramBars: " + (t1 - t0) + " ms");

  return bars;

}


/**
* Draws genome annotations on chromosomes.
* Annotations can be rendered as either overlaid directly
* on a chromosome, or along one or more "tracks"
* running parallel to each chromosome.
*/
Ideogram.prototype.drawAnnots = function(annots) {

  var chrMargin, chrWidth, layout,
      annotHeight, triangle, chrAnnot, 
      x1, x2, y1, y2,
      ideo = this;

  chrMargin = this.config.chrMargin;
  chrWidth = this.config.chrWidth;

  layout = "tracks";
  if (this.config.annotationsLayout) {
    layout = this.config.annotationsLayout;
  } 

  if (layout === "histogram") {
    annots = ideo.getHistogramBars(annots)
  }

  annotHeight = this.config.annotationHeight;
  triangle = 'l -' + annotHeight + ' ' + (2*annotHeight) + ' l ' + (2*annotHeight) + ' 0 z';

  chrAnnot = d3.selectAll(".chromosome")
    .data(annots)
      .selectAll("path.annot")
      .data(function(d) { 
        //console.log("d");
        //console.log(d)
        return d["annots"]}
      )
      .enter()

  if (layout === "tracks") {

    chrAnnot
      .append("g")
      .attr("id", function(d, i) { return d.id; })
      .attr("class", "annot")
      .attr("transform", function(d) {
        var y = (d.chrIndex + 1) * chrMargin + chrWidth + (d.trackIndex * annotHeight * 2);
        return "translate(" + d.px + "," + y + ")";
      })
      .append("path")
      .attr("d", "m0,0" + triangle)
      .attr("fill", function(d) { return d.color })

    } else if (layout === "overlay") {
      // Overlaid annotations appear directly on chromosomes

      chrAnnot.append("polygon")
        .attr("id", function(d, i) { return d.id; })
        .attr("class", "annot")
        .attr("points", function(d) { 

          x1 = d.px - 0.5;
          x2 = d.px + 0.5;
          y1 = (d.chrIndex + 1) * (chrMargin) + chrWidth;
          y2 = (d.chrIndex + 1) * (chrMargin)
          
          return (
            x1 + "," + y1 + " " +
            x2 + "," + y1 + " " +
            x2 + "," + y2 + " " +
            x1 + "," + y2
          );

        })
        .attr("fill", function(d) { return d.color })
    
    } else if (layout === "histogram") {

      chrAnnot.append("polygon")
        //.attr("id", function(d, i) { return d.id; })
        .attr("class", "annot")
        .attr("points", function(d) { 

          //console.log(d.height)

          x1 = d.px + ideo.bump;
          x2 = d.px + ideo.config.barWidth + ideo.bump;
          y1 = (d.chrIndex) * (chrMargin) + chrWidth;
          y2 = (d.chrIndex) * (chrMargin) + chrWidth + d.height;
          
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
        .attr("fill", function(d) { return d.color })

    }

}

/** 
* Called when Ideogram has finished initializing.
* Accounts for certain ideogram properties not being set until 
* asynchronous requests succeed, etc.
*/
Ideogram.prototype.onLoad = function() {
  call(this.onLoadCallback);
}

/**
* Initializes an ideogram.
* Sets some high-level properties based on instance configuration, 
* fetches band and annotation data if needed, and 
* writes an SVG element to the document to contain the ideogram
* 
*/
Ideogram.prototype.init = function() {

  var bandDataFile,
      isMultiOrganism = (this.config.multiorganism === true),
      taxid, taxids, i, svgClass,
      chrs, numChromosomes;

  var ideo = this;

  var t0 = new Date().getTime();

  if (isMultiOrganism == false) {
    if (typeof this.config.taxid == "undefined") {
      this.config.taxid = "9606";
    }
    taxid = this.config.taxid;
    taxids = [taxid];
    this.config.taxids = taxids;
    chrs = this.config.chromosomes.slice();
    this.config.chromosomes = {};
    this.config.chromosomes[taxid] = chrs;
    numChromosomes = this.config.chromosomes[taxid].length;
  } else {
    this.coordinateSystem = "bp";
    taxids = this.config.taxids;
    numChromosomes = 0;
    for (i = 0; i < taxids.length; i++) {
      taxid = taxids[i];
      numChromosomes += this.config.chromosomes[taxid].length;
    }
  }

  if (this.config.annotationsPath) {
    d3.json(
      ideo.config.annotationsPath, // URL
      function(data) { // Callback
        ideo.rawAnnots = data.annots;
      }
    );
  }

  svgClass = "";
  if (this.config.showChromosomeLabels) {
    if (this.config.orientation == "horizontal") {
      svgClass += "labeledLeft ";
    } else {
      svgClass += "labeled ";
    }
  }

  if (
    this.config.annotationsLayout && 
    this.config.annotationsLayout === "overlay"
  ) {
    svgClass += "faint"
  }

  var svg = d3.select("body")
    .append("svg")
    .attr("id", "ideogram")
    .attr("class", svgClass)
    .attr("width", "97%")
    .attr("height", this.config.chrHeight + 40)

  var bandsArray = [],
      maxLength = 0,
      numBandDataResponses = 0;


  for (i = 0; i < taxids.length; i++) {
    taxid = taxids[i];

    bandDataFileNames = {
      9606: "ideogram_9606_GCF_000001305.14_850_V1",
      10090: "ideogram_10090_GCF_000000055.19_NA_V2"
    }

    if (typeof chrBands === "undefined") {

      d3.xhr("../data/bands/ncbi/" + bandDataFileNames[taxid])
        .on("beforesend", function(data) {
          // Ensures correct taxid is processed in response callback; using 
          // simply 'taxid' variable gives the last *requested* taxid, which
          // fails when dealing with multiple taxa.
          data.taxid = taxid;
        })
        .get(function(error, data) {
          ideo.bandData[data.taxid] = data.response;
          numBandDataResponses += 1;

          if (numBandDataResponses == taxids.length) {
            processBandData();
          }
        }
      )
    } else {
      ideo.bandData["9606"] = chrBands;
      processBandData();
    }

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

    var j, k, chromosome, bands, chromosomeModel,
        chrLength,
        bandData, 
        stopType,
        taxids = ideo.config.taxids;

    bandsArray = [];
    maxLength = 0;


    var t0_b = new Date().getTime();
    for (j = 0; j < taxids.length; j++) {
      
      taxid = taxids[j];
      bandData = ideo.bandData[taxid];

      chrs = ideo.config.chromosomes[taxid];

      for (k = 0; k < chrs.length; k++) {
        
        chromosome = chrs[k];
        bands = ideo.getBands(bandData, chromosome, taxid);
        bandsArray.push(bands);

        chrLength = {
          "iscn": bands[bands.length - 1].iscn.stop,
          "bp": bands[bands.length - 1].bp.stop
        }

        if (chrLength.iscn > ideo.maxLength.iscn) {
          ideo.maxLength.iscn = chrLength.iscn;
        }

        if (chrLength.bp > ideo.maxLength.bp) {
          ideo.maxLength.bp = chrLength.bp;
        }
      }
    }
    var t1_b = new Date().getTime();
    console.log("Time in getBands: " + (t1_b - t0_b) + " ms")

    var chrIndex = 0;

    var t0_a = new Date().getTime();

    for (j = 0; j < taxids.length; j++) {
      
      taxid = taxids[j];
      chrs = ideo.config.chromosomes[taxid];

      ideo.chromosomes[taxid] = {}
      
      for (k = 0; k < chrs.length; k++) {

        bands = bandsArray[chrIndex];
        
        chrIndex += 1;
        
        chromosome = chrs[k];
        chromosomeModel = ideo.getChromosomeModel(bands, chromosome, taxid, chrIndex);
        
        ideo.chromosomes[taxid][chromosome] = chromosomeModel;
        ideo.chromosomesArray.push(chromosomeModel);

        ideo.drawChromosome(chromosomeModel, chrIndex);
        
      }


      if (ideo.config.showBandLabels === true) {
          ideo.drawBandLabels(ideo.chromosomes);
      }

    }

    chrIndex = 0;
    for (j = 0; j < taxids.length; j++) {
      taxid = taxids[j];
      chrs = ideo.config.chromosomes[taxid];
      for (k = 0; k < chrs.length; k++) {

        chrIndex += 1;
        
        chromosome = chrs[k];

        chrModel = ideo.chromosomes[taxid][chromosome];

        chr = d3.select("#chr" + chromosome + "-" + taxid);

        ideo.initTransformChromosome(chr, chrIndex);
        
      }

    }

    // Waits for potentially large annotation dataset 
    // to be received by the client, then triggers annotation processing
    if (ideo.config.annotationsPath) {

      function pa() {
        if (typeof timeout !== "undefined") {
          window.clearTimeout(timeout);
        }
        ideo.annots = ideo.processAnnotData(ideo.rawAnnots);
        ideo.drawAnnots(ideo.annots);
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
          )
        })();
      }
    }
    
    if (ideo.config.showBandLabels === true) {
      var bandsToShow = ideo.bandsToShow.join(",")

      // d3.selectAll resolves to querySelectorAll (QSA).
      // QSA takes a surprisingly long time to complete,
      // and scales with the number of selectors.
      // Most bands are hidden, so we can optimize by
      // Hiding all bands, then QSA'ing and displaying the 
      // relatively few bands that are shown.  
      var t0_c = new Date().getTime();
      d3.selectAll(".bandLabel, .bandLabelStalk").style("display", "none");
      d3.selectAll(bandsToShow).style("display", "")
      var t1_c = new Date().getTime();
      console.log("Time in showing bands: " + (t1_c - t0_c) + " ms")

      if (ideo.config.orientation === "vertical") {
        for (var i = 0; i < ideo.chromosomesArray.length; i++) {
          ideo.rotateChromosomeLabels(d3.select("#" + ideo.chromosomesArray[i].id), i);
        }
      }

    }
    
    if (ideo.config.showChromosomeLabels === true) {
      ideo.drawChromosomeLabels(ideo.chromosomes);
    }

    var t1_a = new Date().getTime();
    console.log("Time in drawChromosome: " + (t1_a - t0_a) + " ms")

    var t1 = new Date().getTime();
    console.log("Time constructing ideogram: " + (t1 - t0) + " ms")

    if (ideo.onLoadCallback) {
      ideo.onLoadCallback();
    }

  };

}