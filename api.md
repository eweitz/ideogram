# Ideogram API reference

Ideogram.js is a JavaScript library for chromosome visualization.  Ideogram supports drawing and animating genome-wide datasets.  Its API consists of configuration options and methods.  You can see examples of almost all these options and methods -- as well as their actual effect -- in the many [live examples](https://eweitz.github.io/ideogram/).  Simply "View source" in any example page.

# Installation
See the main [README](https://github.com/eweitz/ideogram#installation) for installation instructions.

# Configuration
To start, you need to instantiate the `Ideogram` class.  Configuration options -- which organism's genome to display, in what orientation, with which annotation data, etc. -- are passed into the `Ideogram` constructor as a JavaScript object.  

For example:

```
var ideogram = new Ideogram({
  organism: 'human',
  annotations: [{
    name: 'BRCA1',
    chr: '17',
    start: 43044294,
    stop: 43125482
  }]
});
```

# Options
* [ancestors](#ancestors)
* [annotations](#annotations)
* [annotationHeight](#annotationheight)
* [annotationsColor](#annotationscolor)
* [annotationsLayout](#annotationslayout)
* [annotationsPath](#annotationspath)
* [annotationTracks](#annotationtracks)
* [assembly](#assembly)
* [barWidth](#barwidth)
* [brush](#brush)
* [chrHeight](#chrheight)
* [chrMargin](#chrmargin)
* [chrWidth](#chrwidth)
* [chromosomes](#chromosomes)
* [container](#container)
* [dataDir](#datadir)
* [geometry](#geometry)
* [histogramScaling](#histogramscaling)
* [heatmaps](#heatmaps)
* [filterable](#filterable)
* [fullChromosomeLabels](#fullchromosomelabels)
* [legend](#legend)
* [onBrushMove](#onbrushmove)
* [onDidRotate](#ondidrotate)
* [onDrawAnnots](#ondrawannots)
* [onLoadAnnots](#onloadannots)
* [onLoad](#onload)
* [onWillShowAnnotTooltip](#onwillshowannottooltip)
* [organism](#organism)
* [orientation](#orientation)
* [perspective](#perspective)
* [ploidy](#ploidy)
* [ploidyDesc](#ploidydesc)
* [rangeSet](#rangeset)
* [resolution](#resolution)
* [rotatable](#rotatable)
* [rows](#rows)
* [sex](#sex)
* [showBandLabels](#showbandlabels)
* [showChromosomeLabels](#showchromosomelabels)
* [showAnnotTooltip](#showannottooltip)
* [showFullyBanded](#showfullybanded)
* [showNonNuclearChromosomes](#shownonnuclearchromosomes)

## ancestors
Object.  Optional.  A map associating ancestor labels to colors.  Used to color chromosomes from different ancestors in polyploid genomes.  Example in [Ploidy, recombination](https://eweitz.github.io/ideogram/ploidy_recombination).

## annotations
Array.  Optional.  A list of annotation objects.  Each annotation object has at least a chromosome name (chr), start coordinate (start), and stop coordinate (stop).  Annotation objects can also have a name, color, shape, and track index.  Example in [Annotations, basic](https://eweitz.github.io/ideogram/annotations_basic).

See also [annotationsPath](#annotationspath).

## annotationHeight
Number.  Optional.  The height of each annotation. Example in [Annotations, tracks](https://eweitz.github.io/ideogram/annotations-tracks).

## annotationsColor
String.  Optional.  Default: "#F00" (i.e., red).  The color of each annotation.  Example in [Multiple, primates](https://eweitz.github.io/ideogram/multiple-primates).

## annotationsLayout
String.  Optional.  Default: "tracks".  

The layout of this ideogram's annotations.  One of "tracks", "heatmap", "histogram", or "overlay".

### annotationsLayout: 'tracks'
Lay out annotations in tracks beside each chromosome.  There can be more than one track, which is useful for displaying annotations by category (e.g. pathogenic, unknown significance, benign).  Example in [Annotations, tracks](https://eweitz.github.io/ideogram/annotations-tracks).

### annotationsLayout: 'heatmap'
Lay out annotations in heatmap beside each chromosome.  Plot individual annotations like `annotationsLayout: 'tracks'`, with the scalability of `annotationsLayout: 'histogram'`.  Each chromosome can have one or more heatmap tracks.  Use with the [heatmaps](#heatmaps) configuration option.  Example in [Annotations, heatmap](https://eweitz.github.io/ideogram/annotations-heatmap).

### annotationsLayout: 'histogram'
Lay out annotations in a histogram.  This clusters annoatations by location, such that each cluster or bin is shown as a bar.  The height of the bar represent the number of annotations in that genomic range.  This option is useful for summarizing the distribution of many (1000+) features througout the genome.  Example in [Annotations, histogram](https://eweitz.github.io/ideogram/annotations-histogram).

### annotationsLayout: 'overlay'
Lay out annotations directly over chromosomes.  This is the most space-efficient annotation layout option.  Example in [Annotations, overlaid](https://eweitz.github.io/ideogram/annotations-overlaid).

## annotationsPath
String.  Optional.  An absolute or relative URL to a JSON file containing annotation objects.  Example in [Annotations, overlaid](https://eweitz.github.io/ideogram/annotations-overlaid).

See also [annotations](#annotations).

## annotationTracks
Array.  Optional.  A list of objects with metadata for each track, e.g. DOM `id`, display name, color, shape.  Example in [Annotations, tracks](https://eweitz.github.io/ideogram/annotations-tracks).

## assembly
String.  Optional.  Default: latest RefSeq assembly for specified organism.  The genome assembly to display.  Takes assembly name (e.g. "GRCh37"), RefSeq accession (e.g. "GCF_000306695.2"), or GenBank accession (e.g. "GCA_000005005.5").  Example in [Annotations, histogram](https://eweitz.github.io/ideogram/annotations-histogram).

## barWidth
Number.  Optional.  Default: 3.  The pixel width of bars drawn when `annotationsLayout: 'histogram'`.  Example in [Annotations, histogram](https://eweitz.github.io/ideogram/annotations-histogram).

## brush
String.  Optional.  Default: null.  Genomic coordinate range (e.g. "chr1:104325484-119977655") for a [brush](https://github.com/d3/d3-brush) on a chromosome.  Useful when ideogram consists of one chromosome and you want to be able to focus on a region within that chromosome, and create an interactive sliding window to other regions.  Example in [Brush](https://eweitz.github.io/ideogram/brush).

## chrHeight
Number.  Optional.  Default: 400.  The pixel height of the tallest chromosome in the ideogram.  Examples in [Layout, small](https://eweitz.github.io/ideogram/layout_small) and [Annotations, basic](https://eweitz.github.io/ideogram/annotations-basic).

## chrMargin
Number.  Optional.  Default: 10.  The pixel space of the margin between each chromosome.  Example in [Multiple, primates](https://eweitz.github.io/ideogram/multiple-primates).

## chrWidth
Number.  Optional.  Default: 10.  The pixel width of each chromosome.  Example in [Annotations, tracks](https://eweitz.github.io/ideogram/annotations-tracks).

## chromosomes
Array.  Optional.  Default: all chromosomes in assembly.  A list of the names of chromosomes to display.  Useful for depicting a subset of the chromosomes in the genome, e.g. a single chromosome.  Example in [Annotations, basic](https://eweitz.github.io/ideogram/annotations-basic).

## container
String.  Optional.  Default: "body".  CSS selector of the HTML element that will contain the ideogram.  Example in [Layout, small](https://eweitz.github.io/ideogram/layout-small).

## dataDir
String.  Optional.  Default: "../data/bands/native/".  Absolute or relative URL of the directory containing data needed to draw banded chromosomes.  Example in [GeneExpressionAging/ideogram](https://ncbi-hackathons.github.io/GeneExpressionAging/ideogram).

## geometry
String.  Optional.  Use "geometry: collinear" to arrange all chromosomes in one line, unlike the usual parallel view.  Example in [Geometry, collinear](https://eweitz.github.io/ideogram/geometry-collinear).

## histogramScaling
String.  Optional.  Default: "absolute".  One of "absolute" or "relative".  The technique to use in scaling the height of histogram bars.  The "absolute" value sets bar height relative to tallest bar in _all_ chromosomes, while "relative" sets bar height relative to tallest bar in _each_ chromosome.

## heatmaps
Array.  Optional.  Array of heatmap objects.  Each heatmap object has a `key` string and a `thresholds` array.  The `key` property specifies the annotations key value to depict in the heatmap.  The `thresholds` property specifies a list of two-element "threshold" lists, where the first element is the threshold value and the second is the threshold color.  The threshold values are a list of ranges to use in coloring
the heatmap.  Threshold values are specified in ascending order.  Example in [Annotations, heatmap](https://eweitz.github.io/ideogram/annotations-heatmap).

## filterable
Boolean.  Optional.  Whether annotations should be filterable.  Example in [Annotations, histogram](https://eweitz.github.io/ideogram/annotations-histogram).

## fullChromosomeLabels
Boolean.  Optional.  Whether to include abbreviation species name in chromosome label.  Example in [Homology, interspecies](https://eweitz.github.io/ideogram/homology-interspecies).

## legend
Array.  Optional.  List of objects describing annotations.  Example in [Annotations, tracks](https://eweitz.github.io/ideogram/annotations-tracks).

## onBrushMove
Function.  Optional.  Callback function to invoke when brush moves.  Example in [Brush](https://eweitz.github.io/ideogram/brush).

## onDidRotate
Function.  Optional.  Callback function to invoke after chromosome has rotated.

## onDrawAnnots
Function.  Optional.  Callback function to invoke when annotations are drawn.  This is useful for when loading and drawing large annotation datsets.  Example in [web-tests.js](https://github.com/eweitz/ideogram/blob/b701dc0b76089842d50860c8c6cf5aa6d8dec564/test/web-test.js#L395).

## onLoad
Function.  Optional.  Callback function to invoke when chromosomes are loaded, i.e. rendered on the page.  Example in [Annotations, external data](https://eweitz.github.io/ideogram/annotations-external-data).

## onLoadAnnots
Function.  Optional.  Callback function to invoke when annotations are downloaded and ready for data transformation.

## onWillShowAnnotTooltip
Function.  Optional.  Callback function to invoke immediately before annotation tooltip is shown.  The tooltip shows the genomic range and, if available, name of the annotation.  This option can be useful to e.g. enhance the displayed annotation name, say by transforming a gene name into a hyperlink to a gene record web page.  Example in [Annotations, external data](https://eweitz.github.io/ideogram/annotations-external-data).

## organism
String or number or array.  Required.  Organism(s) to show chromosomes for.  Supply organism's name as a string (e.g. `"human"`) or organism's NCBI Taxonomy ID (taxid, e.g. `9606`) to display chromosomes from a single organism, or an array of organisms' names or taxids to display chromosomes from multiple species.  Example in [Human]( https://eweitz.github.io/ideogram/human).

## orientation
String.  Optional.  Default: horizontal.  The orientation of chromosomes on the page.  Example in [Mouse]( https://eweitz.github.io/ideogram/mouse).

## perspective
String.  Optional.  Use `perspective: 'comparative'` to enable annotations between two chromosomes, either within the same organism or different organisms.  Examples in [Homology, basic](https://eweitz.github.io/ideogram/homology-basic) and [Homology, interspecies](https://eweitz.github.io/ideogram/homology-interspecies).

## ploidy
Number.  Optional.  Default: 1.  The ploidy, i.e. number of chromosomes to depict for each chromosome set.  Useful for biologically accurate depicting of genomes that are diploid, triploid, etc.  Example in [Ploidy, basic](https://eweitz.github.io/ideogram/ploidy-basic).

## ploidyDesc
Array.  Optional.  Description of ploidy in each chromosome set in terms of ancestry composition.  Example in [Ploidy, recombination](https://eweitz.github.io/ideogram/ploidy-recombination).

## rangeSet
Array.  Optional.  List of objects describing segments of recombination among chromosomes in a chromosome set.  Example in Example in [Ploidy, recombination](https://eweitz.github.io/ideogram/ploidy-recombination).

## resolution
Number.  Optional.  Default: highest resolution available for specified genome assembly.  The resolution of cytogenetic bands to show for each chromosome.  The quantity refers to approximate value in bands per haploid set (bphs).  One of 450, 550, or 850.  Example in [Layout, small](https://eweitz.github.io/ideogram/layout-small).

## rotatable
Boolean.  Optional.  Default: true.  Whether chromosomes are rotatable upon clicking them.  Example in [Layout, small](https://eweitz.github.io/ideogram/layout-small).

## rows
Number.  Optional.  Default: 1.  Number of rows to arrange chromosomes into.  Useful for putting ideogram into a small container, or when dealing with genomes that have many chromosomes.  Example in [Layout, small](https://eweitz.github.io/ideogram/layout-small).

## sex
String.  Optional.  Default: male.  The biological sex of the organism.  Useful for omitting chromosome Y in female mammals.  Currently only supported for organisms that use XY sex-determination.  Examples in [Ploidy, basic](https://eweitz.github.io/ideogram/ploidy-basic).

## showBandLabels
Boolean.  Optional.  Default: false.  Whether to show cytogenetic band labels, e.g. 1q21.  Example in [Annotations, basic](https://eweitz.github.io/ideogram/annotations-basic).

## showChromosomeLabels
Boolean.  Optional.  Defaut: true.  Whether to show chromosome labels, e.g. 1, 2, 3, X, Y.  Example in [Annotations, basic](https://eweitz.github.io/ideogram/annotations-basic).

## showAnnotTooltip
Boolean.  Optional.  Default: true.  Whether to show a tooltip upon mousing over an annotation.  Example in [Multiple, trio SV](https://eweitz.github.io/ideogram/multiple-trio-sv).

## showFullyBanded
Boolean.  Optional.  Default: true.  Whether to show fully banded chromosomes for genomes that have sufficient data.  Useful for showing simpler chromosomes of cytogenetically well-characterized organisms, e.g. human, beside chromosomes of less studied organisms, e.g. chimpanzee.  Example in [Multiple, primates](https://eweitz.github.io/ideogram/multiple-primates).

## showNonNuclearChromosomes
Boolean.  Optional.  Default: false.  Whether to show non-nuclear chromosomes, e.g. for mitochondrial (MT) and chloroplast (CP) DNA.  Example in [Eukaryotes: Sus scrofa](https://eweitz.github.io/ideogram/eukaryotes?org=sus-scrofa).
