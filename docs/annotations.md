# Annotations

Ideogram.js enables developers to load sets of annotations formatted in JSON.  This can be used to retrieve annotation data from a server, if embedding Ideogram in a web application; or to retrieve annotations from a local file system, if using Ideogram through its command-line interface.  

## Efficiency
When combined with standard `gzip` compression, the compact design of the JSON enables efficient network transmission of annotation data.  A compressed Ideogram annotation set of 21,832 human genes, including data on expression level and gene type, is 337 KB in size and takes less than 700 ms to download on a regular 4G connection (4 Mb/s download bandwidth, 20 ms latency) as measured using Chrome Developer Tools.

## Format
Each annotation in an Ideogram annotation set is represented by an array.  The meaning of elements in each of those arrays is indicated by a single array of keys at the top level of the annotation set JSON object.  To further reduce file size, annotations are grouped by chromosome, eliminating the need to specify chromosome name in each annotation.

Annotations must have at least three elements: name, start position and length.  Annotations may also have elements with integer values defining either A) track index or B) filter index.  Track index is the ordinal position of the track in which the annotation will appear.  Filter index maps to a value in an array of objects defining more filter information, including label (e.g. "Likely pathogenic") and a string identifier (e.g. `likely-pathogenic`) than can be used as a part of a DOM selector or URL parameter specifying the filter.

## Example
```
{ 
  "keys": ["name", "start", "length", "expression-level", "gene-type"]
  "annots": [{
    "chr": "1",
    "annots": [
      ["MTOR", 11106535, 155972, 5, 5],
      ["F5", 169514166, 72422, 4, 2],
  },
  {
    "chr": "2",
    "annots": [
      ["APOB", 21001429, 42644, 2, 5],
      ["CASP8", 201233443, 54268, 6, 5]
  }
  ]
}
```
