import {d3, getFont, getTextSize} from '../lib';

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

function changeAnnotState(state, labelId, annotId) {
  d3.selectAll('._ideoActive').classed('_ideoActive', false);
  d3.select('#' + labelId).attr('class', '_ideogramLabel ' + state);
  d3.select('#' + annotId + ' > path').attr('class', state);
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

  // On mouseover, activate immediately
  // Otherwise, wait a moment (250 ms), then deactivate.
  // Delayed deactivation mitigates flicker when moving from
  // annot label to annot triangle.
  if (type === 'mouseover') {
    clearTimeout(window._ideoActiveTimeout);
    changeAnnotState('_ideoActive', labelId, annotId);
  } else {
    window._ideoActiveTimeout = window.setTimeout(function() {
      changeAnnotState('', labelId, annotId);
    }, 250);
  }
}

function renderLabel(annot, style, ideo) {

  if (!ideo.didSetLabelStyle) {
    document.querySelector('#_ideogramInnerWrap')
      .insertAdjacentHTML('afterbegin', allLabelStyle);
    ideo.didSetLabelStyle = true;
  }

  const id = getAnnotDomLabelId(annot);

  const font = getFont(ideo);

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

  const textSize = getTextSize(annot.name, ideo);
  width = textSize.width;

  // `pad` is a heuristic that accounts for:
  // 1px left pad, 1px right pad, 1px right border, 1px left border
  // as set in renderLabel
  const pad = (config.fontFamily) ? 9 : 7;
  width += pad;

  const labelSize = config.annotLabelSize ? config.annotLabelSize : 13;
  // console.log('height, labelSize', height, labelSize);

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

export function sortAnnotsByRank(annots, ideo) {
  if ('geneCache' in ideo === false) return annots;

  const ranks = ideo.geneCache.interestingNames;

  annots = annots.map(annot => {
    annot.rank = ranks.indexOf(annot.name) || 1E10;
    return annot;
  });

  // Ranks annots by popularity
  const rankedAnnots = annots.sort((a, b) => {

    // Search gene is most important, regardless of popularity
    if (a.color === 'red') return -1;
    if (b.color === 'red') return 1;

    // Rank 3 is more important than rank 30
    return a.rank - b.rank;
  });

  return rankedAnnots;
}

export function applyRankCutoff(annots, cutoff, ideo) {
  const rankedAnnots = sortAnnotsByRank(annots, ideo);

  // Take the top N ranked genes, where N is `cutoff`
  annots = rankedAnnots.slice(0, cutoff);

  // console.log(annots.map(annot => {return annot.name + ' ' + annot.rank }));

  return annots;
}

/** Label as many annotations as possible, without overlap */
function fillAnnotLabels(sortedAnnots=[]) {
  const ideo = this;

  sortedAnnots = sortedAnnots.slice(); // copy by value

  // Remove any pre-existing annotation labels, to avoid duplicates
  ideo.clearAnnotLabels();

  let spacedAnnots = [];
  const spacedLayouts = [];

  if (sortedAnnots.length === 0) {
    sortedAnnots = ideo.flattenAnnots();
  }

  const m = 3; // padding

  sortedAnnots.forEach((annot, i) => {
    const layout = getAnnotLabelLayout(annot, ideo);

    if (layout === null) return;

    const hasOverlap =
      spacedLayouts.length > 1 && spacedLayouts.some((sl, j) => {

        const xOverlap = (
          sl.left - m <= layout.right &&
          sl.right >= layout.left - m
        );
        const yOverlap =
          (
            sl.top - m < layout.bottom && sl.bottom > layout.top - m ||
            layout.top - m < sl.bottom && layout.bottom > sl.bottom
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

  let numLabels = 10;
  const config = ideo.config;
  if ('relatedGenesMode' in config && config.relatedGenesMode === 'hints') {
    numLabels = 20;
  }
  spacedAnnots = applyRankCutoff(spacedAnnots, numLabels, ideo);

  // Ensure highest-ranked annots are ordered last in SVG,
  // to ensure the are written before lower-ranked annots
  // (which, due to SVG z-index being tied to layering)
  spacedAnnots.reverse();

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
