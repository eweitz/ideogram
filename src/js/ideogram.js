// Developed by Eric Weitz (https://github.com/eweitz)

// https://github.com/stefanpenner/es6-promise
(function(){"use strict";function t(t){return"function"==typeof t||"object"==typeof t&&null!==t}function e(t){return"function"==typeof t}function n(t){G=t}function r(t){Q=t}function o(){return function(){process.nextTick(a)}}function i(){return function(){B(a)}}function s(){var t=0,e=new X(a),n=document.createTextNode("");return e.observe(n,{characterData:!0}),function(){n.data=t=++t%2}}function u(){var t=new MessageChannel;return t.port1.onmessage=a,function(){t.port2.postMessage(0)}}function c(){return function(){setTimeout(a,1)}}function a(){for(var t=0;J>t;t+=2){var e=tt[t],n=tt[t+1];e(n),tt[t]=void 0,tt[t+1]=void 0}J=0}function f(){try{var t=require,e=t("vertx");return B=e.runOnLoop||e.runOnContext,i()}catch(n){return c()}}function l(t,e){var n=this,r=new this.constructor(p);void 0===r[rt]&&k(r);var o=n._state;if(o){var i=arguments[o-1];Q(function(){x(o,r,i,n._result)})}else E(n,r,t,e);return r}function h(t){var e=this;if(t&&"object"==typeof t&&t.constructor===e)return t;var n=new e(p);return g(n,t),n}function p(){}function _(){return new TypeError("You cannot resolve a promise with itself")}function d(){return new TypeError("A promises callback cannot return that same promise.")}function v(t){try{return t.then}catch(e){return ut.error=e,ut}}function y(t,e,n,r){try{t.call(e,n,r)}catch(o){return o}}function m(t,e,n){Q(function(t){var r=!1,o=y(n,e,function(n){r||(r=!0,e!==n?g(t,n):S(t,n))},function(e){r||(r=!0,j(t,e))},"Settle: "+(t._label||" unknown promise"));!r&&o&&(r=!0,j(t,o))},t)}function b(t,e){e._state===it?S(t,e._result):e._state===st?j(t,e._result):E(e,void 0,function(e){g(t,e)},function(e){j(t,e)})}function w(t,n,r){n.constructor===t.constructor&&r===et&&constructor.resolve===nt?b(t,n):r===ut?j(t,ut.error):void 0===r?S(t,n):e(r)?m(t,n,r):S(t,n)}function g(e,n){e===n?j(e,_()):t(n)?w(e,n,v(n)):S(e,n)}function A(t){t._onerror&&t._onerror(t._result),T(t)}function S(t,e){t._state===ot&&(t._result=e,t._state=it,0!==t._subscribers.length&&Q(T,t))}function j(t,e){t._state===ot&&(t._state=st,t._result=e,Q(A,t))}function E(t,e,n,r){var o=t._subscribers,i=o.length;t._onerror=null,o[i]=e,o[i+it]=n,o[i+st]=r,0===i&&t._state&&Q(T,t)}function T(t){var e=t._subscribers,n=t._state;if(0!==e.length){for(var r,o,i=t._result,s=0;s<e.length;s+=3)r=e[s],o=e[s+n],r?x(n,r,o,i):o(i);t._subscribers.length=0}}function M(){this.error=null}function P(t,e){try{return t(e)}catch(n){return ct.error=n,ct}}function x(t,n,r,o){var i,s,u,c,a=e(r);if(a){if(i=P(r,o),i===ct?(c=!0,s=i.error,i=null):u=!0,n===i)return void j(n,d())}else i=o,u=!0;n._state!==ot||(a&&u?g(n,i):c?j(n,s):t===it?S(n,i):t===st&&j(n,i))}function C(t,e){try{e(function(e){g(t,e)},function(e){j(t,e)})}catch(n){j(t,n)}}function O(){return at++}function k(t){t[rt]=at++,t._state=void 0,t._result=void 0,t._subscribers=[]}function Y(t){return new _t(this,t).promise}function q(t){var e=this;return new e(I(t)?function(n,r){for(var o=t.length,i=0;o>i;i++)e.resolve(t[i]).then(n,r)}:function(t,e){e(new TypeError("You must pass an array to race."))})}function F(t){var e=this,n=new e(p);return j(n,t),n}function D(){throw new TypeError("You must pass a resolver function as the first argument to the promise constructor")}function K(){throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.")}function L(t){this[rt]=O(),this._result=this._state=void 0,this._subscribers=[],p!==t&&("function"!=typeof t&&D(),this instanceof L?C(this,t):K())}function N(t,e){this._instanceConstructor=t,this.promise=new t(p),this.promise[rt]||k(this.promise),I(e)?(this._input=e,this.length=e.length,this._remaining=e.length,this._result=new Array(this.length),0===this.length?S(this.promise,this._result):(this.length=this.length||0,this._enumerate(),0===this._remaining&&S(this.promise,this._result))):j(this.promise,U())}function U(){return new Error("Array Methods must be provided an Array")}function W(){var t;if("undefined"!=typeof global)t=global;else if("undefined"!=typeof self)t=self;else try{t=Function("return this")()}catch(e){throw new Error("polyfill failed because global object is unavailable in this environment")}var n=t.Promise;(!n||"[object Promise]"!==Object.prototype.toString.call(n.resolve())||n.cast)&&(t.Promise=pt)}var z;z=Array.isArray?Array.isArray:function(t){return"[object Array]"===Object.prototype.toString.call(t)};var B,G,H,I=z,J=0,Q=function(t,e){tt[J]=t,tt[J+1]=e,J+=2,2===J&&(G?G(a):H())},R="undefined"!=typeof window?window:void 0,V=R||{},X=V.MutationObserver||V.WebKitMutationObserver,Z="undefined"==typeof self&&"undefined"!=typeof process&&"[object process]"==={}.toString.call(process),$="undefined"!=typeof Uint8ClampedArray&&"undefined"!=typeof importScripts&&"undefined"!=typeof MessageChannel,tt=new Array(1e3);H=Z?o():X?s():$?u():void 0===R&&"function"==typeof require?f():c();var et=l,nt=h,rt=Math.random().toString(36).substring(16),ot=void 0,it=1,st=2,ut=new M,ct=new M,at=0,ft=Y,lt=q,ht=F,pt=L;L.all=ft,L.race=lt,L.resolve=nt,L.reject=ht,L._setScheduler=n,L._setAsap=r,L._asap=Q,L.prototype={constructor:L,then:et,"catch":function(t){return this.then(null,t)}};var _t=N;N.prototype._enumerate=function(){for(var t=this.length,e=this._input,n=0;this._state===ot&&t>n;n++)this._eachEntry(e[n],n)},N.prototype._eachEntry=function(t,e){var n=this._instanceConstructor,r=n.resolve;if(r===nt){var o=v(t);if(o===et&&t._state!==ot)this._settledAt(t._state,e,t._result);else if("function"!=typeof o)this._remaining--,this._result[e]=t;else if(n===pt){var i=new n(p);w(i,t,o),this._willSettleAt(i,e)}else this._willSettleAt(new n(function(e){e(t)}),e)}else this._willSettleAt(r(t),e)},N.prototype._settledAt=function(t,e,n){var r=this.promise;r._state===ot&&(this._remaining--,t===st?j(r,n):this._result[e]=n),0===this._remaining&&S(r,this._result)},N.prototype._willSettleAt=function(t,e){var n=this;E(t,void 0,function(t){n._settledAt(it,e,t)},function(t){n._settledAt(st,e,t)})};var dt=W,vt={Promise:pt,polyfill:dt};"function"==typeof define&&define.amd?define(function(){return vt}):"undefined"!=typeof module&&module.exports?module.exports=vt:"undefined"!=typeof this&&(this.ES6Promise=vt),dt()}).call(this);

// https://github.com/kristw/d3.promise
!function(a,b){"function"==typeof define&&define.amd?define(["d3"],b):"object"==typeof exports?module.exports=b(require("d3")):a.d3.promise=b(a.d3)}(this,function(a){var b=function(){function b(a,b){return function(){var c=Array.prototype.slice.call(arguments);return new Promise(function(d,e){var f=function(a,b){return a?void e(Error(a)):void d(b)};b.apply(a,c.concat(f))})}}var c={};return["csv","tsv","json","xml","text","html"].forEach(function(d){c[d]=b(a,a[d])}),c}();return a.promise=b,b});

// https://github.com/overset/javascript-natural-sort
function naturalSort(a,b){var q,r,c=/(^([+\-]?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?(?=\D|\s|$))|^0x[\da-fA-F]+$|\d+)/g,d=/^\s+|\s+$/g,e=/\s+/g,f=/(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,g=/^0x[0-9a-f]+$/i,h=/^0/,i=function(a){return(naturalSort.insensitive&&(""+a).toLowerCase()||""+a).replace(d,"")},j=i(a),k=i(b),l=j.replace(c,"\0$1\0").replace(/\0$/,"").replace(/^\0/,"").split("\0"),m=k.replace(c,"\0$1\0").replace(/\0$/,"").replace(/^\0/,"").split("\0"),n=parseInt(j.match(g),16)||1!==l.length&&Date.parse(j),o=parseInt(k.match(g),16)||n&&k.match(f)&&Date.parse(k)||null,p=function(a,b){return(!a.match(h)||1==b)&&parseFloat(a)||a.replace(e," ").replace(d,"")||0};if(o){if(n<o)return-1;if(n>o)return 1}for(var s=0,t=l.length,u=m.length,v=Math.max(t,u);s<v;s++){if(q=p(l[s]||"",t),r=p(m[s]||"",u),isNaN(q)!==isNaN(r))return isNaN(q)?1:-1;if(/[^\x00-\x80]/.test(q+r)&&q.localeCompare){var w=q.localeCompare(r);return w/Math.abs(w)}if(q<r)return-1;if(q>r)return 1}}

/* Constructs a prototypal Ideogram class */
var Ideogram = function(config) {

  // Clone the config object, to allow multiple instantiations
  // without picking up prior ideogram's settings
  this.config = JSON.parse(JSON.stringify(config));

  this.debug = false;

  if (!this.config.dataDir) {
    this.config.dataDir = "data/";
  }

  if (!this.config.bandDir) {
    this.config.bandDir = this.config.dataDir + "bands/";
  }

  if (!this.config.container) {
  	this.config.container = "body";
  }

  if (!this.config.resolution) {
    this.config.resolution = 850;
  }

  if ("showChromosomeLabels" in this.config === false) {
    this.config.showChromosomeLabels = true;
  }

  if (!this.config.chrMargin) {
    this.config.chrMargin = 10;
  }

  if (!this.config.orientation) {
    var orientation = "vertical";
    this.config.orientation = orientation;
  }

  if (!this.config.chrHeight) {
      var chrHeight,
          container = this.config.container,
          rect = document.querySelector(container).getBoundingClientRect();

      if (orientation === "vertical") {
        chrHeight = rect.height;
      } else {
        chrHeight = rect.width;
      }

      if (container == "body") {
        chrHeight = 500;
      }
      this.config.chrHeight = chrHeight;
  }

  if (!this.config.chrWidth) {
    var chrWidth = 10,
        chrHeight = this.config.chrHeight;
    if (900 > chrHeight && chrHeight > 500) {
      chrWidth = Math.round(chrHeight / 40);
    } else if (chrHeight >= 900) {
      chrWidth = Math.round(chrHeight / 45);
    }
    this.config.chrWidth = chrWidth;
  }

  if (!this.config.showBandLabels) {
    this.config.showBandLabels = false;
  }

  if (!this.config.brush) {
    this.config.brush = false;
  }

  if (!this.config.rows) {
  	this.config.rows = 1;
  }

  this.bump = Math.round(this.config.chrHeight / 125);
  this.adjustedBump = false;
  if (this.config.chrHeight < 200) {
    this.adjustedBump = true;
    this.bump = 4;
  }

  if (config.showBandLabels) {
    this.config.chrMargin += 20;
  }

  if (config.chromosome) {
    this.config.chromosomes = [config.chromosome];
    if ("showBandLabels" in config === false) {
      this.config.showBandLabels = true;
    }
    if ("rotatable" in config === false) {
      this.config.rotatable = false;
    }
  }

  if (!this.config.showNonNuclearChromosomes) {
    this.config.showNonNuclearChromosomes = false;
  }

  if (!this.config.showCentromeres) {
    this.config.showCentromeres = true;
  }
  if (this.config.armColors) {
    this.config.showCentromeres = false;
  }

  this.initAnnotSettings();

  this.config.chrMargin = (
    this.config.chrMargin +
    this.config.chrWidth +
    this.config.annotTracksHeight * 2
  );

  if (config.onLoad) {
    this.onLoadCallback = config.onLoad;
  }

  if (config.onDrawAnnots) {
    this.onDrawAnnotsCallback = config.onDrawAnnots;
  }

  if (config.onBrushMove) {
    this.onBrushMoveCallback = config.onBrushMove;
  }

  this.coordinateSystem = "iscn";

  this.maxLength = {
    "bp": 0,
    "iscn": 0
  };


  // The E-Utilies In Depth: Parameters, Syntax and More:
  // https://www.ncbi.nlm.nih.gov/books/NBK25499/
  var eutils = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
  this.esearch = eutils + "esearch.fcgi?retmode=json";
  this.esummary = eutils + "esummary.fcgi?retmode=json";
  this.elink = eutils + "elink.fcgi?retmode=json";

  this.organisms = {
    "9606": {
      "commonName": "Human",
      "scientificName": "Homo sapiens",
      "scientificNameAbbr": "H. sapiens",
      "assemblies": { // technically, primary assembly unit of assembly
        "default": "GCF_000001305.14", // GRCh38
        "GRCh38": "GCF_000001305.14",
        "GRCh37": "GCF_000001305.13",
      }
    },
    "10090": {
      "commonName": "Mouse",
      "scientificName": "Mus musculus",
      "scientificNameAbbr": "M. musculus",
      "assemblies": {
        "default": "GCF_000000055.19"
      }
    },
    "7227": {
      "commonName": "Fly",
      "scientificName": "Drosophlia melanogaster",
      "scientificNameAbbr": "D. melanogaster"
    }
  };

  // A flat array of chromosomes
  // (this.chromosomes is an object of
  // arrays of chromosomes, keyed by organism)
  this.chromosomesArray = [];

  this.bandsToShow = [];

  this.chromosomes = {};
  this.numChromosomes = 0;
  this.bandData = {};

  this.init();

};

/**
* Gets chromosome band data from a
* TSV file, or, if band data is prefetched, from an array
*
* UCSC: #chrom chromStart  chromEnd  name  gieStain
* http://genome.ucsc.edu/cgi-bin/hgTables
*  - group: Mapping and Sequencing
*  - track: Chromosome Band (Ideogram)
*
* NCBI: #chromosome  arm band  iscn_start  iscn_stop bp_start  bp_stop stain density
* ftp://ftp.ncbi.nlm.nih.gov/pub/gdp/ideogram_9606_GCF_000001305.14_550_V1
*/
Ideogram.prototype.getBands = function(content, taxid, chromosomes) {

  var lines = {},
      delimiter, tsvLines, columns, line, stain, chr,
      i, prefetched, init, tsvLinesLength, source,
      start, stop, firstColumn;

  if (content.slice(0, 8) === "chrBands") {
    source = "native";
  }

  if (typeof chrBands === "undefined" && source !== "native") {
    delimiter = /\t/;
    tsvLines = content.split(/\r\n|\n/);
    init = 1;
  } else {
    delimiter = / /;
    if (source === "native") {
     tsvLines = eval(content);
    } else {
      tsvLines = content;
    }
    init = 0;
  }

  firstColumn = tsvLines[0].split(delimiter)[0];
  if (firstColumn == '#chromosome') {
    source = 'ncbi';
  } else if (firstColumn == '#chrom'){
    source = 'ucsc';
  } else {
    source = 'native';
  }

  tsvLinesLength = tsvLines.length;

  if (source === 'ncbi' || source === 'native') {
    for (i = init; i < tsvLinesLength; i++) {

      columns = tsvLines[i].split(delimiter);

      chr = columns[0];

      if (
        // If a specific set of chromosomes has been requested, and
        // the current chromosome
        typeof(chromosomes) !== "undefined" &&
        chromosomes.indexOf(chr) === -1
      ) {
        continue;
      }

      if (chr in lines === false) {
        lines[chr] = [];
      }

      stain = columns[7];
      if (columns[8]) {
        // For e.g. acen and gvar, columns[8] (density) is undefined
        stain += columns[8];
      }

      line = {
        "chr": chr,
        "bp": {
          "start": parseInt(columns[5], 10),
          "stop": parseInt(columns[6], 10)
        },
        "iscn": {
          "start": parseInt(columns[3], 10),
          "stop": parseInt(columns[4], 10)
        },
        "px": {
          "start": -1,
          "stop": -1,
          "width": -1
        },
        "name": columns[1] + columns[2],
        "stain": stain,
        "taxid": taxid
      };

      lines[chr].push(line);

    }
  } else if (source === 'ucsc') {
    for (i = init; i < tsvLinesLength; i++) {

      // #chrom chromStart  chromEnd  name  gieStain
      // e.g. for fly:
      // chr4	69508	108296	102A1	n/a
      columns = tsvLines[i].split(delimiter);

      if (columns[0] !== 'chr' + chromosomeName) {
        continue;
      }

      stain = columns[4];
      if (stain === 'n/a') {
        stain = 'gpos100';
      }
      start = parseInt(columns[1], 10);
      stop = parseInt(columns[2], 10);

      line = {
        "chr": columns[0].split('chr')[1],
        "bp": {
          "start": start,
          "stop": stop
        },
        "iscn": {
          "start": start,
          "stop": stop
        },
        "px": {
          "start": -1,
          "stop": -1,
          "width": -1
        },
        "name": columns[3],
        "stain": stain,
        "taxid": taxid
      };

      lines[chr].push(line);
    }
  }

  return lines;

};

/**
* Fills cytogenetic arms -- p-arm and q-arm -- with specified colors
*/
Ideogram.prototype.colorArms = function(pArmColor, qArmColor) {

  var ideo = this;

  ideo.chromosomesArray.forEach(function(chr, chrIndex){

    var bands = chr.bands,
        pcen = chr.centromere[0],
        qcen = chr.centromere[1],
        chrID = chr.id,
        chrMargin = ideo.config.chrMargin * (chrIndex + 1),
        chrWidth = ideo.config.chrWidth;

    pcenStart = pcen.px.start;
    qcenStop = qcen.px.stop;

    d3.select("#" + chrID)
      .append("line")
        .attr("x1", pcenStart)
        .attr("y1", chrMargin + 0.2)
        .attr("x2", pcenStart)
        .attr("y2", chrMargin + chrWidth - 0.2)
        .style("stroke", pArmColor)

    d3.select("#" + chrID)
      .append("line")
        .attr("x1", qcenStop)
        .attr("y1", chrMargin + 0.2)
        .attr("x2", qcenStop)
        .attr("y2", chrMargin + chrWidth - 0.2)
        .style("stroke", qArmColor)

    d3.selectAll("#" + chrID + " .band")
      .data(chr.bands)
      .style("fill", function(d, i) {
        return (i <= chr.pcenIndex - 1) ? pArmColor : qArmColor;
      });
    d3.selectAll("#" + chrID + " .acen")
      .data(chr.centromere)
      .style("fill", function(d, i) {
        return (d.name[0] == "p") ? pArmColor : qArmColor;
      })
  });
  d3.selectAll(".upstream.chromosomeBorder").style("fill", pArmColor);
  d3.selectAll(".downstream.chromosomeBorder").style("fill", qArmColor);

};

Ideogram.prototype.getCentromereModel = function(chromosome) {

  var ideo = this,
      chr = chromosome,
      centromere,
      start = chr.centromere.start,
      length = Math.ceil(chr.centromere.length/2),
      cenArm, cenArmStart, cenArmStop, cenArmStartPx, cenArmStopPx,
      cenStartPx, cenStopPx, cenWidth,
      cs;

  centromere = [
      {
          'bp': {
              'start': start,
              'length': length
          }
      },
      {
          'bp': {
              'start': start + length,
              'length': length
          }
      }
  ];

  if ("pcenBandName" in chr.centromere) {
    // Has bands
    centromere[0].name = chr.centromere.pcenBandName;
    centromere[1].name = chr.centromere.qcenBandName;
  } else {
    centromere[0].name = "p11";
    centromere[1].name = "q11";
  }

  if ("iscnStart" in chr.centromere) {

    // In human reference genome (e.g. GRCh38)
    cs = 'iscn';
    start = chr.centromere.iscnStart;
    length = Math.ceil(chr.centromere.iscnLength/2);

    centromere[0]['iscn'] = {
      'start': start,
      'length': length
    }
    centromere[0].px = chr.centromere.pcenPx;

    centromere[1]['iscn'] = {
      'start': start,
      'length': start + length
    }
    centromere[1].px = chr.centromere.qcenPx;

  } else {
    // In other genomes, e.g. for cat, chimpanzee, etc.
    cs = 'bp';
  }

  if (cs == 'bp') {
    for (var i = 0; i < centromere.length; i++) {
      cenArm = centromere[i];
      cenArmStart = cenArm.bp.start;
      cenArmStop = cenArmStart + cenArm.bp.length;
      cenArmStartPx = ideo.convertBpToPxNoBands(chr, cenArmStart);
      cenArmStopPx = ideo.convertBpToPxNoBands(chr, cenArmStop);
      centromere[i]["px"] = {
        "start": cenArmStartPx,
        "stop": cenArmStopPx,
        "width": cenArmStopPx - cenArmStartPx
      }
    }
  }

  cenStopPx = centromere[1].px.stop;
  cenStartPx = centromere[0].px.start;
  cenWidthPx = cenStopPx - cenStartPx;
  if (ideo.bump > cenWidthPx) {
    // Make very small, non-telocentric centromeres discernible
    // Applies to e.g. cat (Felis catus)
    centromere[0].px = {
      "start": centromere[0].px.start - ideo.bump,
      "stop": centromere[0].px.stop,
      "width": centromere[0].px.width + ideo.bump
    }
    centromere[1].px = {
      "start": centromere[1].px.start,
      "stop": centromere[1].px.stop + ideo.bump,
      "width": centromere[1].px.width + ideo.bump
    }
  }

  return centromere;
}

/**
* Generates a model object for each chromosome
* containing information on its name, DOM ID,
* length in base pairs or ISCN coordinates,
* cytogenetic bands, centromere position, etc.
*/
Ideogram.prototype.getChromosomeModel = function(bands, chromosome, taxid, chrIndex) {

  var chr = {},
      ideo = this,
      band, scale,
      width, pxStop,
      startType, stopType,
      chrHeight = this.config.chrHeight,
      maxLength = this.maxLength,
      bump = this.bump,
      pcenIndex, chrLength,
      cs, hasBands, start, stop;

  cs = ideo.coordinateSystem;
  hasBands = (typeof bands !== "undefined");

  if (hasBands) {
    chr["name"] = chromosome;
    chr["length"] = bands[bands.length - 1][cs].stop;
    chr["type"] = "nuclear";
  } else {
    chr = chromosome;
  }

  chr["chrIndex"] = chrIndex;

  chr["id"] = "chr" + chr.name + "-" + taxid;

  if (ideo.config.fullChromosomeLabels === true) {
    var orgName = ideo.organisms[taxid].scientificNameAbbr;
    chr["name"] = orgName + " chr" + chr.name;
  }

  chrLength = chr["length"];

  pxStop = 0;

  if (hasBands) {

    for (var i = 0; i < bands.length; i++) {
      band = bands[i];

      width = chrHeight * chr["length"]/maxLength[cs] * (band[cs].stop - band[cs].start)/chrLength;

      bands[i]["px"] = {"start": pxStop, "stop": pxStop + width, "width": width};

      pxStop = bands[i].px.stop;

      if (band.stain === "acen") {
        if (band.name[0] === "p") {
          chr["pcenIndex"] = i;
        }
      }
    }

    if ("pcenIndex" in chr) {
      pcenIndex = chr.pcenIndex;
      var pcen = bands[pcenIndex];
      var qcen = bands[pcenIndex + 1];
      var pcenPx = pcen.px;
      var qcenPx = qcen.px;
      if (ideo.adjustedBump && pcenPx.width + qcenPx.width > bump) {
        // e.g. human chr14 and chr15 in small layout (chrHeight = 200)
        pcenPx["stop"] = pcenPx.stop + (bump/2 - pcenPx.width) - 0.3;
        pcenPx["width"] = bump/2;
        qcenPx["stop"] = qcenPx.stop + (bump/2 - qcenPx.width) - 0.3;
        qcenPx["width"] = bump/2;
      }
      chr["centromere"] = {
        "start": pcen.bp.start,
        "length": qcen.bp.stop - pcen.bp.start,
        "iscnStart": pcen.iscn.start,
        "iscnLength": qcen.iscn.stop - pcen.iscn.start,
        "pcenPx": pcenPx,
        "qcenPx": qcenPx,
        "pcenBandName": pcen.name,
        "qcenBandName": qcen.name
      };
    }

  } else {
    pxStop = chrHeight * chr["length"]/maxLength[cs];
  }

  chr["width"] = pxStop;

  chr["scale"] = {};

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
    if (hasBands) {
      chr["scale"].iscn = chrHeight / maxLength.iscn;
    }
  }

  if (hasBands) {
    // Avoids setting undefined "bands" property
    chr["bands"] = bands;
  }

  chr["centromerePosition"] = "";
  if (hasBands && bands[0].bp.stop - bands[0].bp.start == 1) {
    // As with mouse
    chr["centromerePosition"] = "telocentricPCen";

    // Remove placeholder pter band
    chr["bands"] = chr["bands"].slice(1);
  }

  if ("centromere" in chr) {
    chr["centromere"] = ideo.getCentromereModel(chr);

    for (var i = 0; i < chr.centromere.length; i++) {
      band = chr.centromere[i];
      start = band.bp.start;
      stop = start + band.bp.length;
      if (band.name[0] == "p" && start == 1) {
        chr["centromerePosition"] = "telocentricPCen";
      } else if (band.name[0] == "q" && stop == chr.length - 1) {
        chr["centromerePosition"] = "telocentricQCen";
      }
    }

    if (
      chr["centromerePosition"] == "" &&
      chr.centromere[0].px.start < ideo.bump * 2
    ) {
      // e.g. Pan troglodytes chr18
      chr["centromerePosition"] = "telocentricPCen";
    }

    if (ideo.config.taxid == "9606") {
      chr["centromerePosition"] = "";
    }

  }

  var cap = ideo.getCenAndArmParameters(chr);
  chr.pcenStart = cap[0];
  chr.qArmStart = cap[1];
  chr.qArmWidth = cap[2];
  chr.qArmEnd = cap[3];

  return chr;
};

/**
* Draws labels for each chromosome, e.g. "1", "2", "X".
* If ideogram configuration has 'fullChromosomeLabels: True',
* then labels includes name of taxon, which can help when
* depicting orthologs.
*/
Ideogram.prototype.drawChromosomeLabels = function(chromosomes) {

  var i, chr, chrs, taxid, ideo,
      chrMargin2,
      ideo = this,
      chrMargin = ideo.config.chrMargin,
      chrWidth = ideo.config.chrWidth;

  chrs = ideo.chromosomesArray;

  chrMargin2 = chrWidth/2 + chrMargin - 8;
  if (ideo.config.orientation === "vertical" && ideo.config.showBandLabels === true) {
    chrMargin2 = chrMargin + 17;
  }

  if (ideo.config.orientation === "vertical") {

    d3.selectAll(".chromosome")
      .append("text")
       .data(chrs)
        .attr("class", "chrLabel")
        .attr("transform", "rotate(-90)")
        .attr("y", -16)
        .each(function (d, i) {

          var i, chrMarginI, x, cls;
          var arr = d.name.split(" ");
          var lines = [];

          if (arr != undefined) {
              lines.push(arr.slice(0, arr.length - 1).join(" "));
              lines.push(arr[arr.length - 1]);

              if (!ideo.config.showBandLabels) {
                i += 1;
              }

              chrMarginI = chrMargin * i;
              x = -(chrMarginI + chrMargin2 - chrWidth - 2) + ideo.config.annotTracksHeight * 2;

              for (var i = 0; i < lines.length; i++) {

                  cls = "";
                  if (i == 0 && ideo.config.fullChromosomeLabels) {
                    cls = "italic";
                  }

                  d3.select(this).append("tspan")
                    .text(lines[i])
                    .attr("dy", i ? "1.2em" : 0)
                    .attr("x", x)
                    .attr("text-anchor", "middle")
                    .attr("class", cls);
              }
          }
        });

  } else {

     d3.selectAll(".chromosome")
        .append("text")
         .data(chrs)
          .attr("class", "chrLabel")
          .attr("x", -5)
          .each(function (d, i) {

            var i, chrMarginI, y, cls;

            var arr = d.name.split(" ");
            var lines = [];

            if (arr != undefined) {
                lines.push(arr.slice(0, arr.length - 1).join(" "));
                lines.push(arr[arr.length - 1]);

                chrMarginI = chrMargin * i;
                y = (chrMarginI + chrMargin2);

                for (var i = 0; i < lines.length; i++) {

                    cls = "";
                    if (i == 0 && ideo.config.fullChromosomeLabels) {
                      cls = "italic";
                    }

                    d3.select(this).append("tspan")
                      .text(lines[i])
                      .attr("dy", i ? "1.2em" : 0)
                      .attr("y", y)
                      .attr("x", -8)
                      .attr("text-anchor", "middle")
                      .attr("class", cls);
                }
            }
          });

  }

};

/**
* Draws labels and stalks for cytogenetic bands.
*
* Band labels are text like "p11.11".
* Stalks are small lines that visually connect labels to their bands.
*/
Ideogram.prototype.drawBandLabels = function(chromosomes) {

  var i, chr, chrs, taxid, ideo,
      chrMargin2, chrModel;

  ideo = this;

  chrs = [];

  for (taxid in chromosomes) {
    for (chr in chromosomes[taxid]) {
      chrs.push(chromosomes[taxid][chr]);
    }
  }

  var textOffsets = {};

  chrIndex = 0;
  for (var i = 0; i < chrs.length; i++) {

    chrIndex += 1;

    chrModel = chrs[i];

    chr = d3.select("#" + chrModel.id);

    var chrMargin = this.config.chrMargin * chrIndex,
        lineY1, lineY2,
        ideo = this;

    lineY1 = chrMargin;
    lineY2 = chrMargin - 8;

    if (
      chrIndex == 1 &&
      "perspective" in this.config && this.config.perspective == "comparative"
    ) {
      lineY1 += 18;
      lineY2 += 18;
    }

    textOffsets[chrModel.id] = [];

    chr.selectAll("text")
      .data(chrModel.bands)
      .enter()
      .append("g")
        .attr("class", function(d, i) { return "bandLabel bsbsl-" + i;  })
        .attr("transform", function(d) {

          var x, y;

          x = ideo.round(-8 + d.px.start + d.px.width/2);

          textOffsets[chrModel.id].push(x + 13);
          y = chrMargin - 10;

          return "translate(" + x + "," + y + ")";
        })
        .append("text")
        .text(function(d) { return d.name; });

    chr.selectAll("line.bandLabelStalk")
      .data(chrModel.bands)
      .enter()
      .append("g")
      .attr("class", function(d, i) { return "bandLabelStalk bsbsl-" + i; })
      .attr("transform", function(d) {
        var x = ideo.round(d.px.start + d.px.width/2);
        return "translate(" + x + ", " + lineY1 + ")";
      })
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", -8);
  }

  for (var i = 0; i < chrs.length; i++) {

    chrModel = chrs[i];

    var textsLength = textOffsets[chrModel.id].length,
        overlappingLabelXRight,
        index,
        indexesToShow = [],
        prevHiddenBoxIndex,
        prevTextBox,
        xLeft,
        prevLabelXRight,
        textPadding;

    overlappingLabelXRight = 0;

    textPadding = 5;

    for (index = 0; index < textsLength; index++) {
      // Ensures band labels don't overlap

      xLeft = textOffsets[chrModel.id][index];

      if (xLeft < overlappingLabelXRight + textPadding === false) {
        indexesToShow.push(index);
      } else {
        prevHiddenBoxIndex = index;
        overlappingLabelXRight = prevLabelXRight;
        continue;
      }

      if (prevHiddenBoxIndex !== index) {

        // This getBoundingClientRect() forces Chrome's
        // 'Recalculate Style' and 'Layout', which takes 30-40 ms on Chrome.
        // TODO: This forced synchronous layout would be nice to eliminate.
        //prevTextBox = texts[index].getBoundingClientRect();
        //prevLabelXRight = prevTextBox.left + prevTextBox.width;

        // TODO: Account for number of characters in prevTextBoxWidth,
        // maybe also zoom.
        prevTextBoxLeft = textOffsets[chrModel.id][index];
        prevTextBoxWidth = 36;

        prevLabelXRight = prevTextBoxLeft + prevTextBoxWidth;
      }

      if (
        xLeft < prevLabelXRight + textPadding
      ) {
        prevHiddenBoxIndex = index;
        overlappingLabelXRight = prevLabelXRight;
      } else {
        indexesToShow.push(index);
      }

    }

    var selectorsToShow = [],
        ithLength = indexesToShow.length,
        j;

    for (var j = 0; j < ithLength; j++) {
      index = indexesToShow[j];
      selectorsToShow.push("#" + chrModel.id + " .bsbsl-" + index);
    }

    this.bandsToShow = this.bandsToShow.concat(selectorsToShow);

  }

};

/**
* Rotates chromosome labels by 90 degrees, e.g. upon clicking a chromosome to focus.
*/
Ideogram.prototype.rotateChromosomeLabels = function(chr, chrIndex, orientation, scale) {

  var chrMargin, chrWidth, ideo, x, y,
      numAnnotTracks, scaleSvg, tracksHeight;

  chrWidth = this.config.chrWidth;
  chrMargin = this.config.chrMargin * chrIndex;
  numAnnotTracks = this.config.numAnnotTracks;

  ideo = this;

  if (typeof(scale) !== "undefined" && scale.hasOwnProperty("x") && !(scale.x == 1 && scale.y == 1)) {
    scaleSvg = "scale(" + scale.x + "," + scale.y + ")";
    x = -6;
    y = (scale === "" ? -16 : -14);
  } else {
    x = -8;
    y = -16;
    scale = {"x": 1, "y": 1};
    scaleSvg = "";
  }

  if (orientation == "vertical" || orientation == "") {

    chr.selectAll("text.chrLabel")
      .attr("transform", scaleSvg)
      .selectAll("tspan")
        .attr("x", x)
        .attr("y", function(d, i) {

          var ci = chrIndex - 1;

          if (numAnnotTracks > 1 || orientation == "") {
            ci -= 1;
          }

          chrMargin2 = -4;
          if (ideo.config.showBandLabels === true) {
            chrMargin2 = ideo.config.chrMargin + chrWidth + 26;
          }

          var chrMargin = ideo.config.chrMargin * ci;

          if (numAnnotTracks > 1 == false) {
            chrMargin += 1;
          }

          return chrMargin + chrMargin2;
        });

  } else {

    chrIndex -= 1;

    chrMargin2 = -chrWidth - 2;
    if (ideo.config.showBandLabels === true) {
      chrMargin2 = ideo.config.chrMargin + 8;
    }

    tracksHeight = ideo.config.annotTracksHeight;
    if (ideo.config.annotationsLayout !== "overlay") {
      tracksHeight = tracksHeight * 2;
    }

    chr.selectAll("text.chrLabel")
      .attr("transform", "rotate(-90)" + scaleSvg)
      .selectAll("tspan")
      .attr("x", function(d, i) {

        chrMargin = ideo.config.chrMargin * chrIndex;
        x = -(chrMargin + chrMargin2) + 3 + tracksHeight;
        x = x/scale.x;
        return x;
      })
      .attr("y", y);

  }

};

/**
* Rotates band labels by 90 degrees, e.g. upon clicking a chromosome to focus.
*
* This method includes proportional scaling, which ensures that
* while the parent chromosome group is scaled strongly in one dimension to fill
* available space, the text in the chromosome's band labels is
* not similarly distorted, and remains readable.
*/
Ideogram.prototype.rotateBandLabels = function(chr, chrIndex, scale) {

  var chrMargin, chrWidth, scaleSvg,
      orientation, bandLabels,
      ideo = this;

  bandLabels = chr.selectAll(".bandLabel");

  chrWidth = this.config.chrWidth;
  chrMargin = this.config.chrMargin * chrIndex;

  orientation = chr.attr("data-orientation");

  if (typeof(scale) == "undefined") {
    scale = {x: 1, y: 1};
    scaleSvg = "";
  } else {
    scaleSvg = "scale(" + scale.x + "," + scale.y + ")";
  }

  if (
    chrIndex == 1 &&
    "perspective" in this.config && this.config.perspective == "comparative"
  ) {
    bandLabels
      .attr("transform", function(d) {
        var x, y;
        x = (8 - chrMargin) - 26;
        y = ideo.round(2 + d.px.start + d.px.width/2);
        return "rotate(-90)translate(" + x + "," + y + ")";
      })
      .selectAll("text")
        .attr("text-anchor", "end");
  } else if (orientation == "vertical")  {
    bandLabels
      .attr("transform", function(d) {
        var x, y;
        x = 8 - chrMargin;
        y = ideo.round(2 + d.px.start + d.px.width/2);
        return "rotate(-90)translate(" + x + "," + y + ")";
      })
      .selectAll("text")
        .attr("transform", scaleSvg);
  } else {
    bandLabels
      .attr("transform", function(d) {
        var x, y;
        x = ideo.round(-8*scale.x + d.px.start + d.px.width/2);
        y = chrMargin - 10;
        return "translate(" + x + "," + y + ")";
      })
      .selectAll("text")
        .attr("transform", scaleSvg);

    chr.selectAll(".bandLabelStalk line")
      .attr("transform", scaleSvg);
  }

};

Ideogram.prototype.round = function(coord) {
  // Rounds an SVG coordinates to two decimal places
  // e.g. 42.1234567890 -> 42.12
  // Per http://stackoverflow.com/a/9453447, below method is fastest
  return Math.round(coord * 100) / 100;
};

Ideogram.prototype.getCentromerePath = function(d, chrModel) {

  var ideo = this,
      left = ideo.round(d.px.start),
      cenWidth = ideo.round(d.px.width),
      cenWidthTweak = 0,
      bump = ideo.bump,
      hasBands = "bands" in chrModel,
      chrWidth = ideo.config.chrWidth,
      chrMargin = ideo.config.chrMargin * chrModel.chrIndex,
      curveStart, curveMid, curveEnd,
      curveTweak;

  curveTweak = 0;

  // Pericentromeric bands get curved
  if (ideo.adjustedBump) {
    curveTweak = 0.35;
    cenWidth = 0.2;
    left += bump;
    if (d.name[0] === "q") {
      left -= 0.7;
    }
  }

  curveStart = chrMargin + curveTweak;
  curveMid = chrWidth/2 - curveTweak*2;
  curveEnd = chrWidth - curveTweak*2;

  if (hasBands) {
    mx = left;
    my = curveStart;
    ldx = cenWidth - bump/2;
    q = bump + " " + curveMid + " 0 " + curveEnd + " ";
  } else {
    mx = left - cenWidth;
    my = curveStart;
    ldx = cenWidth + cenWidthTweak;
    q = (bump + 1) + " " + curveMid + " 0 " + curveEnd + " ";
  }

  if (ideo.adjustedBump) {
    ldx = 0.2;
  }

  if (d.name[0] == "p") {
    // p arm
    d =
      "M " + mx + " " + my + " " +
      "l " + ldx + " 0 " +
      "q " + q +
      "l -" + ldx + " 0 z";
  } else {

    if (ideo.adjustedBump) {
      cenWidth -= 0.2;
    }

    if (chrModel.centromerePosition == "telocentricPCen") {
      mx += 1;
    }

    if (hasBands) {
      mx = left + cenWidth;
      q = (bump + 0.5) + " " + curveMid + " 0 " + curveEnd + " ";
    } else {
      mx = mx + (bump + 1) + ldx;
    }

    // q arm
    d =
      "M " + mx + " " + my + " " +
      "l -" + ldx + " 0 " +
      "q -" + q +
      "l " + ldx + " 0 z";
  }

  return d;
}

Ideogram.prototype.getCenAndArmParameters = function(chrModel) {

  var ideo = this,
      bump = ideo.bump,
      centromere, cenPosition, cenTweak, borderTweak,
      pcen, qcen,
      pcenStart, qArmStart, qArmWidth, qArmEnd,
      hasBands = "bands" in chrModel;

  centromere = chrModel.centromere;
  cenPosition = chrModel.centromerePosition;

  if (cenPosition !== "telocentricPCen" && "centromere" in chrModel) {

    pcen = centromere[0];
    qcen = centromere[1];

    cenTweak = pcen.px.width - bump/2;

    pcenStart = pcen.px.start;
    qArmStart = qcen.px.stop + bump/2 - cenTweak;

  } else {
    pcenStart = 2;
    qArmStart = 6;
  }

  qArmWidth = chrModel.width - qArmStart;
  qArmEnd = qArmStart + qArmWidth - bump/2;

  if (cenPosition !== "telocentricPCen") {
    if (hasBands) {
      qArmStart = qcen.px.stop;
    } else {
      pcenStart -= cenTweak;
      qArmEnd += bump/2;
    }
  }

  if (ideo.adjustedBump) {
    borderTweak = 1.8;
    // qArmStart -= borderTweak;
    // qArmWidth -= borderTweak;
    qArmEnd -= borderTweak*1.3;
  }

  return [
    pcenStart,
    qArmStart,
    qArmWidth,
    qArmEnd
  ];
}

Ideogram.prototype.drawChromosomeBordersAndCentromeres = function(chrModel, chr) {

  var ideo = this,
      bump = ideo.bump,
      chrMargin, chrWidth,
      centromere, cenPosition, cenTweak, d, cenID,
      hasBands = "bands" in chrModel;

  chrMargin = ideo.config.chrMargin * chrModel.chrIndex;
  chrWidth = ideo.config.chrWidth;

  centromere = chrModel.centromere;
  cenPosition = chrModel.centromerePosition;

  pcenStart = chrModel.pcenStart;
  qArmStart = chrModel.qArmStart;
  qArmWidth = chrModel.qArmWidth;
  qArmEnd = chrModel.qArmEnd;

  if (centromere && cenPosition != "telocentricPCen") {
    for (var i = 0; i < centromere.length; i++) {
      band = centromere[i];
      if (
        band.name[0] == "p" && cenPosition == "telocentricPCen" ||
        band.name[0] == "q" && cenPosition == "telocentricQCen"
      ) {
        // If the chromosome is lacking a p arm or q arm,
        // then don't draw that side of the pericentromeric heterochromatin
        continue;
      }
      d = ideo.getCentromerePath(band, chrModel);
      cenID = chrModel.id + "-" + band.name;
      chr.append('path')
        .attr("id", cenID)
        .attr("class", band.name + " acen band")
        .attr("d", d);
    }
  } else {
    // With telocentric chromosomes, e.g. mouse (banded) or chimpanzee (unbanded)

    var pTerPad = Math.round(bump/4) + 3;
    var stain = "";

    if ("bands" in chrModel) {
      stain = chrModel.bands[0].stain;
    }

    chr.append('path')
      .attr("class", "upstream chromosomeBorder " + stain)
      .attr("d",
        "M " + (pTerPad - 3) + " " + chrMargin + " " +
        "l -" + (pTerPad - 2) + " 0 " +
        "l 0 " + chrWidth + " " +
        "l " + (pTerPad - 2) + " 0 z");

    chr.insert('path', ':first-child')
      .attr("class", "acen")
      .attr("d",
        "M " + (pTerPad - 3) + " " + (chrMargin + chrWidth * 0.1) + " " +
        "l " + (pTerPad + bump/2 + 1) + " 0 " +
        "l 0 " + chrWidth * 0.8 + " " +
        "l -" + (pTerPad + bump/2 + 1) + " 0 z");
  }


  if ("bands" in chrModel === false) {
    if (cenPosition == "telocentricPCen") {
      // E.g. Ornithorhynchus anatinus chr14
      // http://localhost/ideogram/examples/eukaryotes.html?org=ornithorhynchus-anatinus
      // See also Pan troglodytes chr13
      // http://localhost/ideogram/examples/eukaryotes.html?org=pan-troglodytes
    } else {
      // More typical case
      chr.append('path')
        .attr("class", "p-arm chromosomeBody")
        .attr("d",
          "M " + bump/2 + " " + chrMargin + " " +
          "l " + (pcenStart - bump/2) + " 0 " +
          "l 0 " + chrWidth + " " +
          "l -" + (pcenStart - bump/2) + " 0 z");
    }

    if (cenPosition == "telocentricQCen") {
      // E.g. Ornithorhynchus anatinus chrX1
      qArmEnd += bump;
    } else {
      // More typical case
      chr.append('path')
        .attr("class", "q-arm chromosomeBody")
        .attr("d",
          "M " + qArmStart + " " + chrMargin + " " +
          "l " + qArmWidth + " 0 " +
          "l 0 " + chrWidth + " " +
          "l -" + qArmWidth + " 0 z");
    }
  }

  ideo.drawChromosomeBorders(chr, chrModel, bump, chrMargin, pcenStart, chrWidth, qArmStart, qArmEnd);
}

Ideogram.prototype.drawChromosomeNoBands = function(chrModel, chrIndex) {

  var chr,
      ideo = this,
      bump, chrMargin, chrWidth, width,
      cenPosition;

  bump = ideo.bump;

  chrMargin = ideo.config.chrMargin * chrIndex;
  chrWidth = ideo.config.chrWidth;
  width = chrModel.width;

  chr = d3.select("svg")
    .append("g")
      .attr("id", chrModel.id)
      .attr("class", "chromosome noBands");

  if (width < 1) {
    // Applies to mitochrondrial and chloroplast chromosomes
    return;
  }

  if ("centromere" in chrModel === false) {
    // For assemblies that lack centromere data, e.g.
    // http://localhost/ideogram/examples/eukaryotes.html?org=rattus-norvegicus

    chr.append('line')
      .attr("class", "cb-top chromosomeBorder")
      .attr('x1', bump/2)
      .attr('y1', chrMargin)
      .attr('x2', width)
      .attr("y2", chrMargin);

    chr.append('line')
      .attr("class", "cb-bottom chromosomeBorder")
      .attr('x1', bump/2)
      .attr('y1', chrWidth + chrMargin)
      .attr('x2', width)
      .attr("y2", chrWidth + chrMargin);

    chr.append('path')
      .attr("class", "chromosomeBody")
      .attr("d",
        "M " + bump/2 + " " + chrMargin + " " +
        "l " + (width - bump/2) + " 0 " +
        "l 0 " + chrWidth + " " +
        "l -" + (width - bump/2) + " 0 z");

  } else {
    // For assemblies that have centromere data, e.g.
    // http://localhost/ideogram/examples/eukaryotes.html?org=felis-catus
    ideo.drawChromosomeBordersAndCentromeres(chrModel, chr);
  }

  cenPosition = chrModel.centromerePosition;

  if (cenPosition !== "telocentricPCen") {
    chr.append('path')
      .attr("class", "upstream chromosomeBorder")
      .attr("d",
        "M " + (bump/2 + 0.1) + " " + chrMargin + " " +
        "q -" + bump + " " + (chrWidth/2) + " 0 " + chrWidth);
  }

  if (cenPosition !== "telocentricQCen") {
    chr.append('path')
      .attr("class", "downstream chromosomeBorder")
      .attr("d",
        "M " + width + " " + chrMargin + " " +
        "q " + bump + " " +  chrWidth/2 + " 0 " + chrWidth);
  }
}

Ideogram.prototype.drawChromosomeBorders = function(chr, chrModel, bump, chrMargin, pcenStart, chrWidth, qArmStart, qArmEnd) {

  var ideo = this,
      borderTweak,
      cenPosition = chrModel.centromerePosition;


  if (ideo.adjustedBump) {
    borderTweak = bump/2;
    pcenStart += borderTweak*2;
    qArmStart -= borderTweak;
    qArmEnd += borderTweak*2;
  }

  if (cenPosition !== "telocentricPCen") {

    chr.append('line')
      .attr("class", "cb-p-arm-top chromosomeBorder")
      .attr('x1', bump/2)
      .attr('y1', chrMargin)
      .attr('x2', pcenStart)
      .attr("y2", chrMargin);

    chr.append('line')
      .attr("class", "cb-p-arm-bottom chromosomeBorder")
      .attr('x1', bump/2)
      .attr('y1', chrWidth + chrMargin)
      .attr('x2', pcenStart)
      .attr("y2", chrWidth + chrMargin);
  }

  if (cenPosition !== "telocentricQCen") {
    chr.append('line')
      .attr("class", "cb-q-arm-top chromosomeBorder")
      .attr('x1', qArmStart)
      .attr('y1', chrMargin)
      .attr('x2', qArmEnd)
      .attr("y2", chrMargin);

    chr.append('line')
      .attr("class", "cb-q-arm-bottom chromosomeBorder")
      .attr('x1', qArmStart)
      .attr('y1', chrWidth + chrMargin)
      .attr('x2', qArmEnd)
      .attr("y2", chrWidth + chrMargin);
  }
}

/**
* Renders all the bands and outlining boundaries of a chromosome.
*/
Ideogram.prototype.drawChromosome = function(chrModel, chrIndex) {

  var chr, chrWidth, width,
      pArmWidth, selector, qArmStart, qArmWidth,
      pTerPad, chrClass,
      annotHeight, numAnnotTracks, annotTracksHeight,
      bump, ideo,
      bumpTweak,
      ideo = this;

  if (typeof chrModel.bands === "undefined") {
    ideo.drawChromosomeNoBands(chrModel, chrIndex);
    return;
  }

  bump = ideo.bump;

  // p-terminal band padding
  if (chrModel.centromerePosition != "telocentricPCen") {
    pTerPad = bump;
  } else {
    pTerPad = Math.round(bump/4) + 3;
  }

  chr = d3.select("svg")
    .append("g")
      .attr("id", chrModel.id)
      .attr("class", "chromosome");

  chrWidth = ideo.config.chrWidth;
  width = chrModel.width;

  var chrMargin = ideo.config.chrMargin * chrIndex;

  // Draw chromosome bands
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
          return;
          var arm = d.name[0]; // e.g. p in p11
          cls += " " + arm + "-cen";
        }
        return cls;
      })
      .attr("d", function(d, i) {
        var x = ideo.round(d.px.width),
            left = ideo.round(d.px.start),
            curveStart, curveMid, curveEnd,
            curveTweak,
            innerBump = bump;

        curveTweak = 0;

        if (d.stain == "acen") {
          return;
          //return ideo.getCentromerePath(d, chrModel);
        } else {
          // Normal bands

          if (i == 0) {
            left += pTerPad - bump/2;
            // TODO: this is a minor kludge to preserve visible
            // centromeres in mouse, when viewing mouse and
            // human chromosomes for e.g. orthology analysis
            if (ideo.config.multiorganism === true) {
              left += pTerPad;
            }
          }

          if (ideo.adjustedBump && d.name[0] === "q") {
            left += 1.8;
          }

          if (i == chrModel.bands.length - 1) {
            left -= pTerPad - bump/2;
          }

          d =
            "M " + left + " " + chrMargin + " " +
            "l " + x + " 0 " +
            "l 0 " + chrWidth + " " +
            "l -" + x + " 0 z";
        }

        return d;
      });

  if (chrModel.centromerePosition != "telocentricPCen") {
    // As in human
    chr.append('path')
      .attr("class", "upstream chromosomeBorder " + chrModel.bands[0].stain)
      .attr("d",
        "M " + (pTerPad - bump/2 + 0.1) + " " + chrMargin + " " +
        "q -" + pTerPad + " " + (chrWidth/2) + " 0 " + chrWidth);
  }

  ideo.drawChromosomeBordersAndCentromeres(chrModel, chr);

  width -= bump/2;

  if (ideo.adjustedBump) {
    borderTweak = 2;
    width += borderTweak - 0.4;
  }

  chr.append('path')
    .attr("class", "downstream chromosomeBorder " + chrModel.bands[chrModel.bands.length - 1].stain)
    .attr("d",
      "M " + width + " " + chrMargin + " " +
      "q " + bump + " " +  chrWidth/2 + " 0 " + chrWidth);

};


