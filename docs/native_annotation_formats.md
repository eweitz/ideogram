# Native annotation formats

Ideogram.js supports specifying annotations in native formats, in addition to standard bioinformatics file formats like BED.

These native Ideogram annotation formats have two dimensions: density and origin.  Particular formats excel in different scenarios.  The default annotation format is designed for ease of use, but sophisticated extensions are possible.

Note that these native formats all have a similar schema.  They are distinguished implicitly by their data layout, not explicitly as ideogram configuration properties.

## Density and origin
The density of annotation properties can be dense, where each genomic feature (e.g. each gene) has annotations on all tracks, or sparse, where each feature has an annotation on only one track.

The origin of optional annotation properties can be the client, as a parameter used in ideogram configuration, or the server, as a key in the annotation data file.

## Use case matrix
These two dimensions of annotation formats – density and origin – each have two values.  Density can be dense or sparse.  Origin can be client or server.  

Thus, four broad annotation formats are supported, each optimizing for specific trade-offs of user and developer experience and capacity, as well as different biological use cases.

| Format | Control | Configuration | Transfer | Information |  Usabliity |  Developer capacity | Example scenario |
|---|---|---|---|---|---|---|---|
| Sparse client | Dynamic | Complex | Fast | Low | Interactive and glanceable | Front-end | Clinical variation |
| Sparse server | Static | Simple | Fast | Low | Easy and glanceable |  Front-end | Clinical variation  |
| Dense client | Dynamic |  Complex | Slow | High | Interactive and rich | Back-end | Gene expression research |
| Dense server | Static | Simple | Slow | High | Easy and rich | Back-end | Gene expression research |

## Advanced formats
Ideogram provides a simple, easy, and fast annotation interface by default.  The defaults can be adjusted with minor developer effort.  Advanced implementations of annotation formatting are also possible.  

For example, server annotation property keys can be overridden by client keys, providing easy defaults that can be dynamically configured.  In fact, in the absence of server keys, Ideogram will fall back on built-in default values for all optional keys.  

Sparse annotations can also be augmented on the client to show dense, rich information for each genomic feature.  This can enable inflating compressed annotation datasets via client-side functions, or allow users of such ideogram embeds to easily move from one annotation display layout to another.

Such implementations increase application size and complexity, but provide tailored performance and enhance usage flexibility.
