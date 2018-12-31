
function getDelimiterTsvLinesAndInit(source, content) {
  var delimiter, tsvLines, init;

  if (typeof chrBands === 'undefined' && source !== 'native') {
    delimiter = /\t/;
    tsvLines = content.split(/\r\n|\n/);
    init = 1;
  } else {
    delimiter = / /;
    if (source === 'native') {
      tsvLines = eval(content);
    } else {
      tsvLines = content;
    }
    init = 0;
  }

  return [delimiter, tsvLines, init];
}

function updateChromosomes(chromosomes) {
  var tmp, i;

  if (chromosomes instanceof Array && typeof chromosomes[0] === 'object') {
    tmp = [];
    for (i = 0; i < chromosomes.length; i++) {
      tmp.push(chromosomes[i].name);
    }
    chromosomes = tmp;
  }

  return chromosomes;
}

function getLineObject(chr, columns, stain, taxid) {
  return {
    chr: chr,
    bp: {
      start: parseInt(columns[5], 10),
      stop: parseInt(columns[6], 10)
    },
    iscn: {
      start: parseInt(columns[3], 10),
      stop: parseInt(columns[4], 10)
    },
    px: {
      start: -1,
      stop: -1,
      width: -1
    },
    name: columns[1] + columns[2],
    stain: stain,
    taxid: taxid
  };
}

function getStain(columns) {
  var stain = columns[7];
  // For e.g. acen and gvar, columns[8] (density) is undefined
  if (columns[8]) stain += columns[8];
  return stain;
}

function updateLines(lines, columns, taxid) {
  var chr, stain, line;

  chr = columns[0];
  if (chr in lines === false) lines[chr] = [];
  
  stain = getStain(columns)

  line = getLineObject(chr, columns, stain, taxid);
  lines[chr].push(line);

  return lines;
}

/**
 * Parses cytogenetic band data from a TSV file, or, if band data is
 * prefetched, from an array
 *
 * NCBI:
 * #chromosome arm band iscn_start iscn_stop bp_start bp_stop stain density
 * ftp://ftp.ncbi.nlm.nih.gov/pub/gdp/ideogram_9606_GCF_000001305.14_550_V1
 */
function parseBands(content, taxid, chromosomes) {
  var delimiter, tsvLines, columns, chr, i, init, source,
    lines = {};

  if (content.slice(0, 15) === 'window.chrBands') source = 'native';
  
  chromosomes = updateChromosomes(chromosomes);

  [delimiter, tsvLines, init] = getDelimiterTsvLinesAndInit(source, content);

  for (i = init; i < tsvLines.length; i++) {
    columns = tsvLines[i].split(delimiter);

    chr = columns[0];

    if (
      typeof (chromosomes) !== 'undefined' &&
      chromosomes.indexOf(chr) === -1
    ) {
      // If a specific set of chromosomes has been requested, and
      // the current chromosome
      continue;
    }

    lines = updateLines(lines, columns, taxid);
  }

  return lines;
}

export {parseBands}