/**
* Rotates and translates chromosomes upon initialization as needed.
*/
Ideogram.prototype.initTransformChromosome = function(chr, chrIndex) {

  if (this.config.orientation == "vertical") {

    var chrMargin, chrWidth, tPadding;

    chrWidth = this.config.chrWidth;
    chrMargin = this.config.chrMargin * chrIndex;

    if (!this.config.showBandLabels) {
      chrIndex += 2;
    }

    tPadding = chrMargin + (chrWidth-4)*(chrIndex - 1);

    chr
      .attr("data-orientation", "vertical")
      .attr("transform", "rotate(90, " + (tPadding - 30) + ", " + (tPadding) + ")");

    this.rotateBandLabels(chr, chrIndex);

  } else {
    chr.attr("data-orientation", "horizontal");
  }
};

/**
* Rotates a chromosome 90 degrees and shows or hides all other chromosomes
* Useful for focusing or defocusing a particular chromosome
*/
Ideogram.prototype.rotateAndToggleDisplay = function(chromosomeID) {

  var id, chr, chrModel, chrIndex, chrMargin, chrWidth,
      chrHeight, ideoBox, ideoWidth, ideoHeight, scaleX, scaleY,
      initOrientation, currentOrientation,
      cx, cy, cy2,
      ideo = this;

  id = chromosomeID;

  chr = d3.select("#" + id);

  chrModel = ideo.chromosomes[ideo.config.taxid][id.split("-")[0].split("chr")[1]];

  chrIndex = chrModel["chrIndex"];

  otherChrs = d3.selectAll("g.chromosome").filter(function(d, i) { return this.id !== id; });

  initOrientation = ideo.config.orientation;
  currentOrientation = chr.attr("data-orientation");

  chrMargin = this.config.chrMargin * chrIndex;
  chrWidth = this.config.chrWidth;

  ideoBox = d3.select("#_ideogram").nodes()[0].getBoundingClientRect();
  ideoHeight = ideoBox.height;
  ideoWidth = ideoBox.width;

  if (initOrientation == "vertical") {

    chrLength = chr.nodes()[0].getBoundingClientRect().height;

    scaleX = (ideoWidth/chrLength)*0.97;
    scaleY = 1.5;
    scale = "scale(" + scaleX + ", " + scaleY + ")";

    inverseScaleX = 2/scaleX;
    inverseScaleY = 1;

    if (!this.config.showBandLabels) {
      chrIndex += 2;
    }

    cx = chrMargin + (chrWidth-4)*(chrIndex - 1) - 30;
    cy = cx + 30;

    verticalTransform = "rotate(90, " + cx + ", " + cy + ")";

    cy2 = -1*(chrMargin - this.config.annotTracksHeight)*scaleY;

    if (this.config.showBandLabels) {
      cy2 += 25;
    }

    horizontalTransform =
      "rotate(0)" +
      "translate(20, " + cy2 + ")" +
      scale;

  } else {

    chrLength = chr.nodes()[0].getBoundingClientRect().width;

    scaleX = (ideoHeight/chrLength)*0.97;
    scaleY = 1.5;
    scale = "scale(" + scaleX + ", " + scaleY + ")";

    inverseScaleX = 2/scaleX;
    inverseScaleY = 1;

    var bandPad = 20;
    if (!this.config.showBandLabels) {
      chrIndex += 2;
      bandPad = 15;
    }
    cx = chrMargin + (chrWidth-bandPad)*(chrIndex - 2);
    cy = cx + 5;

    if (!this.config.showBandLabels) {
      cx += bandPad;
      cy += bandPad;
    }

    verticalTransform = (
      "rotate(90, " + cx + ", " + cy + ")" +
      scale
    );
    horizontalTransform = "";

  }

  inverseScale = "scale(" + inverseScaleX + "," + inverseScaleY + ")";

  if (currentOrientation != "vertical") {

    if (initOrientation == "horizontal") {
      otherChrs.style("display", "none");

    }

    chr.selectAll(".annot>path")
      .attr("transform", (initOrientation == "vertical" ? "" : inverseScale));

    chr
      .attr("data-orientation", "vertical")
      .transition()
      .attr("transform", verticalTransform)
      .on("end", function() {

        if (initOrientation == "vertical") {
          scale = "";
        } else {
          scale = {"x": inverseScaleY, "y": inverseScaleX};
        }

        ideo.rotateBandLabels(chr, chrIndex, scale);
        ideo.rotateChromosomeLabels(chr, chrIndex, "horizontal", scale);

        if (initOrientation == "vertical") {
          otherChrs.style("display", "");
        }

      });

  } else {

    chr.attr("data-orientation", "");

    if (initOrientation == "vertical") {
      otherChrs.style("display", "none");
    }

    chr.selectAll(".annot>path")
      .transition()
      .attr("transform", (initOrientation == "vertical" ? inverseScale : ""));

    chr
      .transition()
      .attr("transform", horizontalTransform)
      .on("end", function() {

        if (initOrientation == "horizontal") {
          if (currentOrientation == "vertical") {
            inverseScale = {"x": 1, "y": 1};
          } else {
            inverseScale = "";
          }
        } else {
          inverseScale = {"x": inverseScaleX, "y": inverseScaleY};
        }

        ideo.rotateBandLabels(chr, chrIndex, inverseScale);
        ideo.rotateChromosomeLabels(chr, chrIndex, "", inverseScale);

        if (initOrientation == "horizontal") {
          otherChrs.style("display", "");
        }

      });
  }
};

