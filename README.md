# ideogram

[![Build Status](https://travis-ci.org/eweitz/ideogram.svg?branch=master)](https://travis-ci.org/eweitz/ideogram)
[![Coverage Status](https://coveralls.io/repos/github/eweitz/ideogram/badge.svg)](https://coveralls.io/github/eweitz/ideogram)

[Ideogram.js](https://eweitz.github.io/ideogram/) is a JavaScript library for chromosome visualization. Ideogram supports drawing and animating genome-wide datasets for human, mouse and many other eukaryotes.

[![All human genes](https://raw.githubusercontent.com/eweitz/ideogram/master/examples/vanilla/ideogram_histogram_all_human_genes.png)](https://eweitz.github.io/ideogram/annotations_histogram.html)

Check out [live examples](https://eweitz.github.io/ideogram/), get [up and running](#installation) with your own deployment, skim [basic usage](#usage), or dive into the [full API](api.md)!  

# Installation

To link directly to the latest release, copy this snippet:
```
<script src="https://unpkg.com/ideogram@0.15.0/dist/js/ideogram.min.js"></script>
```

You can also easily use the library locally:
```
$ cd <your local web server document root>
$ git clone https://github.com/eweitz/ideogram.git
```

Then go to [http://localhost/ideogram/examples](http://localhost/ideogram/examples).

Or, if you use npm:
```
npm install ideogram
```

You can then [import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) Ideogram into an application like so:
```
import Ideogram from 'ideogram';
```


# Usage
```html
<head>
<<<<<<< HEAD
<<<<<<< HEAD
  <script src="https://unpkg.com/ideogram@0.14.0/dist/js/ideogram.min.js"></script>
=======
  <script src="https://unpkg.com/ideogram@0.14.0/dist/js/ideogram.min.js"></script>
>>>>>>> ce97ac39267ff93efa92c57cb467465fa1b7eda1
=======
  <script src="https://unpkg.com/ideogram@0.15.0/dist/js/ideogram.min.js"></script>
>>>>>>> 561160a256bddfbdb9d751a45cf5526e783d28ab
</head>
<body>
  <script>
      var ideogram = new Ideogram({
        organism: 'human',
        annotations: [{
          name: 'BRCA1',
          chr: '17',
          start: 43044294,
          stop: 43125482
        }]
      });
  </script>
</body>
```

Many more usage examples are available at https://eweitz.github.io/ideogram/.

You can also find examples of integrating Ideogram with JavaScript frameworks like [Angular](https://github.com/eweitz/ideogram/tree/master/examples/angular), [React](https://github.com/eweitz/ideogram/tree/master/examples/react), and [Vue](https://github.com/eweitz/ideogram/tree/master/examples/vue), as well as data science platforms like [R](https://github.com/eweitz/ideogram/tree/master/examples/r) and [Jupyter Notebook](https://github.com/eweitz/ideogram/tree/master/examples/jupyter). 


# API

See the [Ideogram API reference](api.md) for detailed documentation on configuration options and methods.
