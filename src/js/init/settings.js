const basicSettings = [
  {
    name: 'Organism',
    type: 'string',
    description: `
      Required.  Organism(s) to show chromosomes for. Supply name of organism
      as a string (e.g. "human") or organism's NCBI Taxonomy ID (taxid, e.g.
      9606) to display chromosomes from a single organism, or an array of
      organisms' names or taxids to display chromosomes from multiple species
      or other taxa.`,
    example: 'human'
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
    name: 'Orientation',
    type: 'radio',
    default: 'vertical',
    options: ['vertical', 'horizontal'],
    description: `
      Orientation of chromosomes on the page`,
    example: 'mouse'
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
  }
];

const chromosomeSettings = [
  {
    name: 'Chromosome height',
    shortName: 'Height',
    id: 'chrHeight',
    type: 'number',
    default: 400,
    description: `
      Pixel height of the tallest chromosome in the ideogram.`,
    example: ['layout-small', 'annotations-basic']
  },
  {
    name: 'Chromosome width',
    shortName: 'Width',
    id: 'chrWidth',
    type: 'number',
    default: 10,
    description: 'Pixel width of each chromosome',
    example: 'annotations-tracks'
  },
  {
    name: 'Chromosome margin',
    shortName: 'Margin',
    id: 'chrMargin',
    type: 'number',
    default: 10,
    description: 'Pixels between each chromosome.',
    example: 'multiple-primates'
  },
  {
    name: 'Chromosome label size',
    shortName: 'Label size',
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
    name: 'Full chromosome labels',
    shortName: 'Full labels',
    type: 'checkbox',
    description: `
      Whether to include abbreviation species name in chromosome label.`,
    example: 'homology-interspecies'
  },
  {
    name: 'Show chromosome labels',
    type: 'checkbox',
    default: 'true',
    description: `
      Whether to show chromosome labels, e.g. 1, 2, 3, X, Y.`,
    example: 'annotations-basic'
  },
  {
    name: 'Show fully banded',
    type: 'checkbox',
    default: 'true',
    description: `
      Whether to show fully banded chromosomes for genomes that have
      sufficient data. Useful for showing simpler chromosomes of
      cytogenetically well-characterized organisms, e.g. human, beside
      chromosomes of less studied organisms, e.g. chimpanzee.  See also
      <i>resolution</i>.`
  },
  {
    name: 'Show non-nuclear chromosomes',
    type: 'checkbox',
    default: 'false',
    description: `
      Whether to show non-nuclear chromosomes, e.g. for mitochondrial (MT) and
      chloroplast (CP) DNA.`,
    example: 'eukaryotes?org=sus-scrofa'
  }
];

const annotationSettings = [
  {
    name: 'Annotations',
    shortName: 'List',
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
    shortName: 'Height',
    type: 'number',
    description: 'Height of each annotation.',
    example: 'annotations-tracks'
  },
  {
    name: 'Annotations color',
    shortName: 'Color',
    type: 'string',
    default: '#F00',
    description: 'Color of each annotation.',
    example: 'multiple-primates'
  },
  {
    name: 'Annotations layout',
    shortName: 'Layout',
    type: 'radio',
    default: 'tracks',
    description: 'The layout of annotations in this ideogram.',
    options: ['tracks', 'heatmap', 'heatmap-2d', 'histogram', 'overlay'],
    optionsDescription: {
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
    shortName: 'Path',
    type: 'string',
    description: `
      Absolute or relative URL to a JSON file containing
      annotation objects.`,
    example: 'annotations-overlaid'
  },
  {
    name: 'Annotation tracks',
    shortName: 'Tracks',
    type: 'array',
    description: `
      List of objects with metadata for each track, e.g. DOM id, display
      name, color, shape.`,
    example: 'annotations-tracks'
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
    name: 'Filterable',
    type: 'checkbox',
    description: 'Whether annotations should be filterable.',
    example: 'annotations-histogram'
  },
  {
    name: 'Legend',
    type: 'array',
    description: 'List of objects describing annotations.',
    example: 'annotations-tracks'
  },
  {
    name: 'Legend',
    type: 'array',
    description: 'List of objects describing annotations.',
    example: 'annotations-tracks'
  }
];

const histogramSettings = [
  {
    name: 'Bar width',
    type: 'number',
    default: 3,
    description: `
      Pixel width of bars drawn when annotationsLayout: 'histogram'.`,
    example: 'annotations-histogram'
  },
  {
    name: 'Histogram scale',
    name: 'Scale',
    type: 'radio',
    oneOf: ['absolute', 'relative'],
    description: `
      Technique to use in scaling the height of histogram bars. The "absolute"
      value sets bar height relative to tallest bar in all chromosomes, while
      "relative" sets bar height relative to tallest bar in each chromosome.`
  }
];

const ploidySettings = [
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
    shortName: 'Description',
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
  }
];

const otherSettings = [
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
    name: 'Demarcate collinear chromosomes',
    shortName: 'Demarcate',
    id: 'demarcateCollinearChromosomes',
    type: 'checkbox',
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
    name: 'Perspective',
    type: 'string',
    description: `
      Use perspective: 'comparative' to enable annotations between two
      chromosomes, either within the same organism or different organisms.`,
    example: 'homology-basic'
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
  }
];

const eventHandlers = [ // eslint-disable-line no-unused-vars
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
  }
];

const settings = [
  {theme: 'Basic', list: basicSettings},
  {theme: 'Chromosomes', list: chromosomeSettings},
  {theme: 'Annotations', list: annotationSettings},
  {theme: 'Histogram', list: histogramSettings},
  {theme: 'Ploidy', list: ploidySettings},
  {theme: 'Other', list: otherSettings}
  // {theme: 'Event handlers', list: eventHandlers}
];

export default settings;
