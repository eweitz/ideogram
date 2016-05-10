// Server-side rendering module for Ideogram.js
// Invoked via PhantomJS

var page, svgDrawer,
    fs = require('fs'),
    async = require('async'),
    system = require('system');

var args = system.args,
    arg, parseArg,
    ideoConfig,
    dir;

phantom.onError = function(msg, trace) {

    var msgStack = ['PHANTOM ERROR: ' + msg];

    if (trace && trace.length) {
      msgStack.push('TRACE:');
      trace.forEach(function(t) {
        msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function +'")' : ''));
      });
    }

    console.error(msgStack.join('\n'));
    phantom.exit(1);
}

parseArg = function(arg) {
  var index = args.indexOf(arg);

  if (args.indexOf(arg) === -1) {
    console.error("Error, argument missing: " + arg);
    phantom.exit(1);
  } else {
    return args[index + 1];
  }
}


if (/batch-render.js/.test(args[0])) {
  // Encountered when calling from Node's child_proces spawn
  dir = args[0].split('/').slice(0, -2).join('/');
  args = args.slice(1);
}

if (args.length === 1) {
  console.error("Error: this program requires arguments to run");
  phantom.exit(1);
} else {

  ideoConfig = {
    "taxid": parseInt(parseArg("--taxid")),
    "chromosomes": parseArg("--chromosomes").split(","),
    "chrWidth": parseInt(parseArg("--chr-width")),
    "chrHeight": parseInt(parseArg("--chr-height")),
    "chrMargin": parseInt(parseArg("--chr-margin")),
    "showBandLabels": JSON.parse(parseArg("--show-band-labels")),
    "showChromosomeLabels": JSON.parse(parseArg("--show-chromosome-labels")),
    "orientation": parseArg("--orientation"),
    "localAnnotationsPath": parseArg("--local-annotations-path"),
    "container": "#ideo-container"
  };

}

page = require('webpage').create();
page.viewportSize = {width: 540, height: 70};

page.onConsoleMessage = function (msg){
    console.log(msg);
};

function getIndexHtml() {

  var html, css, d3, js, bands, path;

  css = dir + '/src/css/ideogram.css';
  d3 = dir + '/src/js/d3.min.js';
  js = dir + '/src/js/ideogram.js';
  bands = dir + '/data/bands/native/ideogram_9606_GCF_000001305.14_850_V1.js';

  html =
  '<!DOCTYPE html>' +
  '<html>' +
  '<head>' +
    '<meta charset="UTF-8" />' +
    '<link type="text/css" rel="stylesheet" href="' + css + '"/>' +
    '<script type="text/javascript" src="' + d3 + '"></script>' +
    '<script type="text/javascript" src="' + js + '"></script>' +
    '<script type="text/javascript" src="' + bands + '"></script>' +
  '</head>' +
  '<body>' +
    '<div id="ideo-container"></div>' +
  '</body>' +
  '</html>';

  return html;
}


