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
    fs = require('fs');

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
          for (k = 0; k < annots.length; k++) {
            if (j < annots[k]["annots"].length ) {
              ra = annots[k]["annots"][j];
              if (ra["id"] in seenAnnots === false) {
                seenAnnots[ra["id"]] = 1;
                ids.push(ra["id"]);
                ras.push({"chr": annots[k]["chr"], "annots": [ra]});
                totalAnnots += 1;
              }
            }
          }
          chrs[annots[i]["chr"]] += 1;
          if (ids.length > 0) {
            rearrangedAnnots.push([ids, ras]);
          }
        }
      }

    }


    console.log("totalAnnots")
    console.log(totalAnnots)

    console.log("chrs")
    console.log(chrs)
    console.log("JSON.stringify(chrs)")
    console.log(JSON.stringify(chrs))

    return rearrangedAnnots;

  }


  var rawAnnotsByChr, rearrangedAnnots, ra,
      ideogram,
      annot, annots, i,
      svg, id, ids, tmp,
      images = [];


  ideogram = new Ideogram(config);
  ideogram.annots = ideogram.processAnnotData(config.rawAnnots.annots);

  //tmp = rearrangeAnnots(ideogram.annots);
  //ids = tmp[0];
  //rearrangedAnnots = tmp[1];
  rearrangedAnnots = rearrangeAnnots(ideogram.annots);

  console.log("rearrangedAnnots.length");
  console.log(rearrangedAnnots.length);
  console.log("rearrangedAnnots[0].length");
  console.log(rearrangedAnnots[0].length);
  console.log("JSON.stringify(rearrangedAnnots[0])");
  console.log(JSON.stringify(rearrangedAnnots[0]));
  console.log("JSON.stringify(rearrangedAnnots[1])");
  console.log(JSON.stringify(rearrangedAnnots[1]));

  for (i = 0; i < rearrangedAnnots.length; i++) {
    d3.selectAll(".annot").remove();
    //console.log("JSON.stringify(rearrangedAnnots[i][1])")
    //console.log(JSON.stringify(rearrangedAnnots[i][1]))
    //console.log(i)
    //console.log(rearrangedAnnots.length)
    ideogram.drawAnnots(rearrangedAnnots[i][1]);
    //console.log(d3.selectAll(".annot")[0].length);
    svg = d3.select(ideogram.config.container)[0][0].innerHTML;
    images.push([rearrangedAnnots[i][0], svg]);
  }

  /*
  for (i = 0; i < rawAnnotsByChr.length; i++) {
    ra = rawAnnotsByChr[i];
    config.rawAnnots = {"annots": [ra]};
    config.chromosomes = [ra["chr"]];

    ideogram = new Ideogram(config);
    ideogram.annots = ideogram.processAnnotData(config.rawAnnots.annots);

    for (j = 0; j < 1; j++) {
      annot = ideogram.annots[0]["annots"][j]
      id = annot["id"];
      annots = [{
        "chr": ideogram.annots[0]['chr'],
        "annots": ideogram.annots[0]['annots'].slice(j, j+1)
      }];
      d3.selectAll(".annot").remove();
      ideogram.drawAnnots(annots);
      svg += d3.select(ideogram.config.container)[0][0].innerHTML + "\n";
      images.push([id, svg]);
    }

    d3.select(ideogram.config.container).html("")
    delete ideogram;
  }
  */



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
      t1c, t1c, timeC = 0;

  var ideoConfig = JSON.parse(request.post);

  var rawAnnots = JSON.parse(fs.read(ideoConfig.localAnnotationsPath));
  ideoConfig["rawAnnots"] = rawAnnots;

  page.open(url, function (status) {

    t0 = new Date().getTime();
    var images = page.evaluate(ideogramDrawer, ideoConfig);

    //response.write(images);

    t1 = new Date().getTime();
    time = t1 - t0;
    console.log("Time to get images: " + time + " ms")

    t0 = new Date().getTime();
    var image, id, png;

    fs.write(images[images.length - 1][0] + '.svg', images[images.length - 1][1])

    page.evaluate(svgDrawer, images[images.length - 1][1]);
    png = atob(page.renderBase64('png'))
    fs.write(images[images.length - 1][0] + '.png', png, 'b');

    //response.write(images[images.length - 1][1]);

    //console.log(images)

    /*
    for (var i = 0; i < 1; i++) {
      image = images[i];
      id = image[0];
      svg = image[1] + "\n\n\n" + images[i + 1][1];
      console.log(svg)

      fs.write(id + ".svg", svg);

      t0a = new Date().getTime();
      page.evaluate(svgDrawer, svg);
      t1a = new Date().getTime();
      timeA += t1a - t0a;

      page.clipRect = {
        top: 40,
        left: 0,
        width: 550,
        height: 60 * 2
      };

      t0b = new Date().getTime();
      png = atob(page.renderBase64('png'))
      //fs.write(id + '.png', png, 'b');
      //png = page.render(id + '.png')
      t1b = new Date().getTime();
      timeB += t1b - t0b;

      t0c = new Date().getTime();
      fs.write(id + '.png', png, 'b');
      t1c = new Date().getTime();
      timeC += t1c - t0c;

    }
    */

    console.log("Time to evaluate SVG: " + timeA + " ms")
    //console.log("Time to render, write: " + timeB + " ms")
    console.log("Time to render: " + timeB + " ms")
    console.log("Time to write: " + timeC + " ms")

    t1 = new Date().getTime();
    time = t1 - t0;
    console.log("Time to produce all images: " + time + " ms")

    response.statusCode = 200;

    //response.write("Done");
    response.close();
  });
});

if (service) {
  console.log('Web server running on port ' + port);
} else {
  console.log('Error: Could not create web server listening on port ' + port);
  phantom.exit();
}
