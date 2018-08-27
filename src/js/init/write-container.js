import * as d3selection from 'd3-selection';

import {Object} from '../lib';
import {Ploidy} from '../ploidy';
import {Layout} from '../layouts/layout';

var d3 = Object.assign({}, d3selection);

/**
 * Writes the HTML elements that contain this ideogram instance.
 */
function writeContainer(bandsArray, taxid, t0) {
  var svgClass,
    ideo = this;

  if (ideo.config.annotationsPath) {
    ideo.fetchAnnots(ideo.config.annotationsPath);
  }

  // If ploidy description is a string, then convert it to the canonical
  // array format.  String ploidyDesc is used when depicting e.g. parental
  // origin each member of chromosome pair in a human genome.
  // See ploidy-basic.html for usage example.
  if (
    'ploidyDesc' in ideo.config &&
    typeof ideo.config.ploidyDesc === 'string'
  ) {
    var tmp = [];
    for (var i = 0; i < ideo.numChromosomes; i++) {
      tmp.push(ideo.config.ploidyDesc);
    }
    ideo.config.ploidyDesc = tmp;
  }
  // Organism ploidy description
  ideo._ploidy = new Ploidy(ideo.config);

  // Chromosome's layout
  ideo._layout = Layout.getInstance(ideo.config, ideo);

  svgClass = '';
  if (ideo.config.showChromosomeLabels) {
    if (ideo.config.orientation === 'horizontal') {
      svgClass += 'labeledLeft ';
    } else {
      svgClass += 'labeled ';
    }
  }

  if (
    ideo.config.annotationsLayout &&
    ideo.config.annotationsLayout === 'overlay'
  ) {
    svgClass += 'faint';
  }

  var gradients = ideo.getBandColorGradients();
  var svgWidth = ideo._layout.getWidth(taxid);
  var svgHeight = ideo._layout.getHeight(taxid);

  d3.select(ideo.config.container)
    .append('div')
    .attr('id', '_ideogramOuterWrap')
    .append('div')
    .attr('id', '_ideogramInnerWrap')
    .append('svg')
    .attr('id', '_ideogram')
    .attr('class', svgClass)
    .attr('width', svgWidth)
    .attr('height', svgHeight)
    .html(gradients);

  ideo.isOnlyIdeogram = document.querySelectorAll('#_ideogram').length === 1;

  // Tooltip div setup w/ default styling.
  d3.select(ideo.config.container + ' #_ideogramOuterWrap').append("div")
    .attr('class', 'tooltip')
    .attr('id', 'tooltip')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('text-align', 'center')
    .style('padding', '4px')
    .style('font', '12px sans-serif')
    .style('background', 'white')
    .style('border', '1px solid black')
    .style('border-radius', '5px');

  ideo.finishInit(bandsArray, t0);
}

export {writeContainer}