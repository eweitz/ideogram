import {d3, formatSiPrefix} from '../lib';
// import {getShapes} from './draw';

/**
 * Optional callback, invoked when annotations are loaded
 */
function onLoadAnnots() {
  call(this.onLoadAnnotsCallback);
}

function onBeforeDrawAnnots() {
  call(this.onBeforeDrawAnnotsCallback);
}

/**
 * Optional callback, invoked when annotations are drawn
 */
function onDrawAnnots() {
  call(this.onDrawAnnotsCallback);
}

function hideAnnotTooltip() {
  d3.select('._ideogramTooltip').transition()
    .duration(500) // fade out for half second
    .style('opacity', 0)
    .style('pointer-events', 'none');
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
  const ideo = this;

  if (ideo.config.showAnnotTooltip === false) {
    return;
  }

  // See "Without this..." note in gene-structure.js
  const hideMs = ideo.oneTimeDelayTooltipHideMs ?? 250;
  delete ideo.oneTimeDelayTooltipHideMs;

  // Hide tooltip after `hideMs` milliseconds
  ideo.hideAnnotTooltipTimeout = window.setTimeout(function() {
    hideAnnotTooltip();
  }, hideMs);

  // Enable clients to not show tooltip immediately after clicking gene,
  // e.g. in related genes kit
  ideo.isTooltipCooling = true;
  ideo.hideAnnotTooltipCounter = window.setTimeout(function() {
    ideo.isTooltipCooling = false;
  }, 500);
}

function renderTooltip(tooltip, content, matrix, yOffset, ideo) {
  tooltip.html(content)
    .style('opacity', 1) // Make tooltip visible
    .style('left', matrix.e + 'px')
    .style('top', (matrix.f - yOffset) + 'px')
    .style('font-family', ideo.config.fontFamily)
    .style('pointer-events', null) // Prevent bug in clicking chromosome
    .on('mouseover', function() {
      clearTimeout(ideo.hideAnnotTooltipTimeout);
    })
    .on('mouseout', function() {
      ideo.startHideAnnotTooltipTimeout();
    });
}

function getCoarseBpLength(annot) {
  const length = Math.abs(annot.stop - annot.start);
  return formatSiPrefix(length) + 'bp';
}

function getContentAndYOffset(annot, includeLength=false) {
  var content, yOffset, range, displayName;

  range = 'chr' + annot.chr + ':' + annot.start.toLocaleString();
  if (annot.displayCoordinates) {
    range = annot.displayCoordinates;
  } else if (annot.length > 0) {
    // Only show range if stop differs from start
    range += '-' + annot.stop.toLocaleString();
    if (includeLength) range += ' (' + getCoarseBpLength(annot) + ')';
  }
  content = `<span class="_ideoTooltipFooter"><br />${range}</span>`;
  yOffset = 24;

  if (annot.name) {
    displayName = annot.displayName ? annot.displayName : annot.name;
    content = displayName + content;
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

function onDidShowAnnotTooltip() {
  call(this.onDidShowAnnotTooltipCallback);
}

/**
 * Optional callback, invoked on clicking annotation
 */
function onClickAnnot(annot) {
  this.prevClickedAnnot = annot;
  this.onClickAnnotCallback(annot);
}

// /** Get list of annotation objects by names, e.g. ["BRCA1", "APOE"] */
// function getAnnotsByName(annotNames, ideo) {
//   return annotNames.map(name => getAnnotByName(name, ideo));
// }

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

  // Enable onWillShowAnnotTooltipCallback to cancel showing tooltip
  if (annot === null) {
    hideAnnotTooltip();
    return;
  }

  ideo.prevTooltipAnnotName = annot.name;

  tooltip = d3.select('._ideogramTooltip');
  tooltip.interrupt(); // Stop any in-progress disapperance

  matrix = context.getScreenCTM().translate(cx, cy);

  const includeLength = true;
  [content, yOffset] = getContentAndYOffset(annot, includeLength);

  renderTooltip(tooltip, content, matrix, yOffset, ideo);

  if (ideo.onDidShowAnnotTooltipCallback) {
    ideo.onDidShowAnnotTooltipCallback();
  }
}

export {
  onLoadAnnots, onBeforeDrawAnnots, onDrawAnnots, startHideAnnotTooltipTimeout,
  onWillShowAnnotTooltip, showAnnotTooltip, onClickAnnot,
  onDidShowAnnotTooltip
};
