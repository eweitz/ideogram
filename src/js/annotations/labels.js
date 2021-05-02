import {d3} from '../lib';

const allLabelStyle = `
  <style>
    #_ideogram .annot path, ._ideogramLabel {
      cursor: pointer;
    }

    #_ideogram .annot path {
      stroke-width: 1px;
      stroke: white;
      stroke-linejoin: bevel;
    }

    #_ideogram ._ideogramLabel._ideoActive {
      fill: #77F !important;
      stroke: #F0F0FF !important;
    }

    #_ideogram .annot > ._ideoActive {
      stroke: #D0D0DD !important;
      stroke-width: 1.5px;
    }

    #_ideogram ._ideogramLabel {
      stroke: white;
      stroke-width: 5px;
      stroke-linejoin: round;
      paint-order: stroke fill;
      text-align: center;
    }
  </style>
  `;

/** Return DOM ID of annotation object */
function getAnnotDomLabelId(annot) {
  return 'ideogramLabel_' + annot.domId;
}

function triggerAnnotEvent(event, ideo) {
  let labelId, annotId;
  const target = event.target;
  const type = event.type;

  const targetClasses = Array.from(target.classList);
  if (targetClasses.includes('_ideogramLabel')) {
    labelId = target.id;
    annotId = target.id.split('ideogramLabel_')[1];
    d3.select('#' + annotId + ' path').dispatch(type);
  } else {
    const annotElement = target.parentElement;
    labelId = 'ideogramLabel_' + annotElement.id;
    annotId = annotElement.id;
  }

  if (type === 'mouseout') {
    ideo.time.prevTooltipOff = performance.now();
    ideo.time.prevTooltipAnnotDomId = annotId;
  }

  const state = (type === 'mouseover') ? '_ideoActive' : '';
  d3.select('#' + labelId).attr('class', '_ideogramLabel ' + state);
  d3.select('#' + annotId + ' > path').attr('class', state);
}

function renderLabel(annot, style, ideo) {
  const config = ideo.config;

  if (!ideo.didSetLabelStyle) {
    document.querySelector('#_ideogramInnerWrap')
      .insertAdjacentHTML('afterbegin', allLabelStyle);
    ideo.didSetLabelStyle = true;
  }

  const id = getAnnotDomLabelId(annot);

  // TODO: De-duplicate with code in getTextWidth and elsewhere
  // perhaps set config.annotLabelSize and config.annotLabelFont upstream.
  const labelSize = config.annotLabelSize ? config.annotLabelSize : 13;
  const font = labelSize + 'px sans-serif';

  const fill = annot.color === 'pink' ? '#CF406B' : annot.color;

  d3.select('#_ideogram').append('text')
    .attr('id', id)
    .attr('class', '_ideogramLabel')
    .attr('x', style.left)
    .attr('y', style.top)
    .style('font', font)
    .style('fill', fill)
    .style('pointer-events', null) // Prevent bug in clicking chromosome
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
  var annotDom, annotRect, ideoRect, width, height, top, bottom, left, right,
    config = ideo.config;

  annotDom = document.querySelector('#' + annot.domId);

  // Handles cases when annotation is not yet in DOM
  if (annotDom === null) return null;

  annotRect = annotDom.getBoundingClientRect();

  ideoRect =
    document.querySelector('#_ideogram').getBoundingClientRect();

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
  if (layout === null) return;

  const style = Object.assign(layout, {backgroundColor, borderColor});

  renderLabel(annot, style, ideo);
}

/** Label as many annotations as possible, without overlap */
function fillAnnotLabels(sortedAnnots=[]) {
  const ideo = this;

  sortedAnnots = sortedAnnots.slice(); // copy by value

  // Remove any pre-existing annotation labels, to avoid duplicates
  ideo.clearAnnotLabels();

  const spacedAnnots = [];
  const spacedLayouts = [];

  if (sortedAnnots.length === 0) {
    sortedAnnots = ideo.flattenAnnots();
  }

  sortedAnnots.forEach((annot, i) => {
    const layout = getAnnotLabelLayout(annot, ideo);

    if (layout === null) return;

    const hasOverlap =
      spacedLayouts.length > 1 && spacedLayouts.some((sl, j) => {

        const xOverlap = sl.left <= layout.right && sl.right >= layout.left;
        const yOverlap =
          (
            sl.top < layout.bottom && sl.bottom > layout.top ||
            layout.top < sl.bottom && layout.bottom > sl.bottom
          );

        // if (annot.name === 'TP73') {
        //   const spacedAnnot = spacedAnnots[j].name;
        //   console.log(
        //     'xOverlap, yOverlap, annot.name, layout, spacedAnnot, sl'
        //   );
        //   console.log(
        //     xOverlap, yOverlap, annot.name, layout, spacedAnnot, sl
        //   );
        // }

        return xOverlap && yOverlap;
      });

    if (hasOverlap) return;

    spacedAnnots.push(annot);
    spacedLayouts.push(layout);
  });

  spacedAnnots.forEach((annot) => {
    ideo.addAnnotLabel(annot.name);
  });

  d3.selectAll('._ideogramLabel, .annot')
    .on('mouseover', (event) => triggerAnnotEvent(event))
    .on('mouseout', (event) => triggerAnnotEvent(event, ideo))
    .on('click', (event) => triggerAnnotEvent(event));
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
