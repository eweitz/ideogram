(function() {

var options = {
  //chromosomes: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "X", "Y"],
  chromosomes: ["1", "2", "3"],
  //chromosomes: ["1"],
  chrWidth: 15,
  chrHeight: 600,
  chrMargin: 25,
  showBandLabels: true,
  orientation: "vertical"
};

if (options.showBandLabels) {
  options.chrMargin += 20;
}

var stainColorMap = {
  "gneg": "#FFFFFF",
  "gpos25": "#BBBBBB",
  "gpos50": "#888888",
  "gpos75": "#444444",
  "gpos100": "#000000",
  "acen": "#FFDDDD",
  "gvar": "#DDDDFF"
};

function getBands(content, chromosomeName) {
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

  for (var i = 1; i < tsvLines.length - 1; i++) {

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
      "start": columns[5],
      "stop": columns[6],
      "name": columns[1] + columns[2],
      "stain": stain
    };

    lines.push(line);

  }

  return lines;
}

function getChromosomeModel(bands, chromosomeName) {

  var chr = {};
  var band;

  chr["id"] = "chr" + chromosomeName;
  chr["length"] = bands[bands.length - 1]["stop"];

  var pxLeft = 0;

  for (var i = 0; i < bands.length; i++) {
    band = bands[i];
    bands[i]["color"] = stainColorMap[band.stain];
    bands[i]["pxWidth"] = options.chrHeight * (band.stop - band.start)/chr.length;
    bands[i]["pxLeft"] = pxLeft;
    pxLeft += bands[i]["pxWidth"];
  }

  chr["pxWidth"] = pxLeft;
  chr["bands"] = bands;
  return chr;
}


function drawBandLabels(chr, model, chrIndex) {
  // Draws labels for cytogenetic band , e.g. "p31.2"

  var t0 = new Date().getTime();
  
  var chrMargin = options.chrMargin * chrIndex;

  chr.selectAll("text")
      .data(model.bands)
      .enter()
      .append("text")
        .attr("class", "bandLabel")
        .attr("x", function(d) { return -8 + d.pxLeft + d.pxWidth/2; })
        .attr("y", chrMargin - 10)
        .text(function(d) { return d.name; })
  
  chr.selectAll("line")
    .data(model.bands)
    .enter()
    .append("line")
      .attr("class", function(d) { return "bandLabelStalk " + d.name.replace(".", "-")  })
      .attr("x1", function(d) { return d.pxLeft + d.pxWidth/2; })
      .attr("y1", chrMargin)
      .attr("x2", function(d) { return d.pxLeft + d.pxWidth/2; })
      .attr("y2", chrMargin - 8)

  var overlappingLabelXRight = 0;

  $.each($("#" + model.id + " text:gt(0)"), function(index, element) {
    // Ensures band labels don't overlap

    var text = $(this),
        prevText = text.prev(),
        textPadding = 5;

    xLeft = text.offset().left;

    if (prevText.css("display") != "none") {
      prevLabelXRight = prevText.offset().left + prevText[0].getBBox().width;
    } 

    if (
      xLeft < overlappingLabelXRight + textPadding || 
      xLeft < prevLabelXRight + textPadding
    ) {

      text.hide();
      $("#" + model.id + " line.bandLabelStalk").eq(index + 1).hide();

      overlappingLabelXRight = prevLabelXRight;

    }

  });
  
  var t1 = new Date().getTime();
  console.log("Time in drawBandLabels: " + (t1 - t0) + " ms");

}


function drawChromosome(model, chrIndex) {
  // Create SVG container

  var chr, chrWidth, pxWidth;

  chr = d3.select("svg")
    .append("g")
      .attr("id", model.id);

  chrWidth = options.chrWidth;
  pxWidth = model.pxWidth;

  var chrMargin = options.chrMargin * chrIndex;

  chr.selectAll("path")   
    .data(model.bands)    
    .enter()
    .append("path")       
      .attr("id", function(d) { return d.name.replace(".", "-"); })
      .attr("class", function(d) { 
        if (d.stain == "acen") {
          return d.stain;
        } 
      })
      .attr("d", function(d, i) {
        var x = d.pxWidth;

        if (d.stain == "acen") {
          x -= 4;
          if (d.name[0] == "p") {
            d = 
              "M " + (d.pxLeft) + " " + chrMargin + " " + 
              "l " + x + " 0 " + 
              "q 8 " + chrWidth/2 + " 0 " + chrWidth + " " + 
              "l -" + x + " 0 z";
          } else {
            d = 
              "M " + (d.pxLeft + x + 4) + " " + chrMargin + " " + 
              "l -" + x + " 0 " + 
              "q -8.5 " + chrWidth/2 + " 0 " + chrWidth + " " + 
              "l " + x + " 0 z";
          }
        } else {  
          d = 
            "M " + d.pxLeft + " " + chrMargin + " " + 
            "l " + x + " 0 " + 
            "l 0 " + chrWidth + " " + 
            "l -" + x + " 0 z";
        }

        return d;
      })
      .attr("fill", function(d){ return d.color })

  if (options.showBandLabels === true) {
    drawBandLabels(chr, model, chrIndex);
  }
    
  chr.append('path')
    .attr("class", "chromosomeBorder")
    .attr("d", "M " + pxWidth + " " + chrMargin + " q 8 " +  chrWidth/2 + " 0 " + chrWidth)

  chr.append('path')
    .attr("class", "chromosomeBorder")
    .attr("d", "M 8 " + chrMargin + " q -8 " + (chrWidth/2) + " 0 " + chrWidth)

  var pArmWidth = $("#" + model.id + " .acen:eq(0)")[0].getBBox().x;
  var qArmStart = $("#" + model.id + " .acen:eq(1)").next()[0].getBBox().x;
  var qArmWidth = model.pxWidth - qArmStart;

  chr.append('line')
    .attr("class", "chromosomeBorder")
    .attr('x1', "8")
    .attr('y1', chrMargin)
    .attr('x2', pArmWidth)
    .attr("y2", chrMargin)

  chr.append('line')
    .attr("class", "chromosomeBorder")
    .attr('x1', "8")
    .attr('y1', chrWidth + chrMargin)
    .attr('x2', pArmWidth)
    .attr("y2", chrWidth + chrMargin)

  chr.append('line')
    .attr("class", "chromosomeBorder")
    .attr('x1', qArmStart)
    .attr('y1', chrMargin)
    .attr('x2', qArmStart + qArmWidth)
    .attr("y2", chrMargin)

  chr.append('line')
    .attr("class", "chromosomeBorder")
    .attr('x1', qArmStart)
    .attr('y1', chrWidth + chrMargin)
    .attr('x2', qArmStart + qArmWidth)
    .attr("y2", chrWidth + chrMargin)

  $(".acen").attr("stroke", "#000").attr("stroke-width", "0.5");

  if (options.orientation == "vertical") {
    var tPadding = chrMargin + 15*(chrIndex-1);
    chr.attr("transform", "rotate(90, " + tPadding + ", " + tPadding + ")")
  
    chr.selectAll("text.bandLabel")
      .attr("transform", "rotate(-90)")
      .attr("x", 8 - chrMargin)
      .attr("y", function(d) { return 2 + d.pxLeft + d.pxWidth/2; });
  }

}

$.ajax({
  //url: 'data/chr1_bands.tsv',
  url: 'data/ideogram_9606_GCF_000001305.14_550_V1',
  success: function(response) {
    var t0 = new Date().getTime();

    var chrs = options.chromosomes,
        i, chromosome, bands, chromosomeModel;

    var svg = d3.select("body")
      .append("svg")
        .attr("id", "ideogram")
        .attr("width", "100%")
        .attr("height", chrs.length * options.chrHeight + 20)

    for (i = 0; i < chrs.length; i++) {
      chromosome = chrs[i];
      bands = getBands(response, chromosome);
      chromosomeModel = getChromosomeModel(bands, chromosome);
      drawChromosome(chromosomeModel, i + 1);
    }

    var t1 = new Date().getTime();
    console.log("Time constructing ideogram: " + (t1 - t0) + " ms")
  }
});

})();
