(function() {

var chromosome = "1";

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

  //console.log(lines)
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
    bands[i]["pxWidth"] = 1000*(band.stop - band.start)/chr.length;
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
      .attr("x", function(d) { return d.pxLeft; })
      .attr("y", function(d) { return "30"; })
      .text(function(d) { return d.name; })

  var overlappingLabelXRight = 0;

  $.each($("text"), function(index, element) {
    
    var text = $(this),
        prevText = text.prev();

    xLeft = text.offset().left;
    prevLabelXRight = prevText.offset().left + prevText.width();

    if (
      index == 0 || 
      xLeft < overlappingLabelXRight + 5 || 
      xLeft < prevLabelXRight + 5
    ) {

      if (index != 0) {
        text.hide();
      }

      overlappingLabelXRight = prevText.offset().left + prevText.width();

    }

  });
  
  var t1 = new Date().getTime();
  console.log("Time in drawBandLabels: " + (t1 - t0));

}


function drawChromosome(model) {
  // Create SVG container
  var svg = d3.select("body").append("svg")
    .attr("id", model.id)
    .attr("width", "100%")
    .attr("height", 120)
    .style("fill", "#D0D0D0")
    .attr("style", "padding-top: 10px");

  svg.selectAll("path")   
    .data(model.bands)    
    .enter()
    .append("path")       
      .attr("id", function(d) { return d.name })
      .attr("class", function(d) { 
        if (d.stain == "acen") {
          return d.stain;
        } else {
          //return "band";
        }
      })
      .attr("px-width", function(d) { return d.pxWidth })
      .attr("px-left", function(d) { return d.pxLeft })
      .attr("d", function(d, i) {
        var x = d.pxWidth;

        if (d.stain == "acen") {
          x -= 4;
          if (d.name[0] == "p") {
            d = "M " + (d.pxLeft) + " 0 l " + x + " 0 q 8 7.5 0 16 l -" + x + ' 0 z'
          } else {
            d = "M " + (d.pxLeft + x + 4) + " 0 l -" + x + " 0 q -9 7.5 0 16 l " + x + ' 0 z'
          }

        } else {

          d = "M " + d.pxLeft + " 0 l " + x + ' 0 l 0 16 l -' + x + ' 0 z';
        }

        return d;
      })
      .attr("fill", function(d){ return d.color })

  
  drawBandLabels(svg, model)
  
  
  svg.append('path')
    .attr("d", "M " + model.pxWidth + " 0 Q " + (model.pxWidth + 8) + " 7.5 "  + (model.pxWidth) + " 16")
    .style("fill", "#FFFFFF")
    .attr("style", "stroke: #000; stroke-width:0.5; fill: #FFFFFF");

  svg.append('path')
    .attr("d", "M 8 0 Q 0 7.5 8 16")
    .attr("style", "stroke: #000; stroke-width:0.5; fill: #FFFFFF");

  var pArmWidth = parseInt($(".acen:eq(0)").attr("px-left"), 10);
  var qArmStart = parseInt($(".acen:eq(1)").next().attr("px-left"), 10);
  var qArmWidth = model.pxWidth - qArmStart;

  svg.append('line')
    .attr('x1', "8")
    .attr('y1', "0")
    .attr('x2', pArmWidth)
    .attr("y2", "0")
    .attr("style", "stroke:#000;stroke-width:0.5");

  svg.append('line')
    .attr('x1', "8")
    .attr('y1', "16")
    .attr('x2', pArmWidth)
    .attr("y2", "16")
    .attr("style", "stroke:#000; stroke-width:0.5");

  svg.append('line')
    .attr('x1', qArmStart)
    .attr('y1', "0")
    .attr('x2', qArmStart + qArmWidth)
    .attr("y2", "0")
    .attr("style", "stroke:#000;stroke-width:0.5");

  svg.append('line')
    .attr('x1', qArmStart)
    .attr('y1', "16")
    .attr('x2', qArmStart + qArmWidth)
    .attr("y2", "16")
    .attr("style", "stroke:#000; stroke-width:0.5");

  $(".acen").attr("stroke", "#000").attr("stroke-width", "0.5");

}


$.ajax({
  //url: 'data/chr1_bands.tsv',
  url: 'data/ideogram_9606_GCF_000001305.14_550_V1',
  success: function(response) {
    var bands = getBands(response, chromosome);
    var chromosomeModel = getChromosomeModel(bands, chromosome);
    drawChromosome(chromosomeModel);
  }
});

})();
