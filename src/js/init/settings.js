import {slug} from '../lib';

const settings = [
  {
    name: 'Annotations',
    type: 'array',
    description: `
      A list of annotation objects. Each annotation object has at least a
      chromosome name (chr), start coordinate (start), and stop coordinate
      (stop). Annotation objects can also have a name, color, shape, and
      track index.

      See also <i>annotationsPath</i>.
      `,
    example: 'annotations-basic'
  },
  {
    name: 'Annotation height',
    type: 'number',
    description: 'The height of each annotation.',
    example: 'annotations-tracks'
  },
  {
    name: 'Annotations color',
    type: 'string',
    default: '#F00',
    description: 'The color of each annotation.',
    example: 'multiple-primates'
  },
  {
    name: 'Annotations layout',
    type: 'radio',
    default: 'tracks',
    options: ['tracks', 'heatmap', 'heatmap-2d', 'histogram', 'overlay'],
    description: 'The layout of annotations in this ideogram.',
    options: {
      'tracks': `
        Lay out annotations in tracks beside each chromosome. There can be
        more than one track, which is useful for displaying annotations by
        category (e.g. pathogenic, unknown significance, benign). Example in
        <a href="https://eweitz.github.io/ideogram/annotations-tracks">
        Annotations, tracks</a>.`,
      'heatmap': `
        Lay out annotations in heatmap beside each chromosome. Plot
        individual annotations like <pre>annotationsLayout: 'tracks'</pre>,
        with the scalability of <pre>annotationsLayout: 'histogram'</pre>.
        Each chromosome can have one or more heatmap tracks. Use with the
        <pre>heatmaps</pre> configuration option. Example in
        <a href="https://eweitz.github.io/ideogram/annotations-heatmap">
        Annotations, heatmap</a>.`,
      'heatmap-2d': `
        Lay out annotations in a two-dimensional zheatmap beside a single
        chromosome. Enables visualizing raw data summarized in
        <pre>annotationsLayout: 'heatmap'</pre>. Example in
        <a href="https://eweitz.github.io/ideogram/geometry-collinear">
        Geometry, collinear</a>.`,
      'histogram': `
        Lay out annotations in a histogram. This clusters annoatations by
        location, such that each cluster or bin is shown as a bar. The height
        of the bar represent the number of annotations in that genomic range.
        This option is useful for summarizing the distribution of many (1000+)
        features througout the genome. Example in
        <a href="https://eweitz.github.io/ideogram/annotations-histogram">
        Annotations, histogram
        </a>.`,
      'overlay': `
        Lay out annotations directly over chromosomes. This is the most
        space-efficient annotation layout option.  Example in
        <a href="https://eweitz.github.io/ideogram/annotations-overlaid">
        Annotations, overlaid
        </a>.`
    }
  },
  {
    name: 'Annotations path',
    type: 'string',
    description: `
      Absolute or relative URL to a JSON file containing
      annotation objects.`,
    example: 'annotations-overlaid'
  },
  {
    name: 'Annotation tracks',
    type: 'array',
    description: `
      List of objects with metadata for each track, e.g. DOM id, display
      name, color, shape.`,
    example: 'annotations-tracks'
  },
  {
    name: 'Assembly',
    type: 'string',
    default: 'latest RefSeq assembly for specified organism',
    description: `
      Genome assembly to display. Takes assembly name (e.g. "GRCh37"),
      RefSeq accession (e.g. "GCF_000306695.2"), or GenBank accession
      (e.g. "GCA_000005005.5").`,
    example: 'annotations-histogram'
  },
  {
    name: 'Bar width',
    type: 'number',
    default: 3,
    description: `
      Pixel width of bars drawn when annotationsLayout: 'histogram'.`,
    example: 'annotations-histogram'
  },
  {
    name: 'Brush',
    type: 'string',
    default: null,
    description: `
      Genomic coordinate range (e.g. "chr1:104325484-119977655") for a brush
      on a chromosome. Useful when ideogram consists of one chromosome and
      you want to be able to focus on a region within that chromosome, and
      create an interactive sliding window to other regions.)`,
    example: 'bush'
  },
  {
    name: 'Chromosome height',
    id: 'chrHeight',
    type: 'number',
    default: 400,
    description: `
      Pixel height of the tallest chromosome in the ideogram.`,
    example: ['layout-small', 'annotations-basic']
  },
  {
    name: 'Chromosome margin',
    id: 'chrMargin',
    type: 'number',
    default: 10,
    description: 'Pixels between each chromosome.',
    example: 'multiple-primates'
  },
  {
    name: 'Chromosome width',
    id: 'chrWidth',
    type: 'number',
    default: 10,
    description: 'Pixel width of each chromosome',
    example: 'annotations-tracks'
  },
  {
    name: 'Chromosome label size',
    id: 'chrLabelSize',
    type: 'number',
    default: 9,
    description: 'Pixel font size of chromosome labels',
    example: 'differential-expression'
  },
  {
    name: 'Chromosomes',
    type: 'array',
    default: 'all chromosomes in assembly',
    description: `
      List of the names of chromosomes to display. Useful for depicting
      a subset of the chromosomes in the genome, e.g. a single chromosome.`,
    example: 'annotations-basic'
  },
  {
    name: 'Chromosome scale',
    id: 'chrScale', // TODO: Update API from 'chromosomeScale' to 'chrScale'
    type: 'radio',
    default: 'relative',
    options: ['absolute', 'relative']
  },
  {
    name: 'Container',
    type: 'string',
    default: 'body',
    description: 'Selector of the element that will contain the ideogram',
    example: 'layout-small'
  },
  {
    name: 'Data directory',
    id: 'dataDir',
    type: 'string',
    default: '../data/bands/native/',
    example: 'https://ncbi-hackathons.github.io/GeneExpressionAging/ideogram'
  },
  {
    name: 'Demarcate collinear chromosomes',
    id: 'demarcateCollinearChromosomes',
    type: 'boolean',
    default: 'true',
    description: `
      Whether to demarcate colllinear chromosomes. Puts a dark border around
      the perimeter of each track-chromosomes block in track sets for
      chromosomes arranged in collinear geometry. `,
    example: 'collinear-geometry'
  },
  {
    name: 'Geometry',
    type: 'radio',
    options: ['parallel', 'collinear'],
    description: `
      Use "geometry: collinear" to arrange all chromosomes in one line,
      unlike the usual parallel view`
  },
  {
    name: 'Histogram scale',
    type: 'radio',
    oneOf: ['absolute', 'relative'],
    description: `
      Technique to use in scaling the height of histogram bars. The "absolute"
      value sets bar height relative to tallest bar in all chromosomes, while
      "relative" sets bar height relative to tallest bar in each chromosome.`
  },
  {
    name: 'Heatmaps',
    type: 'array',
    description: `
      Array of heatmap objects. Each heatmap object has a key string and a
      thresholds array. The key property specifies the annotations key value
      to depict in the heatmap. The thresholds property specifies a list of
      two-element "threshold" lists, where the first element is the threshold
      value and the second is the threshold color. The threshold values are a
      list of ranges to use in coloring the heatmap. Threshold values are
      specified in ascending order. Example in Annotations, heatmap.`,
    example: 'annotations-heatmap'
  },
  {
    name: 'filterable',
    type: 'boolean',
    description: 'Whether annotations should be filterable.',
    example: 'annotations-histogram'
  },
  {
    name: 'Full chromosome labels',
    type: 'boolean',
    description: `
      Whether to include abbreviation species name in chromosome label.`,
    example: 'homology-interspecies'
  },
  {
    name: 'Legend',
    type: 'array',
    description: 'List of objects describing annotations.',
    example: 'annotations-tracks'
  },
  {
    name: 'onBrushMove',
    type: 'function',
    description: 'Callback function to invoke when brush moves',
    example: 'brush'
  },
  {
    name: 'onDidRotate',
    type: 'function',
    description: 'Callback function to invoke after chromosome has rotated.'
  },
  {
    name: 'onDrawAnnots',
    type: 'function',
    description: `
      Callback function to invoke when annotations are drawn. This is useful
      for when loading and drawing large annotation datsets.`
  },
  {
    name: 'onLoad',
    type: 'function',
    description: `
      Callback function to invoke when chromosomes are loaded, i.e. rendered
      on the page.`,
    example: 'annotations-external-data'
  },
  {
    name: 'onLoadAnnots',
    type: 'function',
    description: `
      Callback function to invoke when annotations are downloaded and ready
      for data transformation.`
  },
  {
    name: 'onWillShowAnnotTooltip',
    type: 'function',
    description: `
      Callback function to invoke immediately before annotation tooltip is
      shown. The tooltip shows the genomic range and, if available, name of
      the annotation. This option can be useful to e.g. enhance the displayed
      annotation name, say by transforming a gene name into a hyperlink to a
      gene record web page.`
  },
  {
    name: 'Organism',
    type: 'string or number or array',
    description: `
      Required.  Organism(s) to show chromosomes for. Supply name of organism
      as a string (e.g. "human") or organism's NCBI Taxonomy ID (taxid, e.g.
      9606) to display chromosomes from a single organism, or an array of
      organisms' names or taxids to display chromosomes from multiple species
      or other taxa.`,
    example: 'human'
  },
  {
    name: 'Orientation',
    type: 'radio',
    default: 'vertical',
    options: ['vertical', 'horizontal'],
    description: `
      Orientation of chromosomes on the page`,
    example: 'mouse'
  },
  {
    name: 'Perspective',
    type: 'string',
    description: `
      Use perspective: 'comparative' to enable annotations between two
      chromosomes, either within the same organism or different organisms.`,
    example: 'homology-basic'
  },
  {
    name: 'Ploidy',
    type: 'number',
    default: 1,
    description: `
      Number of chromosome to depict for each chromosome set.`,
    example: 'ploidy-basic'
  },
  {
    name: 'Ploidy description',
    id: 'ploidyDesc',
    type: 'array',
    description: `
      Description of ploidy in each chromosome set in terms of ancestry
      composition.`,
    example: 'ploidy-recombination'
  },
  {
    name: 'Range set',
    type: 'array',
    description: `
      List of objects describing segments of recombination among chromosomes
      in a chromosome set.`,
    example: 'ploidy-recombination'
  },
  {
    name: 'Resolution',
    type: 'number',
    default: 'highest resolution available for specified genome assembly.',
    description: `
      Resolution of cytogenetic bands to show for each chromosome. The
      quantity refers to approximate value in bands per haploid set (bphs).
      See also: <i>fullyBanded</i>.`,
    example: 'layout-small'
  },
  {
    name: 'Rotatable',
    type: 'boolean',
    default: 'true',
    description: 'Whether chromosomes are rotatable upon clicking them',
    example: 'layout-small'
  },
  {
    name: 'Rows',
    type: 'number',
    default: 1,
    description: `
      Number of rows to arrange chromosomes into. Useful for putting
      ideogram into a small container, or when dealing with genomes that have
      many chromosomes.`,
    example: 'layout-small'
  },
  {
    name: 'Sex',
    type: 'string',
    default: 'male',
    description: `
      Biological sex of the organism.  Useful for omitting chromosome Y in
      female mammals. Currently only supported for organisms that use XY
      sex-determination.`,
    example: 'ploidy-basic'
  },
  {
    name: 'Show band labels',
    type: 'boolean',
    default: 'false',
    description: 'Whether to show cytogenetic band labels, e.g. 1q21',
    example: 'annotations-basic'
  },
  {
    name: 'Show chromosome labels',
    type: 'boolean',
    default: 'true',
    description: `
      Whether to show chromosome labels, e.g. 1, 2, 3, X, Y.`,
    example: 'annotations-basic'
  },
  {
    name: 'showAnnotTooltip',
    type: 'boolean',
    default: 'true',
    description: `
      Whether to show a tooltip upon mousing over an annotation.`
  },
  {
    name: 'showFullyBanded',
    type: 'boolean',
    default: 'true',
    description: `
      Whether to show fully banded chromosomes for genomes that have
      sufficient data. Useful for showing simpler chromosomes of
      cytogenetically well-characterized organisms, e.g. human, beside
      chromosomes of less studied organisms, e.g. chimpanzee.  See also
      <i>resolution</i>.`
  },
  {
    name: 'showNonNuclearChromosomes',
    type: 'boolean',
    default: 'false',
    description: `
      Whether to show non-nuclear chromosomes, e.g. for mitochondrial (MT) and
      chloroplast (CP) DNA.`,
    example: 'eukaryotes?org=sus-scrofa'
  }
];