ideogramDrawer = function(config) {

  function rearrangeAnnots(annots) {
    // Rearranges annots into an array where each chromosome in the
    // ideogram gets 1 annotation.
    //
    // The idea here is to enable the rendering pipeline to generate one
    // annotation per chromosome.  This way, often only 1 DOM write needs
    // to happen for up to 24 different images, e.g. if we're running a batch
    // job to generate one image for the location of each human gene.
    //
    // In practice, as we progress through the annotations, we end up with fewer
    // and fewer chromosomes per DOM write, because some chromosomes have more
    // annotations than others.  For example, chr1 has far more genes than
    // chrY, so we end up omitting chrY in inner "ras" (arrays) in the
    // implementation.
    //
    // That means this optimization will be less beneficial for annotations
    // that are less evenly distributed among chromosomes.  This certainly
    // affects human genes and variations, and probably all other kinds of
    // annotation sets.
    //
    // Thus, while better than a completely naive implementation (1 DOM write
    // per annotation) for whole-genome annotation sets, this algorithm is not
    // ideal.  For single-chromosome annotations sets, this optimization will
    // be no better than a naive implementation; actually being (generally
    // negligibly, < 300 ms) worse.
    //
    // TODO:
    //   - Consider updating ideogram.js to support rendering multiple
    //     instances of the same chromosome, e.g. 200+ instances of chr1.  That
    //     should address the shortcomings described above.  As of 2015-11-11,
    //     ideogram.js mangles the display when passed multiple instances of
    //     the same chromosome.
    //
    // N.B.:
    // Regarding the priority of further optimization in this algorithm, note
    // that the current implementation, though not ideal, has made it so that
    // the "Get SVG" and "Write SVG DOM" steps of the all-human-genes job
    // (which this algorithm targets) combined now take about 140 seconds out
    // of roughly 600 seconds for the entire job.  See
    // https://github.com/eweitz/ideogram/pull/23 for timing details.  It would
    // probably be better to focus on optimizing the "Render and write PNG to
    // disk" step, which takes about 480 seconds.

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

          ras = []; // inner array of rearranged annots
          ids = []; // e.g. gene names or IDs, rs# from dbSNP
          rasChrs = []; // chromosomes that have annots in this list
          for (k = 0; k < annots.length; k++) {
            if (j < annots[k]["annots"].length ) {
              ra = annots[k]["annots"][j];
              if (ra["name"] in seenAnnots === false) {
                seenAnnots[ra["name"]] = 1;
                ids.push(ra["name"]);
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
  ideogram.annots = ideogram.processAnnotData(config.rawAnnots);

  var t0 = new Date().getTime();
  rearrangedAnnots = rearrangeAnnots(ideogram.annots);
  var t1 = new Date().getTime();
  // Typically takes < 300 ms for ~20000 annots
  //console.log("  (Time to rearrange annots: " + (t1-t0) + " ms)");

  // Remove hidden elements.  Makes large batches ~30% faster (PR #23).
  d3.selectAll("*[style*='display: none']").remove();

  // Remove JS hooks not used for static styling.
  // Shrinks SVG ~16%; same PNG perf.
  d3.selectAll(".band").attr("id", null).classed("band", null);

  // Generates DOM for annotations, e.g. gene locations
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

var totalTime0 = new Date().getTime();

console.log("")

var totalTime1, totalTime,
    date, day, hour, min, sec, msec, totalTimeFriendly,
    t0, t1, time,
    t0a, t1a, timeA = 0,
    t1b, t1b, timeB = 0,
    t1c, t1c, timeC = 0,
    rawAnnots, indexHtml;

rawAnnots = JSON.parse(fs.read(ideoConfig.localAnnotationsPath));

ideoConfig["rawAnnots"] = rawAnnots;

indexHtml = '/tmp/ideogram/' + parseInt(Math.random()*1000000) + '/index.html';
fs.write(indexHtml, getIndexHtml());

page.open(indexHtml, function (status) {

  var tmp, chrRects, images, totalImages,
      chrRect, chr, image, id, png;

  t0 = new Date().getTime();
  tmp = page.evaluate(ideogramDrawer, ideoConfig);
  chrRects = tmp[0];
  images = tmp[1];
  t1 = new Date().getTime();
  time = t1 - t0;

  t0 = new Date().getTime();

  chrRect = {};
  totalImages = 0;

  //fs.write("foo.svg", images[0][1]); // DEBUG

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

        totalImages += 1;
    });
  }

  console.log("Time to get SVG: " + time + " ms");
  console.log("Time to write SVG to DOM: " + timeA + " ms");
  console.log("Time to clip page: " + timeB + " ms");
  console.log("Time to render and write PNG to disk: " + timeC + " ms");

  console.log("");
  console.log("Total images: " + totalImages);

  totalTime1 = new Date().getTime();
  totalTime = totalTime1 - totalTime0;

  date = new Date(totalTime);
  day = date.getUTCDate() - 1;
  hour = date.getUTCHours();
  min = date.getUTCMinutes();
  sec = date.getUTCSeconds();
  ms = date.getUTCMilliseconds();
  // Like Unix 'time' command
  totalTimeFriendly = min + "m" + sec + "." + ms + "s"
  if (hour > 0) {
    totalTimeFriendly = hour + "h" + totalTimeFriendly;
  }
  if (day > 0) {
    totalTimeFriendly = day + "d" + totalTimeFriendly;
  }

  // Will need to adjust when # annots != # ideograms
  ideoPerMs = (totalImages/totalTime).toFixed(5);
  msPerIdeo = Math.round(totalTime/totalImages);

  console.log(
    "Time to produce all images: " + totalTime + " ms " +
    "(" + totalTimeFriendly + ")"
  );
  console.log(
    "Performance: " +
    ideoPerMs + " ideogram/ms " +
    "(" + msPerIdeo + " ms/ideogram)"
  );
  console.log("---");
  phantom.exit(0);
});