/**
* convertBpToPx, for chromosomes that lack band data, i.e. not human or mouse
*/
Ideogram.prototype.convertBpToPxNoBands = function(chr, bp) {
  return bp * chr.scale.bp;
}

/**
* Converts base pair coordinates to pixel offsets.
* Bp-to-pixel scales differ among cytogenetic bands.
*/
Ideogram.prototype.convertBpToPx = function(chr, bp) {

  var i, band, bpToIscnScale, iscn, px;

  for (i = 0; i < chr.bands.length; i++) {
    band = chr.bands[i];
    if (bp >= band.bp.start && bp <= band.bp.stop) {

      bpToIscnScale = (band.iscn.stop - band.iscn.start)/(band.bp.stop - band.bp.start);
      iscn = band.iscn.start + (bp - band.bp.start) * bpToIscnScale;

      px = 30 + band.px.start + (band.px.width * (iscn - band.iscn.start)/(band.iscn.stop - band.iscn.start));

      return px;
    }
  }

  throw new Error(
    "Base pair out of range.  " +
    "bp: " + bp + "; length of chr" + chr.name + ": " + band.bp.stop
  );

};

/**
* Converts base pair coordinates to pixel offsets.
* Bp-to-pixel scales differ among cytogenetic bands.
*/
Ideogram.prototype.convertPxToBp = function(chr, px) {

  var i, band, prevBand, bpToIscnScale, iscn;

  for (i = 0; i < chr.bands.length; i++) {
    band = chr.bands[i];
    if (px >= band.px.start && px <= band.px.stop) {

      pxToIscnScale = (band.iscn.stop - band.iscn.start)/(band.px.stop - band.px.start);
      iscn = band.iscn.start + (px - band.px.start) * pxToIscnScale;

      bp = band.bp.start + ((band.bp.stop - band.bp.start) * (iscn - band.iscn.start)/(band.iscn.stop - band.iscn.start));

      return Math.round(bp);
    }
  }

  throw new Error(
    "Pixel out of range.  " +
    "px: " + bp + "; length of chr" + chr.name + ": " + band.px.stop
  );

};

