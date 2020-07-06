import {d3} from '../lib';
import {Ploidy} from '../ploidy';
import {getLayout} from '../layouts/layout-adapter';

/**
 * If ploidy description is a string, then convert it to the canonical
 * array format.  String ploidyDesc is used when depicting e.g. parental
 * origin each member of chromosome pair in a human genome.
 * See ploidy-basic.html for usage example.
 */
function setPloidy(ideo) {
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
}

function getContainerSvgClass(ideo) {
  var svgClass = '';
  if (ideo.config.showChromosomeLabels) {
    if (ideo.config.orientation === 'horizontal') {
      svgClass += 'labeledLeft ';
    } else {
      svgClass += 'labeled ';
    }
  }

  if (ideo.config.rotatable === false) {
    svgClass += 'no-rotate ';
  }

  if (
    ideo.config.annotationsLayout &&
    ideo.config.annotationsLayout === 'overlay'
  ) {
    svgClass += 'faint';
  }

  return svgClass;
}

/**
 * Write tooltip div setup with default styling.
 */
function writeTooltipContainer(ideo) {
  d3.select(ideo.config.container + ' #_ideogramOuterWrap').append('div')
    .attr('class', '_ideogramTooltip')
    .attr('id', '_ideogramTooltip')
    .style('opacity', 0)
    .style('position', 'fixed')
    .style('text-align', 'center')
    .style('padding', '4px')
    .style('font', '12px sans-serif')
    .style('background', 'white')
    .style('border', '1px solid black')
    .style('border-radius', '5px')
    .style('z-index', '9000');
}

function writeContainerDom(ideo) {

  // Remove any previous container content
  d3.selectAll(ideo.config.container + ' #_ideogramOuterWrap').remove();

  d3.select(ideo.config.container)
    .append('div')
    .attr('id', '_ideogramOuterWrap')
    .append('div')
    .attr('id', '_ideogramTrackLabelContainer')
    .style('position', 'absolute');

  d3.select(ideo.config.container + ' #_ideogramOuterWrap').append('div')
    .attr('id', '_ideogramMiddleWrap') // needed for overflow and scrolling
    .style('position', 'relative')
    .style('overflow-x', 'auto')
    .style('transform', 'translateZ(0)') // add compositing layer for ideogram
    .append('div')
    .attr('id', '_ideogramInnerWrap') // needed for overflow and scrolling
    .append('svg')
    .attr('id', '_ideogram')
    .attr('class', getContainerSvgClass(ideo))
    .attr('width', ideo._layout.getWidth())
    .attr('height', ideo._layout.getHeight())
    .html(ideo.getBandColorGradients());
}

/**
 * Writes the HTML elements that contain this ideogram instance.
 */
function writeContainer(t0) {
  var ideo = this;

  if (ideo.config.annotationsPath) {
    ideo.fetchAnnots(ideo.config.annotationsPath);
  }

  setPloidy(ideo);

  ideo._layout = getLayout(ideo);

  writeContainerDom(ideo);

  ideo.isOnlyIdeogram = document.querySelectorAll('#_ideogram').length === 1;
  writeTooltipContainer(ideo);
  ideo.finishInit(t0);
}

export {writeContainer};
