// Server-side rendering example for Ideogram.js
//
// This module instantiates a Node.js server, and listens on port 9494 for
// incoming POST requests that contain an Ideogram configuration object. See
// ideo_config.json in this directory for an example POST body.  That
// configuration is then used to instantiate an ideogram, including SVG
// rendered to the DOM via PhantomJS (a headless browser that uses WebKit).
// The response is SVG that depicts a set of chromosomes.
//
// Tested on Ubuntu 14.04 with PhantomJS 1.9.7 and Node 0.12.7
//
// To run this example:
// 1. Open a terminal
// 2. cd ideogram/examples/server
// 3. phantomjs server.js
// 4. Open another another terminal
// 5. cd ideogram/examples/server
// 6. curl -X POST -d @ideo_config.json -H "Content-Type: application/json" localhost:9494

var port, server, service, page, url, svgDrawer,
    fs = require('fs'),
    async = require('async');

port = 9494;
server = require('webserver').create();

page = require('webpage').create();
page.viewportSize = {width: 540, height: 70};

url = 'file://' + fs.absolute('./human.html');

page.onConsoleMessage = function (msg){
    console.log(msg);
};


ideogramDrawer = function(config) {

  function rearrangeAnnots(annots) {
    // Rearranges annots into an array where each chromosome in the
    // ideogram gets 1 annotation.

    //annots = annots["annots"];

    var annot, chrs, chr, i, j, k, m,
        chrAnnots, totalAnnots,
        rearrangedAnnots = [], ras,
        ids;

    chrs = {};

    totalAnnots = 0;

    var seenAnnots = {}

    for (i = 0; i < annots.length; i++) {
      annotsByChr = annots[i];
      chr = annotsByChr["chr"];
      chrs[chr] = 0;
    }
    for (i = 0; i < annots.length; i++) {

      annotsByChr = annots[i];
      chr = annotsByChr["chr"];
      chrAnnots = annotsByChr["annots"];

      for (j = 0; j < chrAnnots.length; j++) {

        if (j <= chrs[chr]) {

          ras = [];
          ids = [];
          rasChrs = [];
          for (k = 0; k < annots.length; k++) {
            if (j < annots[k]["annots"].length ) {
              ra = annots[k]["annots"][j];
              if (ra["id"] in seenAnnots === false) {
                seenAnnots[ra["id"]] = 1;
                ids.push(ra["id"]);
                ras.push({"chr": annots[k]["chr"], "annots": [ra]});
                rasChrs.push(annots[k]["chr"])
                totalAnnots += 1;
              }
            }
          }
          chrs[annots[i]["chr"]] += 1;
          if (ids.length > 0) {
            rearrangedAnnots.push([ids, ras, rasChrs]);
          }
        }
      }

    }

    return rearrangedAnnots;

  }


  var rawAnnotsByChr, rearrangedAnnots, ra,
      ideogram,
      annot, annots, i,
      svg, id, ids, tmp,
      chrRects, rect, chrs, chr, chrID,
      images = [];


  ideogram = new Ideogram(config);
  ideogram.annots = ideogram.processAnnotData(config.rawAnnots.annots);

  var t0 = new Date().getTime();
  rearrangedAnnots = rearrangeAnnots(ideogram.annots);
  var t1 = new Date().getTime();
  console.log("Time to rearrange annots: " + (t1-t0) + " ms");

  for (i = 0; i < rearrangedAnnots.length; i++) {
  //for (i = 0; i < 2; i++) { // DEBUG
    d3.selectAll(".annot").remove();
    ra = rearrangedAnnots[i];
    ideogram.drawAnnots(ra[1]);
    svg = d3.select(ideogram.config.container)[0][0].innerHTML;
    images.push([ra[0], svg, ra[2]]);
  }

  chrRects = {};
  chrs = d3.selectAll(".chromosome")[0];
  for (i = 0; i < chrs.length; i++) {
    chr = chrs[i];
    chrID = chr["id"].split("-")[0].slice(3); // e.g. chr12-9606 -> 12
    rect = chr.getBoundingClientRect();
    chrRects[chrID] = {
      "top": rect.top,
      //"left": rect.left,
      "left": 5,
      "width": rect.width + 15,
      "height": rect.height + 7
    }
  }

  images = [chrRects, images]

  return images;
}


svgDrawer = function(svg) {
  //var oldDiv = document.getElementsByTagName("body")[0];
  //var newDiv = oldDiv.cloneNode(false);
  //newDiv.innerHTML = svg;
  //oldDiv.parentNode.replaceChild(newDiv, oldDiv);

  document.getElementsByTagName("body")[0].innerHTML = svg;

}

service = server.listen(port, function (request, response) {

  var t0, t1, time,
      t0a, t1a, timeA = 0,
      t1b, t1b, timeB = 0,
      t1c, t1c, timeC = 0,
      chr;

  var ideoConfig = JSON.parse(request.post);

  var rawAnnots = JSON.parse(fs.read(ideoConfig.localAnnotationsPath));
  ideoConfig["rawAnnots"] = rawAnnots;

  page.open(url, function (status) {

    t0 = new Date().getTime();
    var tmp = page.evaluate(ideogramDrawer, ideoConfig);
    var chrRects = tmp[0];
    var images = tmp[1];
    t1 = new Date().getTime();
    time = t1 - t0;
    console.log("Time to get images: " + time + " ms")

    t0 = new Date().getTime();
    var image, id, png;

    var chrRect = {};

    for (var i = 0; i < images.length; i++) {
      t0a = new Date().getTime();

      page.evaluate(svgDrawer, images[i][1]);

      t1a = new Date().getTime();
      timeA += t1a - t0a;

      async.forEachOf(images[i][0], function (id, index) {

          t0b = new Date().getTime();
          chr = images[i][2][index];
          chrRect = chrRects[chr];
          page.clipRect = chrRect;

          t1b = new Date().getTime();
          timeB += t1b - t0b;

          t0c = new Date().getTime();
          page.render("images/" + id + '.png');
          t1c = new Date().getTime();
          timeC += t1c - t0c;

      });

    }

    console.log("Time to evaluate SVG: " + timeA + " ms")
    //console.log("Time to render, write: " + timeB + " ms")
    console.log("Time to render: " + timeB + " ms")
    console.log("Time to write: " + timeC + " ms")

    t1 = new Date().getTime();
    time = t1 - t0;
    console.log("Time to produce all images: " + time + " ms")

    response.statusCode = 200;

    response.write("Done");
    response.close();

  });
});

if (service) {
  console.log('Web server running on port ' + port);
} else {
  console.log('Error: Could not create web server listening on port ' + port);
  phantom.exit();
}
