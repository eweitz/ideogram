function downloadAnnotations() {

  const ideo = this;
  const annots = {};

  ideo.annots.forEach(chrAnnots => {
    chrAnnots.annots.forEach(annot => {
      const desc = ideo.annotDescriptions.annots[annot.name];

      annots[annot.name] = [
        annot.name, desc.ensemblId,
        annot.chr, annot.start, annot.stop, annot.length,
        desc.type
      ];
    });
  });

  const header = [
    '# Gene name', 'Ensembl ID', 'Chromosome', 'Start', 'Stop', 'Length', 'Type'
  ];
  const rows = [header].concat(Object.values(annots));
  const annotsTsv =
    ideo.annotDescriptions.headers + '\n#\n' +
    rows.map(row => row.join('\t')).join('\n');

  const annotsHref =
    'data:text/plain;charset=utf-8,' + encodeURIComponent(annotsTsv);

  var evt = new MouseEvent('click', {
    view: window,
    bubbles: false,
    cancelable: true
  });

  var a = document.createElement('a');
  a.setAttribute('download', 'ideogram.tsv');
  a.setAttribute('href', annotsHref);
  a.setAttribute('target', '_blank');

  // Enables easy testing
  a.setAttribute('id', '_ideo-undisplayed-dl-annots-link');
  a.setAttribute('style', 'display: none;');
  document.body.appendChild(a);

  a.dispatchEvent(evt);
}

export {downloadAnnotations};
