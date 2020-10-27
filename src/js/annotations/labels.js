import {d3} from '../lib';

/** Return DOM ID of annotation object */
function getAnnotDomLabelId(annot) {
  return (
    'ideogramLabel_' + annot.chr + '_' + annot.start + '_' + annot.length
  );
}

function renderLabel(annot, style, ideo) {
  const config = ideo.config;

  const id = getAnnotDomLabelId(annot);

  // TODO: De-duplicate with code in getTextWidth and elsewhere
  // perhaps set config.annotLabelSize and config.annotLabelFont upstream.
  const labelSize = config.annotLabelSize ? config.annotLabelSize : 13;
  const font = labelSize + 'px sans-serif';

  const fill = annot.color === 'pink' ? '#DF708B' : annot.color;

  d3.select('#_ideogram').append('text')
    .attr('id', id)
    .attr('class', '_ideogramLabel')
    .attr('x', style.left)
    .attr('y', style.top)
    .style('text-align', 'center')
    .style('font', font)
    .style('fill', fill)
    .style('pointer-events', null) // Prevent bug in clicking chromosome
    .style('stroke', 'white')
    .style('stroke-width', '5px')
    .style('stroke-linejoin', 'round')
    .style('paint-order', 'stroke fill')

    .html(annot.name);
}

/**
 * Compute and return the width of the given text of given font in pixels.
 *
 * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 */
function getTextWidth(text, ideo) {
  var config = ideo.config;
  var labelSize = config.annotLabelSize ? config.annotLabelSize : 13;

  var font = labelSize + 'px sans-serif';

  // re-use canvas object for better performance
  var canvas =
    getTextWidth.canvas ||
    (getTextWidth.canvas = document.createElement('canvas'));
  var context = canvas.getContext('2d');
  context.font = font;
  var metrics = context.measureText(text);
  return metrics.width;
}

/** Get annotation object by name, e.g. "BRCA1" */
function getAnnotByName(annotName, ideo) {
  var annot;
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

  return annot;
}

/** Get label's top and left offsets relative to chromosome, and width */
function getAnnotLabelLayout(annot, ideo) {
  var annotRect, ideoRect, width, height, top, bottom, left, right,
    config = ideo.config;


  ideoRect =
    document.querySelector('#_ideogram').getBoundingClientRect();
  annotRect =
    document.querySelector('#' + annot.domId).getBoundingClientRect();

  width = getTextWidth(annot.name, ideo);

  // Accounts for:
  // 1px left pad, 1px right pad, 1px right border, 1px left border
  //  as set in renderLabel
  width = width + 7;

  const labelSize = config.annotLabelSize ? config.annotLabelSize : 13;

  // Accounts for 1px top border, 1px bottom border as set in renderLabel
  height = labelSize;

  top = annotRect.top - ideoRect.top + height - 1;
  bottom = top + height;
  left = annotRect.left - ideoRect.left - width;
  right = left + width;

  return {top, bottom, right, left, width, height};
}

/**
 * Label an annotation.
 *
 * @param annotName {String} Name of annotation, e.g. "BRCA1"
 * @param backgroundColor {String} Background color.  Default: white.
 * @param backgroundColor {String} Border color.  Default: black.
 */
function addAnnotLabel(annotName, backgroundColor, borderColor) {
  var annot,
    ideo = this;

  annot = getAnnotByName(annotName, ideo);

  const layout = getAnnotLabelLayout(annot, ideo);

  const style = Object.assign(layout, {backgroundColor, borderColor});

  renderLabel(annot, style, ideo);
}

/** Label as many annotations as possible, without overlap */
function fillAnnotLabels(sortedAnnots=[]) {
  const ideo = this;

  sortedAnnots = sortedAnnots.slice(); // copy by value

  // Remove any pre-existing annotation labels, to avoid duplicates
  ideo.clearAnnotLabels();

  if (sortedAnnots.length === 0) {
    ideo.annots.forEach((annotsByChr) => {

      const sortedAnnotsThisChr =
        annotsByChr.annots.sort((a, b) => a.start - b.start);

      sortedAnnots = sortedAnnots.concat(sortedAnnotsThisChr);
    });
  }

  const spacedAnnots = [];
  const spacedLayouts = [];

  sortedAnnots.forEach((annot, i) => {
    const layout = getAnnotLabelLayout(annot, ideo);

    const hasOverlap =
      spacedLayouts.length > 1 && spacedLayouts.some((sl, j) => {
        const xOverlap = sl.left <= layout.right && sl.right >= layout.left;
        const yOverlap =
          (
            sl.top < layout.bottom && sl.bottom > layout.top ||
            layout.top < sl.bottom && layout.bottom > sl.bottom
          );

        return xOverlap && yOverlap;
      });

    if (hasOverlap) return;

    spacedAnnots.push(annot);
    spacedLayouts.push(layout);
  });

  spacedAnnots.forEach((annot) => {
    ideo.addAnnotLabel(annot.name);
  });
}

function removeAnnotLabel(annotName) {
  const ideo = this;
  const annot = getAnnotByName(annotName, ideo);
  const id = getAnnotDomLabelId(annot);
  document.querySelector('#' + id).remove();
}

function clearAnnotLabels() {
  const labels = document.querySelectorAll('._ideogramLabel');
  labels.forEach((label) => {label.remove();});
}

export {
  addAnnotLabel, clearAnnotLabels, fillAnnotLabels, getAnnotLabelLayout,
  removeAnnotLabel
};
