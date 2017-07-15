# ideogram

[![Build Status](https://travis-ci.org/eweitz/ideogram.svg?branch=master)](https://travis-ci.org/eweitz/ideogram)

Chromosome visualization with D3.js

[![All human genes](https://raw.githubusercontent.com/eweitz/ideogram/master/examples/ideogram_histogram_all_human_genes.png)](http://eweitz.github.io/ideogram/annotations_histogram.html)

More examples: http://eweitz.github.io/ideogram/

# Installation

```
$ cd <your local web server document root>
$ git clone https://github.com/eweitz/ideogram.git
```

Then go to [http://localhost/ideogram/examples](http://localhost/ideogram/examples).

# Usage
```html
<head>
  <link type="text/css" rel="stylesheet" href="../dist/css/ideogram.css">
  <script type="text/javascript" src="../dist/js/ideogram.min.js"></script>
</head>
<body>
  <script type="text/javascript">
      var ideogram = new Ideogram({
          organism: "human",
          annotations: [{
            "name": "BRCA1",
            "chr": "17",
            "start": 43044294,
            "stop": 43125482
          }]
        });
  </script>
</body>
```
