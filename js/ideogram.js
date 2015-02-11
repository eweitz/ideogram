(function() {

var options = {
  chromosome: "1",
  chrWidth: 15,
  chrHeight: 600,
  showBandLabels: true
};

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
  // UCSC: #chrom	chromStart	chromEnd	name	gieStain
  // http://genome.ucsc.edu/cgi-bin/hgTables
  //  - group: Mapping and Sequencing
  //  - track: Chromosome Band (Ideogram)
  //
  // NCBI: #chromosome	arm	band	iscn_start	iscn_stop	bp_start	bp_stop	stain	density
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


function drawBandLabels(svg, model) {
  // Draws labels for cytogenetic band , e.g. "p31.2"

  var t0 = new Date().getTime();
  
  svg.selectAll("text")
      .data(model.bands)
      .enter()
      .append("text")
        .attr("class", function(d) { return "bandLabel " + d.name.replace(".", "-")  })
        .attr("x", function(d) { return -8 + d.pxLeft + d.pxWidth/2; })
        .attr("y", "10")
        .text(function(d) { return d.name; })
  
  svg.selectAll("line")
    .data(model.bands)
    .enter()
    .append("line")
      .attr("class", function(d) { return "bandLabelStalk " + d.name.replace(".", "-")  })
      .attr("x1", function(d) { return d.pxLeft + d.pxWidth/2; })
      .attr("y1", "20")
      .attr("x2", function(d) { return d.pxLeft + d.pxWidth/2; })
      .attr("y2", "12")

  var overlappingLabelXRight = 0;

  $.each($("text:gt(0)"), function(index, element) {
    // Ensures band labels don't overlap

    var text = $(this),
        prevText = text.prev(),
        padding = 5;

    xLeft = text.offset().left;

    if (prevText.css("display") != "none") {
      prevLabelXRight = prevText.offset().left + prevText[0].getBBox().width;
    } 

    if (
      xLeft < overlappingLabelXRight + padding || 
      xLeft < prevLabelXRight + padding
    ) {

      text.hide();
      $("line").eq(index + 1).hide();

      overlappingLabelXRight = prevLabelXRight;

    }

  });
  
  var t1 = new Date().getTime();
  console.log("Time in drawBandLabels: " + (t1 - t0) + " ms");

}


function drawChromosome(model) {
  // Create SVG container
  svg = d3.select("body")
    .append("svg")
      .attr("id", "ideogram")
      .attr("width", "100%")
    .append("g")
      .attr("id", model.id)

  var chrWidth = options.chrWidth,
      pxWidth = model.pxWidth;

  svg.selectAll("path")   
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
              "M " + (d.pxLeft) + " 20 " + 
              "l " + x + " 0 " + 
              "q 8 " + chrWidth/2 + " 0 " + chrWidth + " " + 
              "l -" + x + " 0 z";
          } else {
            d = 
              "M " + (d.pxLeft + x + 4) + " 20 " + 
              "l -" + x + " 0 " + 
              "q -8.5 " + chrWidth/2 + " 0 " + chrWidth + " " + 
              "l " + x + " 0 z";
          }
        } else {  
          d = "M " + d.pxLeft + " 20 l " + x + " 0 l 0 " + chrWidth + " l -" + x + " 0 z";
        }

        return d;
      })
      .attr("fill", function(d){ return d.color })

  if (options.showBandLabels === true) {
    drawBandLabels(svg, model);
  }
    
  svg.append('path')
    .attr("class", "chromosomeBorder")
    .attr("d", "M " + pxWidth + " 20 q 8 " +  chrWidth/2 + " 0 " + chrWidth)

  svg.append('path')
    .attr("class", "chromosomeBorder")
    .attr("d", "M 8 20 q -8 " + (chrWidth/2) + " 0 " + chrWidth)

  var pArmWidth = $(".acen:eq(0)")[0].getBBox().x;
  var bBox = $(".acen:eq(1)")[0].getBBox();
  var qArmStart = bBox.x + bBox.width;
  var qArmWidth = model.pxWidth - qArmStart;

  svg.append('line')
    .attr("class", "chromosomeBorder")
    .attr('x1', "8")
    .attr('y1', "20")
    .attr('x2', pArmWidth)
    .attr("y2", "20")

  svg.append('line')
    .attr("class", "chromosomeBorder")
    .attr('x1', "8")
    .attr('y1', 20 + chrWidth)
    .attr('x2', pArmWidth)
    .attr("y2", 20 + chrWidth)

  svg.append('line')
    .attr("class", "chromosomeBorder")
    .attr('x1', qArmStart)
    .attr('y1', "20")
    .attr('x2', qArmStart + qArmWidth)
    .attr("y2", "20")

  svg.append('line')
    .attr("class", "chromosomeBorder")
    .attr('x1', qArmStart)
    .attr('y1', 20 + chrWidth)
    .attr('x2', qArmStart + qArmWidth)
    .attr("y2", 20 + chrWidth)

  $(".acen").attr("stroke", "#000").attr("stroke-width", "0.5");

}


$.ajax({
  //url: 'data/chr1_bands.tsv',
  url: 'data/ideogram_9606_GCF_000001305.14_550_V1',
  success: function(response) {
    var t0 = new Date().getTime();
    var chromosome = options.chromosome;
    var bands = getBands(response, chromosome);
    var chromosomeModel = getChromosomeModel(bands, chromosome);
    drawChromosome(chromosomeModel);
    var t1 = new Date().getTime();
    console.log("Time constructing ideogram: " + (t1 - t0) + " ms")
  }
});

})();
