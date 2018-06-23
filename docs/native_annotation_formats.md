# Annotation formats

Ideogram supports multiple native annotation formats, in addition to standard bioinformatics file formats like BED.  These native formats have two dimensions: density and origin.  Particular annotation formats excel in different scenarios.  The default annotation format is designed for ease of use, but sophisticated extensions are possible.

## Density and origin
The density of annotation properties can take a dense form where a genomic feature (e.g. a gene) has annotations on all tracks, or a sparse form where a feature has an annotation on only one track.

The origin of annotation properties can be on the client, as a parameter used in ideogram configuration, or on the server, as a key in the annotation data file.  

## Use case matrix
These two dimensions of annotation formats – density and origin – each have two values.  Density can be dense or sparse.  Origin can be client or server.  

Thus, four broad annotation formats are supported, each optimizing for specific trade-offs of user and developer experience and capacity, as well as different biological use cases.

Control: dynamic, static; Configuration: simple, complex; Transfer: fast, slow; Information: high, low.

* Sparse client: Dynamic, complex, fast, low.  Interactive and glanceable.  Clinical, front-end.
* Sparse server: Static, simple, slow, low.  Easy and glanceable.  Clinical, back-end. 
* Dense client: Dynamic, complex, slow, low.  Interactive and rich.  Expression, front-end.
* Dense server: Static, simple, slow, low.  Easy and rich.  Expression, back-end.

## Advanced formats

Ideogram provides a simple, easy, and fast annotation interface by default.  The defaults can be adjusted with minor developer effort.  Advanced implementations of annotation formatting are also possible.  

For example, server annotation property keys can be overridden by client keys, providing easy defaults that can be dynamically configured.  In fact, in the absence of server keys, Ideogram will fall back on built-in default values for all optional keys.  

Sparse annotations can also be augmented on the client to show dense, rich information.  This enables users of such ideogram embeds to easily move from one annotation perspective to another.

Such implementations increase application size and complexity, but provide tailored performance and enhance usage flexibility.