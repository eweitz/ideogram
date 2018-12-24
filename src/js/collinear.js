import * as d3selection from 'd3-selection';

var d3 = Object.assign({}, d3selection);

function collinearizeChromosomes(ideo) {
  var chrSets, translations, i, index, prevChrSet, annotLabelHeight, ideoDom,
    prevWidth, prevX, x, y, chrSet, xBump, hasChrLabels, translations,
    config = ideo.config;

  chrSets = document.querySelectorAll('.chromosome-set-container');
  hasChrLabels = config.showChromosomeLabels;

  annotLabelHeight = 12;

  y = (
    (config.numAnnotTracks * (config.annotationHeight + annotLabelHeight + 4)) -
    config.chrWidth + 1
  );

  // Get pixel coordinates to use for rearrangement
  translations = [];
  for (i = 0; i < chrSets.length; i++) {
    index = (i === 0) ? i : i - 1;
    prevChrSet = ideo.chromosomesArray[index];
    if (i === 0) {
      x = 20;
    } else {
      prevWidth = prevChrSet.width;
      prevX = translations[index][0];
      if (hasChrLabels) {
        xBump = 0.08;
      } else {
        xBump = 2;
      }
      x = Math.round(prevX + prevWidth) + xBump;
    }
    translations.push([x, y]);
  }

  // Rearrange chromosomes from horizontal to collinear
  for (i = 0; i < chrSets.length; i++) {
    chrSet = chrSets[i];
    x = translations[i][0];
    y = translations[i][1];
    if (hasChrLabels) {
      chrSet.querySelector('.chrLabel').setAttribute('y', config.chrWidth*2 + 10)
      chrSet.querySelector('.chrLabel').setAttribute('text-anchor', 'middle')
    }
    chrSet.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    chrSet.querySelector('.chromosome').setAttribute('transform', 'translate(-13, 10)');
  }

  ideoDom = document.querySelector(ideo.selector)
  ideoDom.setAttribute('width', x + 20)
  ideoDom.setAttribute('height', y + config.chrWidth*2 + 20);

  d3.select('#_ideogramTrackLabelContainer').remove();
  d3.select('#_ideogramInnerWrap')
    .insert('div', ':first-child')
    .attr('id', '_ideogramTrackLabelContainer')
    .style('position', 'absolute');
}

export default collinearizeChromosomes;