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
// 6. curl -X POST -d @ideo_config.json -H "Content-Type: application/json" localhost:9494 > ideo.svg

var port, server, service, page, url, svgDrawer
    fs = require('fs');

port = 9494;
server = require('webserver').create();

page = require('webpage').create();
url = 'file://' + fs.absolute('./human.html');

svgDrawer = function(config) {
  var ideogram = new Ideogram(config);
  var svg = d3.select(ideogram.config.container)[0][0].innerHTML;
  return svg;
}

service = server.listen(port, function (request, response) {

  var ideoConfig = JSON.parse(request.post);

  page.open(url, function (status) {
    var svg = page.evaluate(svgDrawer, ideoConfig);
    response.statusCode = 200;
    response.write(svg);
    response.close();
  });
});

if (service) {
  console.log('Web server running on port ' + port);
} else {
  console.log('Error: Could not create web server listening on port ' + port);
  phantom.exit();
}