/**
* Draws a trapezoid connecting a genomic range on
* one chromosome to a genomic range on another chromosome;
* a syntenic region.
*/
Ideogram.prototype.drawSynteny = function(syntenicRegions) {

  var t0 = new Date().getTime();

  var r1, r2,
      c1Box, c2Box,
      chr1Plane, chr2Plane,
      polygon,
      region,
      syntenies, synteny,
      i, svg, color, opacity,
      regionID,
      ideo = this;

  syntenies = d3.select("svg")
    .insert("g", ":first-child")
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

    r1.startPx = this.convertBpToPx(r1.chr, r1.start);
    r1.stopPx = this.convertBpToPx(r1.chr, r1.stop);
    r2.startPx = this.convertBpToPx(r2.chr, r2.start);
    r2.stopPx = this.convertBpToPx(r2.chr, r2.stop);

    c1Box = document.querySelectorAll("#" + r1.chr.id + " path")[0].getBBox();
    c2Box = document.querySelectorAll("#" + r2.chr.id + " path")[0].getBBox();

    chr1Plane = c1Box.y - 31;
    chr2Plane = c2Box.y - 28;

    regionID = (
      r1.chr.id + "_" + r1.start + "_" + r1.stop + "_" +
      "__" +
      r2.chr.id + "_" + r2.start + "_" + r2.stop
    );

    syntenicRegion = syntenies.append("g")
      .attr("class", "syntenicRegion")
      .attr("id", regionID)
      .on("click", function() {

        var activeRegion = this;
        var others = d3.selectAll(".syntenicRegion")
          .filter(function(d, i) {
            return (this !== activeRegion);
          });

        others.classed("hidden", !others.classed("hidden"));

      })
      .on("mouseover", function() {
        var activeRegion = this;
        d3.selectAll(".syntenicRegion")
          .filter(function(d, i) {
            return (this !== activeRegion);
          })
          .classed("ghost", true);
      })
      .on("mouseout", function() {
        d3.selectAll(".syntenicRegion").classed("ghost", false);
      });


    syntenicRegion.append("polygon")
      .attr("points",
        chr1Plane + ', ' + r1.startPx + ' ' +
        chr1Plane + ', ' + r1.stopPx + ' ' +
        chr2Plane + ', ' + r2.stopPx + ' ' +
        chr2Plane + ', ' + r2.startPx
      )
      .attr('style', "fill: " + color + "; fill-opacity: " + opacity);

    syntenicRegion.append("line")
      .attr("class", "syntenyBorder")
      .attr("x1", chr1Plane)
      .attr("x2", chr2Plane)
      .attr("y1", r1.startPx)
      .attr("y2", r2.startPx);

    syntenicRegion.append("line")
      .attr("class", "syntenyBorder")
      .attr("x1", chr1Plane)
      .attr("x2", chr2Plane)
      .attr("y1", r1.stopPx)
      .attr("y2", r2.stopPx);
  }

  var t1 = new Date().getTime();
  if (ideo.debug) {
    console.log("Time in drawSyntenicRegions: " + (t1 - t0) + " ms");
  }
};

