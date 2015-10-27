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
url = 'file://' + fs.absolute('./human.html');

page.onConsoleMessage = function (msg){
    console.log(msg);
};

ideogramDrawer = function(config) {

  var ideogram = new Ideogram(config),
      annot, annots, i,
      svg, id,
      images = [];

  ideogram.annots = ideogram.processAnnotData(config.rawAnnots.annots);

  someAnnots = [{
    "chr": ideogram.annots[0]['chr'],
    "annots": ideogram.annots[0]['annots'].slice(0, 100)
  }]

  for (i = 0; i < someAnnots[0]["annots"].length; i++) {
    annot = someAnnots[0]["annots"][i]
    id = annot["id"];
    annots = [{
      "chr": ideogram.annots[0]['chr'],
      "annots": ideogram.annots[0]['annots'].slice(i, i+1)
    }]
    d3.selectAll(".annot").remove();
    ideogram.drawAnnots(annots);
    svg = d3.select(ideogram.config.container)[0][0].innerHTML;
    images.push([id, svg]);
  }

  return images;
}

svgDrawer = function(svg) {
  document.getElementsByTagName("div")[0].innerHTML = svg;
}

service = server.listen(port, function (request, response) {

  var ideoConfig = JSON.parse(request.post);

  var rawAnnots = JSON.parse(fs.read(ideoConfig.localAnnotationsPath));
  ideoConfig["rawAnnots"] = rawAnnots;

  page.open(url, function (status) {

    var images = page.evaluate(ideogramDrawer, ideoConfig);

    var image, id, png;
    for (var i = 0; i < images.length; i++) {
      image = images[i];
      id = image[0];
      svg = image[1];
      page.evaluate(svgDrawer, svg);
      png = atob(page.renderBase64('png'))
      fs.write(id + '.png', png, 'b');
    }

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
