import {d3} from '../lib';
// import {getShapes} from './draw';

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

  ideo.hideAnnotTooltipTimeout = window.setTimeout(function() {
    hideAnnotTooltip();
  }, 250);

  // if ('isTooltipCooling' in ideo && ideo.isTooltipCooling === false) {
    ideo.isTooltipCooling = true;
    ideo.hideAnnotTooltipCounter = window.setTimeout(function() {
      ideo.isTooltipCooling = false;
    }, 250);
  // }
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
  this.prevClickedAnnot = annot;
  this.onClickAnnotCallback(annot);
}

// /** Get list of annotation objects by names, e.g. ["BRCA1", "APOE"] */
// function getAnnotsByName(annotNames, ideo) {
//   return annotNames.map(name => getAnnotByName(name, ideo));
// }

// /** Briefly show a circle around specified annotations */
// function pulseAnnots(annotNames, ideo, duration=2000) {
//   const annots = getAnnotsByName(annotNames, ideo);
//   const circle = getShapes(ideo.config.annotationHeight + 2).circle;
//   const ids = annots.map(annot => annot.domId);

//   d3.selectAll(ids).each(function() {
//     d3.select('#' + this)
//       .insert('path', ':first-child')
//       .attr('class', '_ideogramAnnotPulse')
//       .attr('d', circle)
//       .attr('fill-opacity', 0.5)
//       .attr('fill', 'yellow')
//       .attr('stroke', 'orange');
//   });

//   const annotPulses = d3.selectAll('._ideogramAnnotPulse');
//   annotPulses.transition()
//     .duration(duration) // fade out for `duration` milliseconds
//     .style('opacity', 0)
//     .style('pointer-events', 'none')
//     .on('end', function(d, i) {
//       if (i === annotPulses.size() - 1) {
//         annotPulses.remove();
//       }
//     });
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

  [content, yOffset] = getContentAndYOffset(annot);

  renderTooltip(tooltip, content, matrix, yOffset, ideo);
}

export {
  onLoadAnnots, onDrawAnnots, startHideAnnotTooltipTimeout,
  onWillShowAnnotTooltip, showAnnotTooltip, onClickAnnot
};
