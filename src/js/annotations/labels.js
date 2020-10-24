import {d3} from '../lib';

/** Return DOM ID of annotation object */
function getAnnotDomLabelId(annot) {
  return (
    'ideogramLabel_' + annot.chr + '_' + annot.start + '_' + annot.length
  );
}

function renderLabel(annot, style, ideo) {

  const id = getAnnotDomLabelId(annot);
  const background = style.backgroundColor ? style.backgroundColor : '#FFF';
  const borderColor = style.borderColor ? style.borderColor : '#CCC';

  // TODO: De-duplicate with code in getTextWidth,
  // perhaps set config.annotLabelSize and config.annotLabelFont upstream.
  const size = config.annotLabelSize ? config.annotLabelSize : 12;
  const font = size + 'px sans-serif';

  const radius = 1.5;
  const offset = 0;
  const color = '#FFFF';
  const textShadow =
    `-${radius}px -${radius}px ${offset}px ${color}, ` +
    `${radius}px -${radius}px ${offset}px ${color}, ` +
    `-${radius}px ${radius}px ${offset}px ${color}, ` +
    `${radius}px ${radius}px ${offset}px ${color}`;

  // const textShadow = `10px 0 ${r}px #F00`;
  console.log(textShadow);

  d3.select(ideo.config.container + ' #_ideogramOuterWrap').append('div')
    .attr('class', '_ideogramLabel')
    .attr('id', id)
    .style('opacity', 1) // Make label visible
    .style('left', style.left + 'px')
    .style('top', style.top + 'px')
    .style('position', 'fixed')
    .style('text-align', 'center')
    .style('font', font)
    .style('z-index', '900')
    .style('pointer-events', null) // Prevent bug in clicking chromosome

    // Box the text
    .style('padding', '0 0 0 1px')
    .style('background', background)
    .style('border', '1px solid ' + borderColor)
    .style('border-radius', '5px')

    // Alternatively, like Google Maps.  Enables increasing font size by 1px.
    // .style('text-shadow', textShadow)

    // A more experimental approach with text-stroke
    // .style('font-weight', 900)
    // .style('-webkit-text-stroke', '0.5px white')
    // .style('-webkit-text-fill-color', '#000')
    // .style('paint-order', 'stroke fill')

    .html(annot.name);
}

/**
 * Compute and return the width of the given text of given font in pixels.
 *
 * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 */
function getTextWidth(text, ideo) {
  var config = ideo.config;
  var size = config.annotLabelSize ? config.annotLabelSize : 12;

  var font = size + 'px sans-serif';

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
  var annotRect, width;

  annotRect = document.querySelector('#' + annot.id).getBoundingClientRect();
  width = getTextWidth(annot.name, ideo) - 10;

  const height = ideo.config.annotationHeight;

  const top = annotRect.top - height/2 + 3;
  const left = annotRect.left - height*2 - width;

  return {top, left, width, height};
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

  const {top, left} = getAnnotLabelLayout(annot, ideo);

  const style = {left, top, backgroundColor, borderColor};

  renderLabel(annot, style, ideo);
}

/** Label as many annotations as possible, without overlap */
function fillAnnotLabels() {
  const ideo = this;

  const spacedAnnots = [];

  // TODO: Make this config default, also use in addAnnotLabel
  const annotLabelSize = 12;

  // Vertical space (when orientation: vertical)
  const ySpace = annotLabelSize + 3;

  ideo.annots.forEach((annotsByChr) => {
    let prevAnnotPx = 0;

    const sortedAnnots =
      annotsByChr.annots.sort((a, b) => a.start - b.start);

    sortedAnnots.forEach((annot) => {
      const margin = annot.px - prevAnnotPx - ySpace;
      if (prevAnnotPx === 0 || margin > 0) {
        spacedAnnots.push(annot);
      }

      // console.log(annot.name)
      // console.log('annot.px: ' + annot.px + ', prevAnnotPx: ' + prevAnnotPx + ', margin: ' + margin)
      // console.log('')

      prevAnnotPx = annot.px;
    });
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
