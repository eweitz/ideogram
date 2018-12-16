function collinearizeChromosomes(ideo) {
  var chrSets, widthOffset, translations, i, index, prevChrSet,
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

  widthOffset = 0;

  // Get pixel coordinates to use for rearrangement
  var translations = [];
  for (i = 0; i < chrSets.length; i++) {
    chrSet = chrSets[i];
    index = (i === 0) ? i : i - 1;
    prevChrSet = chrSets[index];
    prevChrSetRect = prevChrSet.getBoundingClientRect();
    prevChrSetMatrix = prevChrSet.transform.baseVal[0].matrix;
    if (i === 0) {
      x = prevChrSetMatrix.e;
    } else {
      prevWidth = prevChrSetRect.width;
      prevX = translations[index][0];
      widthOffset += prevWidth;
      if (hasChrLabels) {
        prevChrLabel = prevChrSet.querySelector('.chrLabel tspan').innerHTML;
        xBump = (prevChrLabel.length < 2) ? -12 : -17;
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

  document.querySelector(ideo.selector)
    .setAttribute('width', widthOffset + 120);
}

export default collinearizeChromosomes;