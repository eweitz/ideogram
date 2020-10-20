import {d3} from '../lib';

/**
 * Optional callback, invoked when annotations are drawn
 */
function onLoadAnnots() {
  call(this.onLoadAnnotsCallback);
}

/**
 * Optional callback, invoked when annotations are drawn
 */
function onDrawAnnots() {
  call(this.onDrawAnnotsCallback);
}

/**
 * Starts a timer that, upon expiring, hides the annotation tooltip.
 *
 * To enable users to copy tooltip content to their clipboard, a timer is
 * used to control when the tooltip disappears.  It starts when the user's
 * cursor leaves the annotation or the tooltip.  If the user moves the cursor
 * back over the annot or tooltip after the timer starts and before it expires,
 * then the timer is cleared.
 */
function startHideAnnotTooltipTimeout() {

  if (this.config.showAnnotTooltip === false) {
    return;
  }

  this.hideAnnotTooltipTimeout = window.setTimeout(function() {
    d3.select('._ideogramTooltip').transition()
      .duration(500)
      .style('opacity', 0)
      .style('pointer-events', 'none');
  }, 250);
}

function renderTooltip(tooltip, content, matrix, yOffset, ideo) {
  tooltip.html(content)
    .style('opacity', 1) // Make tooltip visible
    .style('left', matrix.e + 'px')
    .style('top', (matrix.f - yOffset) + 'px')
    .style('pointer-events', null) // Prevent bug in clicking chromosome
    .on('mouseover', function() {
      clearTimeout(ideo.hideAnnotTooltipTimeout);
    })
    .on('mouseout', function() {
      ideo.startHideAnnotTooltipTimeout();
    });
}

function renderLabel(annot, style, ideo) {

  const id =
    'ideogramLabel_' + annot.chr + '_' + annot.start + '_' + annot.length;

  const background = style.backgroundColor ? style.backgroundColor : '#FFF';
  const borderColor = style.borderColor ? style.borderColor : 'black';

  d3.select(ideo.config.container + ' #_ideogramOuterWrap').append('div')
    .attr('class', '_ideogramLabel')
    .attr('id', id)
    .style('opacity', 1) // Make label visible
    .style('left', style.left + 'px')
    .style('top', style.top + 'px')
    .style('position', 'fixed')
    .style('text-align', 'center')
    .style('padding', '3px')
    .style('font', style.font)
    .style('background', background)
    .style('border', '1px solid ' + borderColor)
    .style('border-radius', '5px')
    .style('z-index', '900')
    .style('pointer-events', null) // Prevent bug in clicking chromosome
    .html(annot.name);
}

function getContentAndYOffset(annot) {
  var content, yOffset, range, displayName;

  range = 'chr' + annot.chr + ':' + annot.start.toLocaleString();
  if (annot.length > 0) {
    // Only show range if stop differs from start
    range += '-' + annot.stop.toLocaleString();
  }
  content = range;
  yOffset = 24;

  if (annot.name) {
    displayName = annot.displayName ? annot.displayName : annot.name;
    content = displayName + '<br/>' + content;
    yOffset += 8;
  }

  return [content, yOffset];
}

/**
 * Optional callback, invoked before showing annotation tooltip
 */
function onWillShowAnnotTooltip(annot) {
  call(this.onWillShowAnnotTooltipCallback, annot);
}

/**
 * Optional callback, invoked on clicking annotation
 */
function onClickAnnot(annot) {
  this.onClickAnnotCallback(annot);
}

/**
 * Compute and return the width of the given text of given font in pixels.
 *
 * @param {String} text The text to be rendered.
 * @param {String} font The CSS font (e.g. "bold 14px verdana").
 *
 * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 */
function getTextWidth(text, font) {
  // re-use canvas object for better performance
  var canvas =
    getTextWidth.canvas ||
    (getTextWidth.canvas = document.createElement('canvas'));
  var context = canvas.getContext('2d');
  context.font = font;
  var metrics = context.measureText(text);
  return metrics.width;
}


/**
 * Shows a label for the given annotation.
 *
 * @param annot {Object} Processed annotation object
 * @param context {Object} "This" of the caller -- an SVG path DOM object
 */
function showAnnotLabel(annotName, backgroundColor, borderColor) {
  var annot, found, annotRect, labelLength,
    ideo = this;

  var found = false;
  ideo.annots.forEach((annotsByChr) => {
    if (found) return;
    annotsByChr.annots.forEach((thisAnnot) => {
      if (found) return;
      if (thisAnnot.name === annotName) {
        annot = thisAnnot;
        found = true;
      }
    });
  });

  annotRect = document.querySelector('#' + annot.id).getBoundingClientRect();
  const font = '11px sans-serif';
  labelLength = getTextWidth(annot.name, font);

  const annotHeight = ideo.config.annotationHeight;
  const left = annotRect.left - annotHeight*2 - labelLength + 5;
  const top = annotRect.top - annotHeight/2;

  const style = {left, top, font, backgroundColor, borderColor};

  renderLabel(annot, style, ideo);
}

/**
 * Shows a tooltip for the given annotation.
 *
 * See notes in startHideAnnotTooltipTimeout about show/hide logic.
 *
 * @param annot {Object} Processed annotation object
 * @param context {Object} "This" of the caller -- an SVG path DOM object
 */
function showAnnotTooltip(annot, context) {
  var matrix, content, yOffset, tooltip,
    cx = Number(context.getAttribute('cx')),
    cy = Number(context.getAttribute('cy')),
    ideo = this;

  if (ideo.config.showAnnotTooltip === false) return;

  clearTimeout(ideo.hideAnnotTooltipTimeout);

  if (ideo.onWillShowAnnotTooltipCallback) {
    annot = ideo.onWillShowAnnotTooltipCallback(annot);
  }

  tooltip = d3.select('._ideogramTooltip');
  tooltip.interrupt(); // Stop any in-progress disapperance

  matrix = context.getScreenCTM().translate(cx, cy);

  [content, yOffset] = getContentAndYOffset(annot);

  renderTooltip(tooltip, content, matrix, yOffset, ideo);
}

export {
  onLoadAnnots, onDrawAnnots, startHideAnnotTooltipTimeout,
  onWillShowAnnotTooltip, showAnnotTooltip, onClickAnnot,
  showAnnotLabel
};
