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

    return [rearrangedAnnots, totalAnnots];

  }


  var rawAnnotsByChr, rearrangedAnnots, ra,
      ideogram,
      annot, annots, i,
      svg, id, ids, tmp,
      chrRects, rect, chrs, chr, chrID, tmp, totalAnnots,
      images = [];


  ideogram = new Ideogram(config);
  ideogram.annots = ideogram.processAnnotData(config.rawAnnots.annots);

  var t0 = new Date().getTime();
  tmp = rearrangeAnnots(ideogram.annots);
  rearrangedAnnots = tmp[0];
  totalAnnots = tmp[1];
  var t1 = new Date().getTime();
  // Typically takes < 300 ms for ~20000 annots
  //console.log("  (Time to rearrange annots: " + (t1-t0) + " ms)");

  d3.selectAll("*[style*='display: none']").remove();

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

  images = [chrRects, images, totalAnnots]

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

  var totalTime0 = new Date().getTime();

  console.log("")

  var totalTime1, totalTime,
      min, sec, msec, totalTimeFriendly,
      t0, t1, time,
      t0a, t1a, timeA = 0,
      t1b, t1b, timeB = 0,
      t1c, t1c, timeC = 0,
      ideoConfig, rawAnnots;

  ideoConfig = JSON.parse(request.post);

  rawAnnots = JSON.parse(fs.read(ideoConfig.localAnnotationsPath));
  ideoConfig["rawAnnots"] = rawAnnots;

  page.open(url, function (status) {

    var tmp, chrRects, images, totalAnnots,
        chrRect, chr, image, id, png,

    t0 = new Date().getTime();
    tmp = page.evaluate(ideogramDrawer, ideoConfig);
    chrRects = tmp[0];
    images = tmp[1];
    totalAnnots = tmp[2];
    t1 = new Date().getTime();
    time = t1 - t0;

    t0 = new Date().getTime();

    chrRect = {};

    for (var i = 0; i < images.length; i++) {

      image = images[i];

      t0a = new Date().getTime();
      page.evaluate(svgDrawer, image[1]);
      t1a = new Date().getTime();
      timeA += t1a - t0a;

      async.forEachOf(image[0], function (id, index) {

          t0b = new Date().getTime();
          chr = image[2][index];
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

    console.log("Time to get SVG: " + time + " ms");
    console.log("Time to write SVG to DOM: " + timeA + " ms");
    console.log("Time to clip page: " + timeB + " ms");
    console.log("Time to render and write PNG to disk: " + timeC + " ms");

    console.log("");
    console.log("Total images: " + totalAnnots);

    response.statusCode = 200;
    response.write("Done");

    totalTime1 = new Date().getTime();
    totalTime = totalTime1 - totalTime0;
    //min = Math.floor(totalTime/(60000)); // 60000 milliseconds = 1 minute
    //sec = Math.floor(10-(600000-totalTime)/1000);
    //msec =
    //totalTimeFriendly = min + "m" + sec + "." + ms // Like Unix 'time' command

    // Will need to adjust when # annots != # ideograms
    ideoPerMs = (totalAnnots/totalTime).toFixed(5);
    msPerIdeo = Math.round(totalTime/totalAnnots);

    console.log("Time to produce all images: " + totalTime + " ms");
    console.log(
      "Performance: " +
      ideoPerMs + " ideogram/ms " +
      "(" + msPerIdeo + " ms/ideogram)"
    );
    console.log("---");

    response.close();

  });
});

if (service) {
  console.log('Web server running on port ' + port);
} else {
  console.log('Error: Could not create web server listening on port ' + port);
  phantom.exit();
}
