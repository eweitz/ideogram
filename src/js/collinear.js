function collinearizeChromosomes() {
  var chrSets, firstChrSetY, widthOffset, translations, i, index, prevChrSet,
    prevChrSetRect, prevChrSetMatrix, prevChrSetTransform, prevWidth, prevX,
    x, y, chrSet;

  chrSets = document.querySelectorAll('.chromosome-set-container');
  firstChrSetY = chrSets[0].transform.baseVal[0].matrix.f;

  widthOffset = 0;

  // Get pixel coordinates to use for rearrangement
  var translations = [];
  for (i = 0; i < chrSets.length; i++) {
    chrSet = chrSets[i];
    index = (i === 0) ? i : i - 1;
    prevChrSet = chrSets[index];
    prevChrSetRect = prevChrSet.getBoundingClientRect();
    prevChrSetMatrix = prevChrSet.transform.baseVal[0].matrix;
    prevChrSetTransform = {x: prevChrSetMatrix.e, y: prevChrSetMatrix.f};
    if (i === 0) {
      x = prevChrSetMatrix.e;
    } else {
      prevWidth = prevChrSetRect.width;
      prevX = translations[index][0];
      widthOffset += prevWidth;
      x = Math.round(prevX + prevWidth) + 2;
    }
    y = firstChrSetY;
    translations.push([x, y]);
  }

  // Rearrange chromosomes from horizontal to collinear
  for (i = 0; i < chrSets.length; i++) {
    chrSet = chrSets[i];
    x = translations[i][0];
    y = translations[i][1];
    if (ideogram.config.showChromosomeLabels) {
      // Will need special handling for chromosome labels
      chrSet.querySelector('.chrLabel').setAttribute('y', '5')
      chrSet.querySelector('.chrLabel').setAttribute('text-anchor', 'middle')
    }
    chrSet.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    chrSet.querySelector('.chromosome').setAttribute('transform', 'translate(-13, 10)');
  }

  document.querySelector('#_ideogram').setAttribute('width', widthOffset + 120);
}

export default collinearizeChromosomes;