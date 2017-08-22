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
* [annotations](#annotations)
* [annotationHeight](#annotationheight)
* [annotationsColor](#annotationscolor)
* [annotationsLayout](#annotationslayout)
* [annotationsPath](#annotationspath)
* [assembly](#assembly)
* [barWidth](#barwidth)
* [brush](#brush)
* [chrHeight](#chrheight)
* [chrMargin](#chrmargin)
* [chrWidth](#chrwidth)
* [chromosomes](#chromosomes)
* [container](#container)
* [dataDir](#dataDir)
* [multiorganism](#multiorganism)
* [onBrushMove](#onbrushmove)
* [onDrawAnnots](#ondrawannots)
* [onLoad](#onLoad)
* [organism](#organism)
* [orientation](#orientation)
* [ploidy](#ploidy)
* [resolution](#resolution)
* [rotatable](#rotatable)
* [rows](#rows)
* [showBandLabels](#showbandlabels)
* [showChromosomeLabels](#showchromosomelabels)
* [showFullyBanded](#showfullybanded)
* [showNonNuclearChromosomes](#shownonnuclearchromosomes)

## annotations
Array.  Optional.  A list of annotation objects.  Each annotation object has at least a chromosome name (chr), start coordinate (start), and stop coordinate (stop).  Annotation objects can also have a name, color, shape, and track index.  Example in [Annotations, basic](https://eweitz.github.io/ideogram/annotations_basic.html).

See also [annotationsPath](#annotationspath).

## annotationHeight
Number.  Optional.  The height of each annotation. Example in [Annotations, tracks](https://eweitz.github.io/ideogram/annotations_tracks.html).

## annotationsColor
String.  Optional.  Default: "#F00" (i.e., red).  The color of each annotation.  Example in [Multiple, primates](https://eweitz.github.io/ideogram/multiple_primates.html).

## annotationsLayout
String.  Optional.  Default: "tracks".  

The layout of this ideogram's annotations.  One of "tracks", "histogram", or "overlay".

### annotationsLayout: 'tracks'
Lay out annotations in tracks beside each chromosome.  There can be more than one track, which is useful for displaying annotations by category (e.g. pathogenic, unknown significance, benign).  Example in [Annotations, tracks](https://eweitz.github.io/ideogram/annotations_tracks.html).

### annotationsLayout: 'histogram'
Lay out annotations in a histogram.  This clusters annoatations by location, such that each cluster or bin is shown as a bar.  The height of the bar represent the number of annotations in that genomic range.  This option is useful for summarizing the distribution of many (1000+) features througout the genome.  Example in [Annotations, histogram](https://eweitz.github.io/ideogram/annotations_histogram.html).

### annotationsLayout: 'overlay'
Lay out annotations directly over chromosomes.  This is the most space-efficient annotation layout option.  Example in [Annotations, overlay](https://eweitz.github.io/ideogram/annotations_overlay.html).

## annotationsPath
String.  Optional.  An absolute or relative URL to a JSON file containing annotation objects.  Example in [Annotations, overlay](https://eweitz.github.io/ideogram/annotations_overlay.html).

See also [annotations](#annotations).

## assembly
String.  Optional.  Default: latest RefSeq assembly for specified organism.  The genome assembly to display.  Takes assembly name (e.g. "GRCh37"), RefSeq accession (e.g. "GCF_000306695.2"), or GenBank accession (e.g. "GCA_000005005.5").

## barWidth
Number.  Optional.  Default: 3.  The pixel width of bars drawn when `annotationsLayout: 'histogram'`.  Example in [Annotations, histogram](https://eweitz.github.io/ideogram/annotations_histogram.html).

## brush
Boolean.  Optional.  Default: false.  Flag to set a [brush](https://github.com/d3/d3-brush) (a.k.a. slider window) on a chromosome.  Useful when ideogram consists of one chromosome and you want to be able to focus on a region within that chromosome.  Example in [Brush](https://eweitz.github.io/ideogram/brush.html).

## chrHeight
Number.  Optional.  Default: 400.  The pixel height of the tallest chromosome in the ideogram.  Examples in [Layout, small](https://eweitz.github.io/ideogram/layout_small.html) and [Annotations, basic](https://eweitz.github.io/ideogram/annotations_basic.html).

## chrMargin
Number.  Optional.  Default: 10.  The pixel space of the margin between each chromosome.

## chrWidth
Number.  Optional.  Default: 10.  The pixel width of each chromosome.

## chromosomes
Array.  Optional.  Default: all chromosomes in assembly.  A list of the names of chromosomes to display.  Useful for depicting a subset of the chromosomes in the genome, e.g. a single chromosome.

## container
String.  Optional.  Default: "body".  CSS selector of the HTML element that will contain the ideogram.  Example in [Layout, small](https://eweitz.github.io/ideogram/layout_small.html).

## dataDir
String.  Optional.  Default: "../data/bands/native/".  Absolute or relative URL of the directory containing data needed to draw banded chromosomes.  Example in [GeneExpressionAging/ideogram](https://ncbi-hackathons.github.io/GeneExpressionAging/ideogram).

## multiorganism
Boolean.  Optional.  Default: false.  Flag to indicate if this ideogram contains chromosomes from multiple organisms.

## onBrushMove
Function.  Optional.  Callback function to invoke when brush moves.  Example in [Brush](https://eweitz.github.io/ideogram/brush.html).

## onDrawAnnots
Function.  Optional.  Callback function to invoke when annotations are drawn.

## onLoad
Function.  Optional.  Callback function to invoke when chromosomes are loaded, i.e. rendered on the page.

## organism
String or number or array.  Required.  Organism(s) to show chromosomes for.  Supply organism's name as a string (e.g. `"human"`) or organism's NCBI Taxonomy ID (taxid, e.g. `9606`) to display chromosomes from a single organism, or an array of organisms' names or taxids to display chromosomes from multiple species.  Example in [Human]( https://eweitz.github.io/ideogram/human.html).

## orientation
String.  Optional.  Default: horizontal.  The orientation of chromosomes on the page.  Example in [Mouse]( https://eweitz.github.io/ideogram/mouse.html).

## ploidy
Number.  Optional.  Default: 1.  The ploidy -- i.e., number of chromosomes -- to depict for each chromosome set.  Useful for biologically accurate depicting of genomes that are diploid, triploid, etc.  Example in [Layout, small](https://eweitz.github.io/ideogram/layout_small.html).

## resolution
Number.  Optional.  Default: highest resolution available for specified genome assembly.  The resolution of cytogenetic bands to show for each chromosome.  The quantity refers to approximate value in bands per haploid set (bphs).  One of 450, 550, or 850.

## rotatable
Boolean.  Optional.  Default: true.  Whether chromosomes are rotatable upon clicking them.  Example in [Layout, small](https://eweitz.github.io/ideogram/layout_small.html).

## rows
Number.  Optional.  Default: 1.  Number of rows to arrange chromosomes into.  Useful for putting ideogram into a small container, or when dealing with genomes that have many chromosomes.  Example in [Layout, small](https://eweitz.github.io/ideogram/layout_small.html).

## sex
String.  Optional.  Default: male.  The biological sex of the organism.  Useful for omitting chromosome Y in female mammals.  Currently only supported for organisms that use XY sex-determination.  Examples in [Layout, small](https://eweitz.github.io/ideogram/layout_small.html)

## showBandLabels
Boolean.  Optional.  Default: false.  Whether to show cytogenetic band labels, e.g. 1q21.

## showChromosomeLabels
Boolean.  Optional.  Defaut: true.  Whether to show chromosome labels, e.g. 1, 2, 3, X, Y.

## showFullyBanded
Boolean.  Optional.  Default: true.  Whether to show fully banded chromosomes for genomes that have sufficient data.  Useful for showing simpler chromosomes of cytogenetically well-characterized organisms, e.g. human, beside chromosomes of less studied organisms, e.g. chimpanzee.

## showNonNuclearChromosomes
Boolean.  Optional.  Default: false.  Whether to show non-nuclear chromosomes, e.g. for mitochondrial (MT) and chloroplast (CP) DNA.
