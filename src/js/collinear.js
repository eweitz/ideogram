function collinearizeChromosomes(ideo) {
  var chrSets, translations, i, index, prevChrSet,
    prevChrSetRect, prevChrSetMatrix, annotLabelHeight, prevWidth, prevX,
    x, y, chrSet, xBump, hasChrLabels, prevChrLabel,
    config = ideo.config;

  chrSets = document.querySelectorAll('.chromosome-set-container');
  hasChrLabels = config.showChromosomeLabels;

  annotLabelHeight = 12;

  y = (
    (config.numAnnotTracks * (config.annotationHeight + annotLabelHeight)) -
    config.chrWidth + 2
  );

  // Get pixel coordinates to use for rearrangement
  var translations = [];
  for (i = 0; i < chrSets.length; i++) {
    index = (i === 0) ? i : i - 1;
    prevChrSet = ideo.chromosomesArray[index];
    if (i === 0) {
      x = 20;
    } else {
      prevWidth = prevChrSet.width;
      prevX = translations[index][0];
      if (hasChrLabels) {
        prevChrLabel = prevChrSet.name;
        xBump = 0; // xBump likely unneeded
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

  d3.select(ideo.selector)
    .attr('width', x + 20)
    .attr('height', y + config.chrWidth*2 + 20);
}

export default collinearizeChromosomes;