const style = `
  <style>
    #settings-gear {
      position: absolute;
      right: 0;
      cursor: pointer;
      height: 18px;
      width: 18px;
    }

    #settings {
      z-index: 9999;
      background: white;
      border: 1px solid #DDD;
    }

    #settings label {
      display: inline;
    }

    #settings li {
      list-style-type: none;
    }
  </style>`;

// eslint-disable-next-line max-len
const gearIcon = '<svg viewBox="0 0 512 512"><path fill="#777" d="M444.788 291.1l42.616 24.599c4.867 2.809 7.126 8.618 5.459 13.985-11.07 35.642-29.97 67.842-54.689 94.586a12.016 12.016 0 0 1-14.832 2.254l-42.584-24.595a191.577 191.577 0 0 1-60.759 35.13v49.182a12.01 12.01 0 0 1-9.377 11.718c-34.956 7.85-72.499 8.256-109.219.007-5.49-1.233-9.403-6.096-9.403-11.723v-49.184a191.555 191.555 0 0 1-60.759-35.13l-42.584 24.595a12.016 12.016 0 0 1-14.832-2.254c-24.718-26.744-43.619-58.944-54.689-94.586-1.667-5.366.592-11.175 5.459-13.985L67.212 291.1a193.48 193.48 0 0 1 0-70.199l-42.616-24.599c-4.867-2.809-7.126-8.618-5.459-13.985 11.07-35.642 29.97-67.842 54.689-94.586a12.016 12.016 0 0 1 14.832-2.254l42.584 24.595a191.577 191.577 0 0 1 60.759-35.13V25.759a12.01 12.01 0 0 1 9.377-11.718c34.956-7.85 72.499-8.256 109.219-.007 5.49 1.233 9.403 6.096 9.403 11.723v49.184a191.555 191.555 0 0 1 60.759 35.13l42.584-24.595a12.016 12.016 0 0 1 14.832 2.254c24.718 26.744 43.619 58.944 54.689 94.586 1.667 5.366-.592 11.175-5.459 13.985L444.788 220.9a193.485 193.485 0 0 1 0 70.2zM336 256c0-44.112-35.888-80-80-80s-80 35.888-80 80 35.888 80 80 80 80-35.888 80-80z"/></svg>';
// Font Awesome Free 5.2.0 by @fontawesome - https://fontawesome.com
// License - https://fontawesome.com/license (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)