/**
* Initializes various annotation settings.  Constructor help function.
*/
Ideogram.prototype.initAnnotSettings = function() {

  if (this.config.annotationsPath || this.config.localAnnotationsPath
    || this.annots || this.config.annotations) {

    if (!this.config.annotationHeight) {
      var annotHeight = Math.round(this.config.chrHeight/100);
      this.config.annotationHeight = annotHeight;
    }

    if (this.config.annotationTracks) {
      this.config.numAnnotTracks = this.config.annotationTracks.length;
    } else {
      this.config.numAnnotTracks = 1;
    }
    this.config.annotTracksHeight = this.config.annotationHeight * this.config.numAnnotTracks;

    if (typeof this.config.barWidth === "undefined") {
      this.config.barWidth = 3;
    }

  } else {
    this.config.annotTracksHeight = 0;
  }

  if (typeof this.config.annotationsColor === "undefined") {
    this.config.annotationsColor = "#F00";
  }

};

/**
* Draws annotations defined by user
*/
Ideogram.prototype.drawAnnots = function(friendlyAnnots) {

  var ideo = this,
      i, j, annot,
      rawAnnots = [],
      rawAnnot, keys,
      chr,
      chrs = ideo.chromosomes[ideo.config.taxid]; // TODO: multiorganism

  // Occurs when filtering
  if ("annots" in friendlyAnnots[0]) {
    return ideo.drawProcessedAnnots(friendlyAnnots);
  }

  for (chr in chrs) {
    rawAnnots.push({"chr": chr, "annots": []});
  }

  for (i = 0; i < friendlyAnnots.length; i++) {
    annot = friendlyAnnots[i];

    for (j = 0; j < rawAnnots.length; j++) {
      if (annot.chr === rawAnnots[j].chr) {
        rawAnnot = [
          annot.name,
          annot.start,
          annot.stop - annot.start
        ];
        if ("color" in annot) {
          rawAnnot.push(annot.color);
        }
        if ("shape" in annot) {
          rawAnnot.push(annot.shape);
        }
        rawAnnots[j]["annots"].push(rawAnnot);
        break;
      }
    }
  }

  keys = ["name", "start", "length"];
  if ("color" in friendlyAnnots[0]) {
    keys.push("color");
  }
  if ("shape" in friendlyAnnots[0]) {
    keys.push("shape");
  }
  ideo.rawAnnots = {"keys": keys,  "annots": rawAnnots};

  ideo.annots = ideo.processAnnotData(ideo.rawAnnots);

  ideo.drawProcessedAnnots(ideo.annots);

};

