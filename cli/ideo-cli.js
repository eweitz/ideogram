#! /usr/bin/env node

var program = require('commander');

function list(val) {
  return val.split(',');
}

program
  .version('0.1.0')
  .option('--taxid <n>', 'NCBI Taxonomy ID', parseInt)
  .option('--chromosomes <items>', 'Array of chromosomes', list)
  .option('--chr-width <n>', 'Chromosome width', parseInt)
  .option('--chr-height <n>', 'Chromosome height')
  .option('--chr-margin <n>', 'Chromosome margin')
  .option('--show-band-labels', 'Show band labels flag')
  .option('--show-chromosome-labels', 'Show chromosome labels flag')
  .option('--orientation <value>', 'Chromosome orientation')
  .option('--local-annotations-path <value>',
    'Path to local JSON annotations file');

program.parse(process.argv);

console.log("Producing ideogram for taxid " + program.taxid);
