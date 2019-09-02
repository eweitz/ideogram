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

function writeTooltip(tooltip, content, matrix, yOffset, ideo) {
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

  writeTooltip(tooltip, content, matrix, yOffset, ideo);
}

export {
  onLoadAnnots, onDrawAnnots, startHideAnnotTooltipTimeout,
  onWillShowAnnotTooltip, showAnnotTooltip
};