/**
* Proccesses genome annotation data.
* Genome annotations represent features like a gene, SNP, etc. as
* a small graphical object on or beside a chromosome.
* Converts raw annotation data from server, which is structured as
* an array of arrays, into a more verbose data structure consisting
* of an array of objects.
* Also adds pixel offset information.
*/
Ideogram.prototype.processAnnotData = function(rawAnnots) {

  var keys = rawAnnots.keys,
      rawAnnots = rawAnnots.annots,
      i, j, annot, annots, rawAnnot, annotsByChr,
      chr, start, stop,
      chrModel, ra,
      startPx, stopPx, px,
      trackIndex, color,
      ideo = this;

  annots = [];

  for (i = 0; i < rawAnnots.length; i++) {
    annotsByChr = rawAnnots[i];

    annots.push({"chr": annotsByChr.chr, "annots": []});

    for (j = 0; j < annotsByChr.annots.length; j++) {

      chr = annotsByChr.chr;
      ra = annotsByChr.annots[j];
      annot = {};

      for (var k = 0; k < keys.length; k++) {
        annot[keys[k]] = ra[k];
      }

      annot['stop'] = annot.start + annot.length;

      chrModel = ideo.chromosomes["9606"][chr];

      startPx = ideo.convertBpToPx(chrModel, annot.start);
      stopPx = ideo.convertBpToPx(chrModel, annot.stop);

      px = Math.round((startPx + stopPx)/2) - 28;

      color = ideo.config.annotationsColor;
      if (ideo.config.annotationTracks) {
        annot['trackIndex'] = ra[3];
        color = ideo.config.annotationTracks[annot.trackIndex].color;
      } else {
        annot['trackIndex'] = 0;
      }

      if ('color' in annot) {
        color = annot['color'];
      }

      annot['chr'] = chr;
      annot['chrIndex'] = i;
      annot['px'] = px;
      annot['color'] = color;

      annots[i]["annots"].push(annot);
    }
  }

  return annots;

};

/*
* Can be used for bar chart or sparkline
*/
Ideogram.prototype.getHistogramBars = function(annots) {

  var t0 = new Date().getTime();

  var i, j, chrs, chr,
      chrModels, chrPxStop, px,
      chrAnnots, chrName, chrIndex, annot, start, stop,
      bars, bar, barPx, nextBarPx, barIndex, barWidth,
      maxAnnotsPerBar, barHeight, color,
      firstGet = false,
      histogramScaling,
      ideo = this;

  bars = [];

  barWidth = ideo.config.barWidth;
  chrModels = ideo.chromosomes[ideo.config.taxid];
  color = ideo.config.annotationsColor;

  if ("histogramScaling" in ideo.config) {
      histogramScaling = ideo.config.histogramScaling;
  } else {
    histogramScaling = "relative";
  }

  if (typeof ideo.maxAnnotsPerBar === "undefined") {
      ideo.maxAnnotsPerBar = {};
      firstGet = true;
  }

  for (chr in chrModels) {
    chrModel = chrModels[chr];
    chrIndex = chrModel.chrIndex;
    lastBand = chrModel["bands"][chrModel["bands"].length - 1];
    chrPxStop = lastBand.px.stop;
    numBins = Math.round(chrPxStop / barWidth);
    bar = {"chr": chr, "annots": []};
    for (i = 0; i < numBins; i++) {
      px = i*barWidth - ideo.bump;
      bp = ideo.convertPxToBp(chrModel, px + ideo.bump);
      bar["annots"].push({
        "bp": bp,
        "px": px - ideo.bump,
        "count": 0,
        "chrIndex": chrIndex,
        "chrName": chr,
        "color": color,
        "annots": []
      });
    }
    bars.push(bar);
  }

  for (chr in annots) {
    chrAnnots = annots[chr].annots;
    chrName = annots[chr].chr;
    chrModel = chrModels[chrName];
    chrIndex = chrModel.chrIndex - 1;
    barAnnots = bars[chrIndex]["annots"];
    for (i = 0; i < chrAnnots.length; i++) {
      annot = chrAnnots[i];
      px = annot.px - ideo.bump;
      for (j = 0; j < barAnnots.length; j++) {
        barPx = barAnnots[j].px;
        nextBarPx = barPx + barWidth;
        if (j == barAnnots.length - 1) {
          nextBarPx += barWidth;
        }
        if (px >= barPx && px < nextBarPx) {
          bars[chrIndex]["annots"][j]["count"] += 1;
          bars[chrIndex]["annots"][j]["annots"].push(annot);
          break;
        }
      }
    }
  }

  if (firstGet == true || histogramScaling == "relative") {
    maxAnnotsPerBar = 0;
    for (i = 0; i < bars.length; i++) {
      annots = bars[i]["annots"];
      for (j = 0; j < annots.length; j++) {
        barCount = annots[j]["count"];
        if (barCount > maxAnnotsPerBar) {
          maxAnnotsPerBar = barCount;
        }
      }
    }
    ideo.maxAnnotsPerBar[chr] = maxAnnotsPerBar;
  }

  // Set each bar's height to be proportional to
  // the height of the bar with the most annotations
  for (i = 0; i < bars.length; i++) {
    annots = bars[i]["annots"];
    for (j = 0; j < annots.length; j++) {
      barCount = annots[j]["count"];
      height = (barCount/ideo.maxAnnotsPerBar[chr]) * ideo.config.chrMargin;
      //console.log(height)
      bars[i]["annots"][j]["height"] = height;
    }
  }

  var t1 = new Date().getTime();
  if (ideo.debug) {
    console.log("Time spent in getHistogramBars: " + (t1 - t0) + " ms");
  }

  ideo.bars = bars;

  return bars;

};


/**
* Draws genome annotations on chromosomes.
* Annotations can be rendered as either overlaid directly
* on a chromosome, or along one or more "tracks"
* running parallel to each chromosome.
*/
Ideogram.prototype.drawProcessedAnnots = function(annots) {

  var chrMargin, chrWidth, layout,
      annotHeight, triangle, circle, r, chrAnnot,
      x1, x2, y1, y2,
      ideo = this;

  chrMargin = this.config.chrMargin;
  chrWidth = this.config.chrWidth;

  layout = "tracks";
  if (this.config.annotationsLayout) {
    layout = this.config.annotationsLayout;
  }

  if (layout === "histogram") {
    annots = ideo.getHistogramBars(annots);
  }

  annotHeight = ideo.config.annotationHeight;

  triangle = 'l -' + annotHeight + ' ' + (2*annotHeight) + ' l ' + (2*annotHeight) + ' 0 z';

  // From http://stackoverflow.com/a/10477334, with a minor change ("m -r, r")
  // Circles are supported natively via <circle>, but having it as a path
  // simplifies handling triangles, circles and other shapes in the same
  // D3 call
  r = annotHeight;
  circle =
    'm -' + r  + ', ' + r +
    'a ' + r + ',' + r + ' 0 1,0 ' + (r * 2) + ',0' +
    'a ' + r + ',' + r + ' 0 1,0 -' + (r * 2) + ',0';

  chrAnnot = d3.selectAll(".chromosome")
    .data(annots)
      .selectAll("path.annot")
      .data(function(d) {
        return d["annots"];
      })
      .enter();

  if (layout === "tracks") {

    chrAnnot
      .append("g")
      .attr("id", function(d, i) { return d.id; })
      .attr("class", "annot")
      .attr("transform", function(d) {
        var y = (d.chrIndex + 1) * chrMargin + chrWidth + (d.trackIndex * annotHeight * 2);
        return "translate(" + d.px + "," + y + ")";
      })
      .append("path")
      .attr("d", function(d) {
          if (!d.shape || d.shape === "triangle") {
            return "m0,0" + triangle;
          } else if (d.shape === "circle") {
            return circle;
          }
      })
      .attr("fill", function(d) { return d.color; });

    } else if (layout === "overlay") {
      // Overlaid annotations appear directly on chromosomes

      chrAnnot.append("polygon")
        .attr("id", function(d, i) { return d.id; })
        .attr("class", "annot")
        .attr("points", function(d) {

          x1 = d.px - 0.5;
          x2 = d.px + 0.5;
          y1 = (d.chrIndex + 1) * (chrMargin) + chrWidth;
          y2 = (d.chrIndex + 1) * (chrMargin);

          return (
            x1 + "," + y1 + " " +
            x2 + "," + y1 + " " +
            x2 + "," + y2 + " " +
            x1 + "," + y2
          );

        })
        .attr("fill", function(d) { return d.color; });

    } else if (layout === "histogram") {

      chrAnnot.append("polygon")
        //.attr("id", function(d, i) { return d.id; })
        .attr("class", "annot")
        .attr("points", function(d) {

          x1 = d.px + ideo.bump;
          x2 = d.px + ideo.config.barWidth + ideo.bump;
          y1 = (d.chrIndex) * (chrMargin) + chrWidth;
          y2 = (d.chrIndex) * (chrMargin) + chrWidth + d.height;

          var thisChrWidth = ideo.chromosomesArray[d.chrIndex - 1].width;

          if (x2 > thisChrWidth) {
            x2 = thisChrWidth;
          }

          return (
            x1 + "," + y1 + " " +
            x2 + "," + y1 + " " +
            x2 + "," + y2 + " " +
            x1 + "," + y2
          );

        })
        .attr("fill", function(d) { return d.color; });

    }

  if (ideo.onDrawAnnotsCallback) {
    ideo.onDrawAnnotsCallback();
  }
};


Ideogram.prototype.putChromosomesInRows = function() {

    var ideo = this,
        rows = ideo.config.rows,
        chrs,
        chrsPerRow,
        rowIndex, rowIndexStop, range,
        riCorrection,
        rowHeight, chrIndex, chrWidth, chrMargin;

    chrsPerRow = Math.floor(ideo.numChromosomes/rows);

    riCorrection = 0;
    if (d3.select("svg > *").nodes()[0].tagName !== "g") {
      // Accounts for cross-browser differences in handling of nth-child
      riCorrection = 2;
    }

    for (var i = 1; i < rows; i++) {

      rowIndex = (chrsPerRow * i) + 1 + riCorrection;
      rowIndexStop = rowIndex + chrsPerRow;
      range = "nth-child(n+" + rowIndex + "):nth-child(-n+" + rowIndexStop + ")";

      rowHeight = ideo.config.chrHeight + 20;

      chrIndex = rowIndex + 1 - riCorrection;
      chrWidth = ideo.config.chrWidth;
      chrMargin = ideo.config.chrMargin * chrIndex;

      if (!ideo.config.showBandLabels) {
        chrIndex += 2;
      }

      if (ideo.config.showChromosomeLabels) {
        rowHeight += 12; // TODO: Account for variable font size
      }

      // Similar to "tPadding" in other contexts
      rowWidth = ((chrWidth-4)*chrIndex) + 8 + chrMargin;
      //rowWidth = 6*chrIndex - 57.24 + rowWidth;

      d3.selectAll("#_ideogram .chromosome:" + range)
        .attr("transform", function(d, j) {

          var currentTransform, translation;

          currentTransform = d3.select(this).attr("transform");
          translation = "translate(" + rowHeight + ", " + rowWidth + ")";

          return currentTransform + translation;
        });
    }
};

Ideogram.prototype.onBrushMove = function() {
  call(this.onBrushMoveCallback);
};

