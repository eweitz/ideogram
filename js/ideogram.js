// Developed by Eric Weitz (https://github.com/eweitz)

var Ideogram = function(config) {

  this.config = config;

  if ("chrHeight" in config === false) {
    config.chrHeight = 500;
  } 

  this.bump = Math.round(config.chrHeight / 125);

  if (config.showBandLabels) {
    this.config.chrMargin += 20;
  }

  if (config.onLoad) {
    this.onLoadCallback = config.onLoad;
  }

  this.coordinateSystem = "iscn";

  this.maxLength = {
    "bp": 0,
    "iscn": 0
  }

  this.bandsToHide = [];

  this.chromosomes = {};
  this.bandData = {};

  this.init();

}

Ideogram.prototype.getBands = function(content, chromosomeName, taxid) {
  // Gets chromosome band data from a TSV file

  var tsvLines = content.split(/\r\n|\n/);
  var lines = [];
  var columns, line, stain;
  // UCSC: #chrom chromStart  chromEnd  name  gieStain
  // http://genome.ucsc.edu/cgi-bin/hgTables
  //  - group: Mapping and Sequencing
  //  - track: Chromosome Band (Ideogram)
  //
  // NCBI: #chromosome  arm band  iscn_start  iscn_stop bp_start  bp_stop stain density
  // ftp://ftp.ncbi.nlm.nih.gov/pub/gdp/ideogram_9606_GCF_000001305.14_550_V1

  var tsvLinesLength = tsvLines.length - 1;

  for (var i = 1; i < tsvLinesLength; i++) {

    columns = tsvLines[i].split("\t");

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
      "name": columns[1] + columns[2],
      "stain": stain,
      "taxid": taxid
    };

    lines.push(line);

  }

  return lines;

};