function handleSettingsToggle(ideo) {
  document.querySelector('#settings-gear')
    .addEventListener('click', event => {
      var options = document.querySelector('#settings');
      if (options.style.display === 'none') {
        options.style.display = '';
      } else {
        options.style.display = 'none';
      }
    });
}

/** Get HTML for setting header */
function getHeader(setting, name) {
  // Get a header for each setting
  let header;
  if (setting.type === 'number') {
    header = `<div class="setting">${setting.name}</div>`;
  } else {
    header = `
      <label class="setting">
        ${setting.name}
      </label>`;
  }
  return header;
}

/** Transform options to an array of list items (<li>'s) */
function getOptions(setting, name) {

  const typeAttr = `type="${setting.type}"`;

  if ('options' in setting === false) {
    // type="number"
    return `<input ${typeAttr}/><br/>`;
  }

  return setting.options.map(option => {
    let item;
    const id = slug(option);
    const attrs = `${typeAttr} id="${id}"`;
    if (setting.type === 'radio') {
      // TODO: Handle 'checked'
      const input = `<input ${attrs} name="${name}" value="${id}"/>`;
      const label = `<label for="${id}">${option}</label>`;
      item = input + label;
    }
    return `<li>${item}</li>`;
  }).join('');
}

/**
 * Get list of configurable Ideogram settings; each has a header and options
 *
 * @param {Array} settings
 */
function list(settings) {
  return settings.map(setting => {
    const name =
      ('id' in setting) ? setting.id : slug(setting.name);

    const header = getHeader(setting, name);
    const options = getOptions(setting, name);

    return header + options;
  }).join('<br/>');
}

function initSettings(ideo) {

  const settingsList = list(settings);

  const settingsHtml = `
    ${style}
    <div id="settings-gear">${gearIcon}</div>
    <div id="settings" style="display: none">
      <ul>
        ${settingsList}
      </ul>
    </div>`;

  document.querySelector(ideo.selector)
    .insertAdjacentHTML('beforebegin', settingsHtml);
  handleSettingsToggle(ideo);
}

export {initSettings};