Ideogram.prototype.createBrush = function(from, to) {

  var ideo = this,
      width = ideo.config.chrWidth + 6.5,
      length = ideo.config.chrHeight,
      chr = ideo.chromosomesArray[0],
      chrLengthBp = chr.bands[chr.bands.length - 1].bp.stop,
      x, x0, x1,
      y,
      domain = [0],
      range = [0],
      band;

  for (var i = 0; i < chr.bands.length; i++) {
    band = chr.bands[i];
    domain.push(band.bp.stop);
    range.push(band.px.stop);
  }

  x = d3.scaleLinear().domain(domain).range(range);
  y = d3.select(".band").nodes()[0].getBBox().y - 3.25;

  if (typeof from === "undefined") {
    from = Math.floor(chrLengthBp/10);
  }

  if (typeof right === "undefined") {
    to = Math.ceil(from*2);
  }

  x0 = ideo.convertBpToPx(chr, from);
  x1 = ideo.convertBpToPx(chr, to);

  ideo.selectedRegion = {"from": from, "to": to, "extent": (to - from)};

  ideo.brush = d3.brushX()
    .extent([[0, 0], [length, width]])
    .on("brush", onBrushMove);

  var brushg = d3.select("#_ideogram").append("g")
    .attr("class", "brush")
    .attr("transform", "translate(0, " + y + ")")
    .call(ideo.brush)
    .call(ideo.brush.move, [x0, x1]);

  function onBrushMove() {

    var extent = d3.event.selection.map(x.invert),
        from = Math.floor(extent[0]),
        to = Math.ceil(extent[1]);

    ideo.selectedRegion = {"from": from, "to": to, "extent": (to - from)};

    if (ideo.onBrushMove) {
      ideo.onBrushMoveCallback();
    }
    //console.log(ideo.selectedRegion)
  }
};

/**
* Called when Ideogram has finished initializing.
* Accounts for certain ideogram properties not being set until
* asynchronous requests succeed, etc.
*/
Ideogram.prototype.onLoad = function() {

  call(this.onLoadCallback);
};

Ideogram.prototype.onDrawAnnots = function() {
  call(this.onDrawAnnotsCallback);
};


Ideogram.prototype.getBandColorGradients = function() {

  var color, colors,
      stain, color1, color2, color3,
      css,
      gradients = "";

  colors = [
    ["gneg", "#FFF", "#FFF", "#DDD"],
    ["gpos25", "#C8C8C8", "#DDD", "#BBB"],
    ["gpos33", "#BBB", "#BBB", "#AAA"],
    ["gpos50", "#999", "#AAA", "#888"],
    ["gpos66", "#888", "#888", "#666"],
    ["gpos75", "#777", "#777", "#444"],
    ["gpos100", "#444", "#666", "#000"],
    ["acen", "#FEE", "#FEE", "#FDD"],
    ["noBands", "#BBB", "#BBB", "#AAA"]
  ];

  for (var i = 0; i < colors.length; i++) {
    stain = colors[i][0];
    color1 = colors[i][1];
    color2 = colors[i][2];
    color3 = colors[i][3];
    gradients +=
      '<linearGradient id="' + stain + '" x1="0%" y1="0%" x2="0%" y2="100%">';
    if (stain == "gneg") {
      gradients +=
        '<stop offset="70%" stop-color="' + color2 + '" />' +
        '<stop offset="95%" stop-color="' + color3 + '" />' +
        '<stop offset="100%" stop-color="' + color1 + '" />';
    } else {
      gradients +=
        '<stop offset="5%" stop-color="' + color1 + '" />' +
        '<stop offset="15%" stop-color="' + color2 + '" />' +
        '<stop offset="60%" stop-color="' + color3 + '" />';
    }
    gradients +=
      '</linearGradient>';
  }

  gradients +=
    '<pattern id="stalk" width="2" height="1" patternUnits="userSpaceOnUse" ' +
      'patternTransform="rotate(30 0 0)">' +
      '<rect x="0" y="0" width="10" height="2" fill="#CCE" /> ' +
       '<line x1="0" y1="0" x2="0" y2="100%" style="stroke:#88B; stroke-width:0.7;" />' +
    '</pattern>' +
    '<pattern id="gvar" width="2" height="1" patternUnits="userSpaceOnUse" ' +
      'patternTransform="rotate(-30 0 0)">' +
      '<rect x="0" y="0" width="10" height="2" fill="#DDF" /> ' +
       '<line x1="0" y1="0" x2="0" y2="100%" style="stroke:#99C; stroke-width:0.7;" />' +
    '</pattern>';

  gradients = "<defs>" + gradients + "</defs>";
  css = "<style>" +
    '.gneg {fill: url("#gneg")} ' +
    '.gpos25 {fill: url("#gpos25")} ' +
    '.gpos33 {fill: url("#gpos33")} ' +
    '.gpos50 {fill: url("#gpos50")} ' +
    '.gpos66 {fill: url("#gpos66")} ' +
    '.gpos75 {fill: url("#gpos75")} ' +
    '.gpos100 {fill: url("#gpos100")} ' +
    '.acen {fill: url("#acen")} ' +
    '.stalk {fill: url("#stalk")} ' +
    '.gvar {fill: url("#gvar")} ' +
    '.noBands {fill: url("#noBands")} ' +
  '</style>';
  gradients = css + gradients;

  //alert(gradients)

  return gradients;
};


/*
  Returns an NCBI taxonomy identifier (taxid) for the configured organism
*/
Ideogram.prototype.getTaxidFromEutils = function(callback) {

  var organism, taxonomySearch, taxid,
      ideo = this;

  organism = ideo.config.organism;

  taxonomySearch = ideo.esearch + "&db=taxonomy&term=" + organism;

  d3.json(taxonomySearch, function(data) {
    taxid = data.esearchresult.idlist[0];
    return callback(taxid)
  });
}


/**
* Returns an array of taxids for the current ideogram
* Also sets configuration parameters related to taxid(s), whether ideogram is
* multiorganism, and adjusts chromosomes parameters as needed
**/
Ideogram.prototype.getTaxids = function(callback) {

  var ideo = this,
    taxid, taxids,
    org, orgs, i,
    taxidInit, tmpChrs,
    assembly, chromosomes,
    multiorganism,
    fetchTaxid = true;

  taxidInit = "taxid" in ideo.config;

  ideo.config.multiorganism = (
    ("organism" in ideo.config && ideo.config.organism instanceof Array) ||
    (taxidInit && ideo.config.taxid instanceof Array)
  );

  multiorganism = ideo.config.multiorganism;

  if ("organism" in ideo.config) {
    // Ideogram instance was constructed using common organism name(s)
    if (multiorganism) {
      orgs = ideo.config.organism;
    } else {
      orgs = [ideo.config.organism];
    }

    taxids = [];
    tmpChrs = {};
    for (i = 0; i < orgs.length; i++) {
      // Gets a list of taxids from common organism names
      org = orgs[i];
      for (taxid in ideo.organisms) {
        if (ideo.organisms[taxid]["commonName"].toLowerCase() === org) {
          taxids.push(taxid);
          if (multiorganism) {
            // Adjusts 'chromosomes' configuration parameter to make object
            // keys use taxid instead of common organism name
            tmpChrs[taxid] = ideo.config.chromosomes[org];
          }
        }
      }
    }

    if (taxids.length == 0) {
      promise = new Promise(function(resolve, reject) {
        ideo.getTaxidFromEutils(resolve);
      })
      promise.then(function(data){

        var organism = ideo.config.organism,
            dataDir = ideo.config.dataDir,
            urlOrg = organism.replace(" ", "-");

        taxid = data;
        taxids.push(taxid);

        ideo.config.taxids = taxids;
        ideo.organisms[taxid] = {
          "commonName": "",
          "scientificName": organism,
          "scientificNameAbbr": "",
        }

        var chromosomesUrl = dataDir + "chromosomes/" + urlOrg + ".json";

        var promise = d3.promise.json(chromosomesUrl);

        return promise
          .then(
            function(data) {
              // Check if chromosome data exists locally.
              // This is used for pre-processed centromere data,
              // which is not accessible via EUtils.  See get_chromosomes.py.

              var asmAndChrArray = [],
                  chromosomes;
              asmAndChrArray.push(data.assemblyaccession);
              chromosomes = data.chromosomes.sort(ideo.sortChromosomes);
              asmAndChrArray.push(chromosomes);
              ideo.coordinateSystem = "bp";
              return asmAndChrArray
            },
            function(error) {
              return new Promise(function(resolve, reject) {
                ideo.coordinateSystem = "bp";
                ideo.getAssemblyAndChromosomesFromEutils(resolve);
              })
            }
          )
      })
      .then(function(asmChrArray) {
        assembly = asmChrArray[0];
        chromosomes = asmChrArray[1];

        ideo.config.chromosomes = chromosomes;
        ideo.organisms[taxid]["assemblies"] = {
          "default": assembly
        }

        callback(taxids);
      });
    } else {

      ideo.config.taxids = taxids;
      if (multiorganism) {
        ideo.config.chromosomes = tmpChrs;
      }

      callback(taxids);
    }
  } else {

    if (multiorganism) {
      ideo.coordinateSystem = "bp";
      if (taxidInit) {
        taxids = ideo.config.taxid;
      }
    } else {
      if (taxidInit) {
        taxids = [ideo.config.taxid];
      }
      ideo.config.taxids = taxids;
    }

    callback(taxids);
  }
};

Ideogram.prototype.sortChromosomes = function(a, b) {

  var aIsNuclear = a.type === "nuclear",
      bIsNuclear = b.type === "nuclear",
      aIsCP = a.type === "chloroplast",
      bIsCP = b.type === "chloroplast",
      aIsMT = a.type === "mitochondrion",
      bIsMT = b.type === "mitochondrion",
      aIsPlastid = aIsMT && a.name !== "MT", // e.g. B1 in rice genome GCF_001433935.1
      bIsPlastid = bIsMT && b.name !== "MT";

    if (aIsNuclear && bIsNuclear) {
      return naturalSort(a.name, b.name);
    } else if (!aIsNuclear && bIsNuclear) {
      return 1;
    } else if (aIsMT && bIsCP) {
      return 1;
    } else if (aIsCP && bIsMT) {
      return -1;
    } else if (!aIsMT && !aIsCP && (bIsMT || bIsCP)) {
      return -1;
    }

}

/**
  Returns names and lengths of chromosomes for an organism's best-known
  genome assembly.  Gets data from NCBI EUtils web API.
*/
Ideogram.prototype.getAssemblyAndChromosomesFromEutils = function(callback) {

    var asmAndChrArray, // [assembly_accession, chromosome_objects_array]
      assemblyAccession, chromosomes, asmSearch,
      asmUid, asmSummary,
      rsUid, nuccoreLink,
      links, ntSummary,
      results, result, cnIndex, chrName, chrLength, chromosome, type,
      ideo = this;

    organism = ideo.config.organism;

    asmAndChrArray = [];
    chromosomes = [];

    asmSearch =
      ideo.esearch +
      "&db=assembly" +
      "&term=%22" + organism + "%22[organism]" +
      "AND%20(%22latest%20refseq%22[filter])%20AND%20(%22chromosome%20level%22[filter]%20OR%20%22complete%20genome%22[filter])";

    var promise = d3.promise.json(asmSearch);

    promise
      .then(function(data) {

        // NCBI Assembly database's internal identifier (uid) for this assembly
        asmUid = data.esearchresult.idlist[0];
        asmSummary = ideo.esummary + "&db=assembly&id=" + asmUid;

        return d3.promise.json(asmSummary);
      })
      .then(function(data) {

        // RefSeq UID for this assembly
        rsUid = data.result[asmUid].rsuid;
        assemblyAccession = data.result[asmUid].assemblyaccession;

        asmAndChrArray.push(assemblyAccession);

        // Get a list of IDs for the chromosomes in this genome.
        //
        // This information does not seem to be available from well-known
        // NCBI databases like Assembly or Nucleotide, so we use GenColl,
        // a lesser-known NCBI database.
        nuccoreLink = ideo.elink + "&db=nuccore&linkname=gencoll_nuccore_chr&from_uid=" + rsUid;

        return d3.promise.json(nuccoreLink);
      })
      .then(function(data) {

        links = data.linksets[0].linksetdbs[0].links.join(",");
        ntSummary = ideo.esummary + "&db=nucleotide&id=" + links;

        return d3.promise.json(ntSummary);
      })
      .then(function(data) {

        results = data.result;

        for (var x in results) {

          result = results[x];

          // omit list of reult uids
          if (x === "uids") {
            continue;
          }

          if (result.genome === "mitochondrion") {
            if (ideo.config.showNonNuclearChromosomes) {
              type = result.genome;
              cnIndex = result.subtype.split("|").indexOf("plasmid");
              if (cnIndex === -1) {
                chrName = "MT";
              } else {
                // Seen in e.g. rice genome IRGSP-1.0 (GCF_001433935.1),
                // From https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?retmode=json&db=nucleotide&id=996703432,996703431,996703430,996703429,996703428,996703427,996703426,996703425,996703424,996703423,996703422,996703421,194033210,11466763,7524755
                  // "genome": "mitochondrion",
                  // "subtype": "cell_line|plasmid",
                  // "subname": "A-58 CMS|B1",
                chrName = result.subname.split("|")[cnIndex];
              }
            } else {
              continue;
            }
          } else if (result.genome === "chloroplast" || result.genome === "plastid") {
            type = "chloroplast";
            // Plastid encountered with rice genome IRGSP-1.0 (GCF_001433935.1)
            if (ideo.config.showNonNuclearChromosomes) {
              chrName = "CP";
            } else {
              continue;
            }
          } else {
            type = "nuclear";
            cnIndex = result.subtype.split("|").indexOf("chromosome");

            chrName = result.subname.split("|")[cnIndex];
            if (typeof chrName !== "undefined" && chrName.substr(0, 3) === "chr") {
              // Convert "chr12" to "12", e.g. for banana (GCF_000313855.2)
              chrName = chrName.substr(3);
            }
          }

          chrLength = result.slen;

          chromosome = {
            "name": chrName,
            "length": chrLength,
            "type": type
          };

          chromosomes.push(chromosome);
        }

        chromosomes = chromosomes.sort(ideo.sortChromosomes);
        asmAndChrArray.push(chromosomes)

        return callback(asmAndChrArray);
    });

};