Ideogram.prototype.getChromosomeModel = function(bands, chromosomeName, taxid) {

  var chr = {};
  var band, scale, 
      width, offset,
      startType, stopType,
      chrHeight = this.config.chrHeight,
      maxLength = this.maxLength,
      chrLength,
      cs;

  cs = this.coordinateSystem;

  chr["name"] = chromosomeName;
  chr["id"] = "chr" + chromosomeName + "-" + taxid;

  chr["length"] = bands[bands.length - 1][cs].stop;
  chrLength = chr["length"]

  offset = 0;

  for (var i = 0; i < bands.length; i++) {
    band = bands[i];

    width = chrHeight * chr["length"]/maxLength[cs] * (band[cs].stop - band[cs].start)/chrLength;

    bands[i]["width"] = width;
    bands[i]["offset"] = offset;

    offset += bands[i]["width"];

  }

  chr["width"] = offset;

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

Ideogram.prototype.drawChromosomeLabels = function(chromosomes) {

  var i, chr, chrs, taxid;

  chrs = [];

  for (taxid in chromosomes) {
    for (chr in chromosomes[taxid]) {
      chrs.push(chromosomes[taxid][chr]);
    }
  }
  
  d3.selectAll(".chromosome")
    .append("text")
     .data(chrs)
     .attr("class", "chrLabel")
      .text(function(d, i) { return d.name; })
  
}

Ideogram.prototype.drawBandLabels = function(chr, model, chrIndex) {
  // Draws labels for cytogenetic band , e.g. "p31.2"
  //
  // Performance note:
  // This function takes up the majority of the time in drawChromosomes,
  // which is about 90 ms out of about 130 ms in drawChromosomes on Chrome 41
  // for the the full human ideogram of 23 band-labeled chromosomes.
  // drawChromosomes balloons to ~220 ms on FF 36 and ~340 ms on IE 11.
  // Mobile performance is currently unknown.

  //var t0 = new Date().getTime();
  
  var chrMargin = (this.config.chrMargin + this.config.chrWidth) * chrIndex,
      lineY1, lineY2,
      that = this;

  lineY1 = chrMargin;
  lineY2 = chrMargin - 8;

  if (
    chrIndex == 1 &&
    "perspective" in this.config && this.config.perspective == "comparative"
  ) {
    lineY1 += 18;
    lineY2 += 18;
  } 

  var textOffsets = [];

  chr.selectAll("text")
    .data(model.bands)
    .enter()
    .append("text")
      .attr("class", function(d, i) { return "bandLabel bsbsl-" + i  })
      .attr("x", function(d) { 
        var textOffset = -8 + d.offset + d.width/2;
        textOffsets.push(textOffset + 13);
        return textOffset;
      })
    .attr("y", chrMargin - 10)
    .text(function(d) { return d.name; })

  chr.selectAll("line")
    .data(model.bands)
    .enter()
    .append("line")
      .attr("class", function(d, i) { return "bandLabelStalk bsbsl-" + i  })
      .attr("x1", function(d) { return d.offset + d.width/2; })
      .attr("y1", lineY1)
      .attr("x2", function(d) { return d.offset + d.width/2; })
      .attr("y2", lineY2)

  var texts = $("#" + model.id + " text"),
      textsLength = texts.length,
      overlappingLabelXRight,
      index,
      indexesToHide = [],
      prevHiddenBoxIndex,
      prevTextBox,
      xLeft,
      textPadding;

  overlappingLabelXRight = 0;

  textPadding = 5;

  for (index = 1; index < textsLength; index++) {
    // Ensures band labels don't overlap

    xLeft = textOffsets[index];

    if (xLeft < overlappingLabelXRight + textPadding) {
      indexesToHide.push(index);
      prevHiddenBoxIndex = index;
      overlappingLabelXRight = prevLabelXRight;
      continue;
    }

    if (prevHiddenBoxIndex !== index - 1) {
      prevTextBox = texts[index - 1].getBoundingClientRect();
      prevLabelXRight = prevTextBox.left + prevTextBox.width;
    } 

    if (
      xLeft < prevLabelXRight + textPadding
    ) {
      indexesToHide.push(index);
      prevHiddenBoxIndex = index;
      overlappingLabelXRight = prevLabelXRight;
    }

  }

  var selectorsToHide = [],
      chr = model.id,
      ithLength = indexesToHide.length,
      i;

  for (i = 0; i < ithLength; i++) {
    index = indexesToHide[i];
    selectorsToHide.push("#" + chr + " .bsbsl-" + index);
  }
  
  $.merge(this.bandsToHide, selectorsToHide);

  //var t1 = new Date().getTime();
  //console.log("Time in drawBandLabels: " + (t1 - t0) + " ms");

}


Ideogram.prototype.rotateBandLabels = function(chr, chrIndex) {

  var chrMargin, chrWidth;

  chrWidth = this.config.chrWidth;
  chrMargin = (this.config.chrMargin + chrWidth) * chrIndex;
  
  if (
    chrIndex == 1 &&
    "perspective" in this.config && this.config.perspective == "comparative"
  ) {
    chr.selectAll("text.bandLabel")
      .attr("transform", "rotate(-90)")
      .attr("x", (8 - chrMargin) - 26)
      .attr("y", function(d) { return 2 + d.offset + d.width/2; })
      .attr("text-anchor", "end");
  } else {
    chr.selectAll("text.bandLabel")
      .attr("transform", "rotate(-90)")
      .attr("x", 8 - chrMargin)
      .attr("y", function(d) { return 2 + d.offset + d.width/2; });
  }

}


Ideogram.prototype.drawChromosome = function(chrModel, chrIndex) {
  // Create SVG container

  var chr, chrWidth, width,
      pArmWidth, selector, qArmStart, qArmWidth,
      pTerPad,
      bump = this.bump; 

  // p-terminal band padding
  if (chrModel.centromerePosition != "telocentric") {
    pTerPad = this.bump;
  } else {
    pTerPad = Math.round(this.bump/4);
  }

  chr = d3.select("svg")
    .append("g")
      .attr("id", chrModel.id)
      .attr("class", "chromosome");

  chrWidth = this.config.chrWidth;
  width = chrModel.width;

  var chrMargin = (this.config.chrMargin + chrWidth) * chrIndex;

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
        var x = d.width,
            left = d.offset;

        if (d.stain == "acen") {
          x -= bump/2;
          if (d.name[0] == "p") {
            d = 
              "M " + (left) + " " + chrMargin + " " + 
              "l " + x + " 0 " + 
              "q " + bump + " " + chrWidth/2 + " 0 " + chrWidth + " " + 
              "l -" + x + " 0 z";
          } else {
            d = 
              "M " + (left + x + bump/2) + " " + chrMargin + " " + 
              "l -" + x + " 0 " + 
              "q -" + (bump + 0.5) + " " + chrWidth/2 + " 0 " + chrWidth + " " + 
              "l " + x + " 0 z";
          }
        } else {  

          if (i == 0) {
            left += pTerPad;

            // TODO: this is a minor kludge to preserve visible
            // centromeres in mouse, when viewing mouse and
            // human chromosomes for e.g. orthology analysis
            if (ideogram.config.multiorganism === true) {
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

  if (this.config.showBandLabels === true) {
      this.drawBandLabels(chr, chrModel, chrIndex);
  }
  
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

  var pcen = $("#" + chrModel.id + " .p-cen"),
      qcen = $("#" + chrModel.id + " .q-cen");

  // Why does human chromosome 11 lack a centromeric p-arm band?
  if (pcen.length > 0) {
    pArmWidth = pcen[0].getBBox().x;
  } else {
    if (qcen.length > 0) {
      pArmWidth = qcen.prev()[0].getBBox().x;
    } else {
      // For telocentric centromeres, as in many mouse chromosomes
      pArmWidth = 5;
    }
  }
  
  if (qcen.length > 0) {
    qArmStart = qcen.next()[0].getBBox().x;
  } else {
    // TODO: Generalize
    // For mouse only; presumably other organisms with telocentric centromeres
    // don't have their first q-arm band named 'qA1'.
    qArmStart = $("#" + chrModel.id + " .band")[0].getBBox().x;
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


  if (this.config.orientation == "vertical") {

    var chrMargin, chrWidth, tPadding;

    chrWidth = this.config.chrWidth;
    chrMargin = (this.config.chrMargin + chrWidth) * chrIndex;

    tPadding = chrMargin + (chrWidth-4)*(chrIndex-1);

    chr
      .attr("data-orientation", "vertical")
      .attr("transform", "rotate(90, " + (tPadding - 30) + ", " + (tPadding) + ")")

    this.rotateBandLabels(chr, chrIndex);

  } else {
    chr.attr("data-orientation", "horizontal")
  }

}


Ideogram.prototype.rotateAndToggleDisplay = function(chromosomeID) {
  // Rotates a chromosome 90 degrees and shows or hides all other chromosomes
  // Useful for focusing or defocusing a particular chromosome
  // TODO: Scale chromosome to better fill available SVG height and width

  var id, chr, chrIndex, chrMargin, tPadding,
      that = this;

  id = chromosomeID;
  
  chr = d3.select("#" + id);
  jqChr = $("#" + id);
  
  jqOtherChrs = $("g[id!='" + id + "']");

  chrIndex = jqChr.index() + 1;
  chrMargin = (this.config.chrMargin + this.config.chrWidth) * chrIndex;

  if (this.config.orientation == "vertical") {

    cx = chrMargin + (this.config.chrWidth-4)*(chrIndex-1) - 30;
    cy = cx + 30;
    verticalTransform = "rotate(90, " + cx + ", " + cy + ")";
    horizontalTransform = "rotate(0)translate(0, -" + (chrMargin - this.config.chrMargin) + ")";

  } else {

    var bandPad = 0;
    if (!this.config.showBandLabels) {
      bandPad += 10;
    }

    cx = 6 + chrMargin + (this.config.chrWidth - this.config.chrMargin - bandPad)*(chrIndex);
    cy = cx;
    verticalTransform = "rotate(90, " + cx + ", " + cy + ")";
    horizontalTransform = "";
    
  }

  if (jqChr.attr("data-orientation") != "vertical") {

    if (this.config.orientation == "horizontal") {
      jqOtherChrs.hide();
    }

    chr
      .attr("data-orientation", "vertical")
      .transition()
      .attr("transform", verticalTransform)
      .each("end", function() {
        
        that.rotateBandLabels(chr, chrIndex) 

        if (that.config.orientation == "vertical") {
          jqOtherChrs.show();
        }

      });

  } else {

    jqChr.attr("data-orientation", "");

    if (this.config.orientation == "vertical") {
      jqOtherChrs.hide();
    } 

    chr
      .transition()
      .attr("transform", horizontalTransform)
      .each("end", function() {
        
        chr.selectAll("text")
          .attr("transform", "")
          .attr("x", function(d) { return -8 + d.offset + d.width/2; })
          .attr("y", chrMargin - 10)

        if (that.config.orientation == "horizontal") {
          jqOtherChrs.show();
        }
      
      });    

  }
}


Ideogram.prototype.convertBpToOffset = function(chr, bp) {

  var i, band, bpToIscnScale, iscn, offset;

  for (i = 0; i < chr.bands.length; i++) {
    band = chr.bands[i];
    if (bp >= band.bp.start && bp <= band.bp.stop) {
 
      bpToIscnScale = (band.iscn.stop - band.iscn.start)/(band.bp.stop - band.bp.start);
      iscn = band.iscn.start + (bp - band.bp.start) * bpToIscnScale;

      offset = 30 + band.offset + (band.width * (iscn - band.iscn.start)/(band.iscn.stop - band.iscn.start))
 
      return offset;
    }
  }

}


Ideogram.prototype.drawSynteny = function(syntenicRegions) {
  // Draws a trapezoid connecting a genomic range on 
  // one chromosome to a genomic range on another chromosome;
  // a syntenic region

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

    r1.startPx = this.convertBpToOffset(r1.chr, r1.start);
    r1.stopPx = this.convertBpToOffset(r1.chr, r1.stop);
    r2.startPx = this.convertBpToOffset(r2.chr, r2.start);
    r2.stopPx = this.convertBpToOffset(r2.chr, r2.stop);

    c1Box = $("#" + r1.chr.id + " path")[0].getBBox();
    c2Box = $("#" + r2.chr.id + " path")[0].getBBox();
    
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


Ideogram.prototype.onLoad = function() {
  // Called when Ideogram has finished initializing.
  // Accounts for certain ideogram properties not being set until 
  // asynchronous requests succeed, etc.

  call(this.onLoadCallback);

}


Ideogram.prototype.init = function() {

  var bandDataFile,
      isMultiOrganism = (this.config.multiorganism === true),
      taxid, taxids, i,
      chrs, numChromosomes;

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

   var svg = d3.select("body")
    .append("svg")
    .attr("id", "ideogram")
    .attr("width", "100%")
    .attr("height", numChromosomes * this.config.chrHeight + 20)

  var bandsArray = [],
      maxLength = 0,
      numBandDataResponses = 0;


  var that = this;

  for (i = 0; i < taxids.length; i++) {
    taxid = taxids[i];

    if (taxid == "9606") {
      bandDataFileName = "ncbi/ideogram_9606_GCF_000001305.14_550_V1";
    } else if (taxid == "10090") {
      bandDataFileName = "ncbi/ideogram_10090_GCF_000000055.19_NA_V2";
    }
  
    $.ajax({
      //url: 'data/chr1_bands.tsv',
      url: 'data/' + bandDataFileName,
      beforeSend: function(jqXHR) {
        // Ensures correct taxid is handled in 'success' callback
        // Using 'taxid' instead of jqXHR['taxid'] gives the last
        // taxid among the taxids, not the one for which data was 
        // requested
        jqXHR["taxid"] = taxid;
      },
      success: function(response, textStatus, jqXHR) {

        that.bandData[jqXHR["taxid"]] = response;
        numBandDataResponses += 1;

        if (numBandDataResponses == taxids.length) {
          processBandData();
        }

      }

    });

  }

  function processBandData() {

    var j, k, chromosome, bands, chromosomeModel,
        chrLength,
        bandData, 
        stopType,
        taxids = that.config.taxids;

    bandsArray = [];
    maxLength = 0;

    for (j = 0; j < taxids.length; j++) {
      
      taxid = taxids[j];
      bandData = that.bandData[taxid];

      chrs = that.config.chromosomes[taxid];

      for (k = 0; k < chrs.length; k++) {
        
        chromosome = chrs[k];
        bands = that.getBands(bandData, chromosome, taxid);
        bandsArray.push(bands);

        chrLength = {
          "iscn": bands[bands.length - 1].iscn.stop,
          "bp": bands[bands.length - 1].bp.stop
        }

        if (chrLength.iscn > that.maxLength.iscn) {
          that.maxLength.iscn = chrLength.iscn;
        }

        if (chrLength.bp > that.maxLength.bp) {
          that.maxLength.bp = chrLength.bp;
        }
      }
    }

    var chrIndex = 0;

    var t0_a = new Date().getTime();

    for (j = 0; j < taxids.length; j++) {
      
      taxid = taxids[j];
      chrs = that.config.chromosomes[taxid];

      that.chromosomes[taxid] = {}
      
      for (k = 0; k < chrs.length; k++) {

        bands = bandsArray[chrIndex];
        
        chrIndex += 1;
        
        chromosome = chrs[k];
        chromosomeModel = that.getChromosomeModel(bands, chromosome, taxid);
        
        that.chromosomes[taxid][chromosome] = chromosomeModel;

        that.drawChromosome(chromosomeModel, chrIndex);
        
      }
    }
    
    if (that.config.showBandLabels === true) {
      var bandsToHide = that.bandsToHide.join(", ");
      d3.selectAll(bandsToHide).style("display", "none");
    }
    
    that.drawChromosomeLabels(that.chromosomes);

    var t1_a = new Date().getTime();
    console.log("Time in drawChromosome: " + (t1_a - t0_a) + " ms")

    var t1 = new Date().getTime();
    console.log("Time constructing ideogram: " + (t1 - t0) + " ms")

    if (that.onLoadCallback) {
      that.onLoadCallback();
    }

  };

}