Ideogram.prototype.initDrawChromosomes = function(bandsArray) {

  var ideo = this,
      taxids = ideo.config.taxids,
      taxid,
      chrIndex = 0,
      i, j, chrs, chromosome, chromosomeModel
      tmpChrs = [];

  for (i = 0; i < taxids.length; i++) {

    taxid = taxids[i];
    chrs = ideo.config.chromosomes[taxid];

    ideo.chromosomes[taxid] = {};

    for (j = 0; j < chrs.length; j++) {

      chromosome = chrs[j];
      bands = bandsArray[chrIndex];
      chrIndex += 1;

      chromosomeModel = ideo.getChromosomeModel(bands, chromosome, taxid, chrIndex);

      ideo.chromosomes[taxid][chromosome] = chromosomeModel;
      ideo.chromosomesArray.push(chromosomeModel);

      ideo.drawChromosome(chromosomeModel, chrIndex);

      if (typeof bands === "undefined") {
        ideo.chromosomes[taxid][chromosome.name] = chromosomeModel;
        tmpChrs[j] = chromosomeModel.name;
      }
    }
    if (typeof bands === "undefined") {
      ideo.config.chromosomes[taxid] = tmpChrs;
    }

    if (ideo.config.showBandLabels === true) {
        ideo.drawBandLabels(ideo.chromosomes);
    }

  }
};


/**
* Initializes an ideogram.
* Sets some high-level properties based on instance configuration,
* fetches band and annotation data if needed, and
* writes an SVG element to the document to contain the ideogram
*
*/
Ideogram.prototype.init = function() {

  var bandDataFile, bandDataFileNames,
      taxid, taxids, i, svgClass,
      chrs;

  var ideo = this;

  var t0 = new Date().getTime();

  var bandsArray = [],
      maxLength = 0,
      numBandDataResponses = 0,
      resolution = this.config.resolution,
      accession;

  var promise = new Promise(function(resolve, reject) {
    ideo.getTaxids(resolve);
  })

  promise.then(function(taxids) {

  taxid = taxids[0]
  ideo.config.taxid = taxid;
  ideo.config.taxids = taxids;

  for (i = 0; i < taxids.length; i++) {
    taxid = taxids[i];

    if (!ideo.config.assembly) {
      ideo.config.assembly = "default";
    }
    accession = ideo.organisms[taxid]["assemblies"][ideo.config.assembly];

    bandDataFileNames = {
      // Homo sapiens (human)
      "9606": "native/ideogram_9606_" + accession + "_" + resolution + "_V1.js",
      //"9606": "ncbi/ideogram_9606_" + accession + "_" + resolution + "_V1.tsv",

      // Mus musculus (mouse)
      "10090": "native/ideogram_10090_" + accession + "_NA_V2.js",

      // Drosophila melanogaster (fly)
      //"7227": "ucsc/drosophila_melanogaster_dm6.tsv"
    };

    if (typeof chrBands === "undefined" && taxid in bandDataFileNames) {

      d3.request(ideo.config.bandDir + bandDataFileNames[taxid])
        .on("beforesend", function(data) {
          // Ensures correct taxid is processed in response callback; using
          // simply 'taxid' variable gives the last *requested* taxid, which
          // fails when dealing with multiple taxa.
          data.taxid = taxid;
        })
        .get(function(error, data) {
          ideo.bandData[data.taxid] = data.response;
          numBandDataResponses += 1;

          if (numBandDataResponses == taxids.length) {
            processBandData();
            writeContainer();
          }
        });

    } else {
      if (typeof chrBands !== "undefined") {
        // If bands already available,
        // e.g. via <script> tag in initial page load
        ideo.bandData[taxid] = chrBands;
      }
      processBandData();
      writeContainer();
    }


  }
});


  function writeContainer() {

    if (ideo.config.annotationsPath) {
      d3.json(
        ideo.config.annotationsPath, // URL
        function(data) { // Callback
          ideo.rawAnnots = data;
        }
      );
    }

    svgClass = "";
    if (ideo.config.showChromosomeLabels) {
      if (ideo.config.orientation == "horizontal") {
        svgClass += "labeledLeft ";
      } else {
        svgClass += "labeled ";
      }
    }

    if (
      ideo.config.annotationsLayout &&
      ideo.config.annotationsLayout === "overlay"
    ) {
      svgClass += "faint";
    }

    var ideoHeight;

    if (ideo.config.orientation === "vertical") {
      ideoHeight = ideo.config.chrHeight + 40;
      if (ideo.config.rows > 1) {
        ideoHeight = ideo.config.rows * (ideoHeight - 30);
      }
    } else {
      ideoHeight = ideo.config.chrMargin * ideo.numChromosomes + 30;
    }

    var gradients = ideo.getBandColorGradients();

    var svg = d3.select(ideo.config.container)
      .append("svg")
        .attr("id", "_ideogram")
        .attr("class", svgClass)
        .attr("width", "97%")
        .attr("height", ideoHeight)
        .html(gradients);

    finishInit();

  }

  /*
  * Completes default ideogram initialization
  * by calling downstream functions to
  * process raw band data into full JSON objects,
  * render chromosome and cytoband figures and labels,
  * apply initial graphical transformations,
  * hide overlapping band labels, and
  * execute callbacks defined by client code
  */
  function processBandData() {

    var j, k, chromosome, bands, chromosomeModel,
        chrLength, chr,
        bandData, bands, bandsByChr,
        stopType,
        taxid, taxids, chrs, chrsByTaxid;

    bandsArray = [];
    maxLength = 0;

    if (ideo.config.multiorganism === true) {
      ideo.coordinateSystem = "bp";
      taxids = ideo.config.taxids;
      for (i = 0; i < taxids.length; i++) {
        taxid = taxids[i];
      }
    } else {
      if (typeof ideo.config.taxid == "undefined") {
        ideo.config.taxid = ideo.config.taxids[0];
      }
      taxid = ideo.config.taxid;
      taxids = [taxid];
      ideo.config.taxids = taxids;
    }

    if ("chromosomes" in ideo.config) {
      chrs = ideo.config.chromosomes;
    }
    if (ideo.config.multiorganism) {
      chrsByTaxid = chrs;
    }

    ideo.config.chromosomes = {};

    var t0_b = new Date().getTime();

    for (j = 0; j < taxids.length; j++) {

      taxid = taxids[j];

      if (ideo.config.multiorganism) {
        chrs = chrsByTaxid[taxid];
      }

      if (ideo.coordinateSystem === "iscn" || ideo.config.multiorganism) {
        bandData = ideo.bandData[taxid];

        bandsByChr = ideo.getBands(bandData, taxid, chrs);

        chrs = Object.keys(bandsByChr);

        ideo.config.chromosomes[taxid] = chrs.slice();
        ideo.numChromosomes += ideo.config.chromosomes[taxid].length;

        for (k = 0; k < chrs.length; k++) {

          chromosome = chrs[k];
          bands = bandsByChr[chromosome];
          bandsArray.push(bands);

          chrLength = {
            "iscn": bands[bands.length - 1].iscn.stop,
            "bp": bands[bands.length - 1].bp.stop
          };

          if (chrLength.iscn > ideo.maxLength.iscn) {
            ideo.maxLength.iscn = chrLength.iscn;
          }

          if (chrLength.bp > ideo.maxLength.bp) {
            ideo.maxLength.bp = chrLength.bp;
          }
        }
      } else if (ideo.coordinateSystem == "bp"){
        // If lacking band-level data

        ideo.config.chromosomes[taxid] = chrs.slice();
        ideo.numChromosomes += ideo.config.chromosomes[taxid].length;

        for (k = 0; k < chrs.length; k++) {
          chr = chrs[k];
          if (chr.length > ideo.maxLength.bp) {
            ideo.maxLength.bp = chr.length;
          }
        }

      }
    }

    var t1_b = new Date().getTime();
    if (ideo.debug) {
      console.log("Time in processBandData: " + (t1_b - t0_b) + " ms");
    }
}

function finishInit() {

    try {

    var t0_a = new Date().getTime();

    var chrIndex = 0,
        taxids,
        chr, chrs, chrModel, chromosome,
        i, j, m, n;

    ideo.initDrawChromosomes(bandsArray);

    taxids = ideo.config.taxids;

    chrIndex = 0;
    for (m = 0; m < taxids.length; m++) {
      taxid = taxids[m];

      chrs = ideo.config.chromosomes[taxid];

      for (n = 0; n < chrs.length; n++) {

        chrIndex += 1;

        chromosome = chrs[n];

        chrModel = ideo.chromosomes[taxid][chromosome];

        chr = d3.select("#" + chrModel.id);

        ideo.initTransformChromosome(chr, chrIndex);
      }

    }

    // Waits for potentially large annotation dataset
    // to be received by the client, then triggers annotation processing
    if (ideo.config.annotationsPath) {

      function pa() {

        if (typeof timeout !== "undefined") {
          window.clearTimeout(timeout);
        }

        ideo.annots = ideo.processAnnotData(ideo.rawAnnots);
        ideo.drawProcessedAnnots(ideo.annots);

        if (ideo.initCrossFilter) {
          ideo.initCrossFilter();
        }

      }

      if (ideo.rawAnnots) {
        pa();
      } else {
        (function checkAnnotData() {
          timeout = setTimeout(function() {
            if (!ideo.rawAnnots) {
              checkAnnotData();
            } else {
              pa();
            }
            },
            50
          );
        })();
      }
    }

    if (ideo.config.showBandLabels === true) {
      var bandsToShow = ideo.bandsToShow.join(",");

      // d3.selectAll resolves to querySelectorAll (QSA).
      // QSA takes a surprisingly long time to complete,
      // and scales with the number of selectors.
      // Most bands are hidden, so we can optimize by
      // Hiding all bands, then QSA'ing and displaying the
      // relatively few bands that are shown.
      var t0_c = new Date().getTime();
      d3.selectAll(".bandLabel, .bandLabelStalk").style("display", "none");
      d3.selectAll(bandsToShow).style("display", "");
      var t1_c = new Date().getTime();
      if (ideo.debug) {
        console.log("Time in showing bands: " + (t1_c - t0_c) + " ms");
      }

      if (ideo.config.orientation === "vertical") {
        for (var i = 0; i < ideo.chromosomesArray.length; i++) {
          ideo.rotateChromosomeLabels(d3.select("#" + ideo.chromosomesArray[i].id), i);
        }
      }

    }

    if (ideo.config.showChromosomeLabels === true) {
      ideo.drawChromosomeLabels(ideo.chromosomes);
    }

    if (ideo.config.rows > 1) {
      ideo.putChromosomesInRows();
    }

    if (ideo.config.brush === true) {
      ideo.createBrush();
    }

    if (ideo.config.annotations) {
      ideo.drawAnnots(ideo.config.annotations);
    }

    if (ideo.config.armColors) {
      var ac = ideo.config.armColors;
      ideo.colorArms(ac[0], ac[1]);
    }

    var t1_a = new Date().getTime();
    if (ideo.debug) {
      console.log("Time in drawChromosome: " + (t1_a - t0_a) + " ms");
    }

    var t1 = new Date().getTime();
    if (ideo.debug) {
      console.log("Time constructing ideogram: " + (t1 - t0) + " ms");
    }

    if (ideo.onLoadCallback) {
      ideo.onLoadCallback();
    }

    if (!("rotatable" in ideo.config && ideo.config.rotatable === false)) {
      d3.selectAll(".chromosome").on("click", function() {
        ideogram.rotateAndToggleDisplay(this.id);
      });
    } else {
      d3.selectAll(".chromosome").style("cursor", "default");
    }

     } catch (e) {
       console.log(e.stack)
      //  throw e;
    }
  }
};
