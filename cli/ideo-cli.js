#! /usr/bin/env node

var program = require('commander');

program.on('--help', function(){
  console.log('  Example:');
  console.log('');
  console.log('    ideogram ' +
    '--taxid 9606 ' +
    '--chromosomes 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,X,Y ' +
    '--chr-width 10 ' +
    '--chr-height 500 ' +
    '--chr-margin 10 ' +
    '--show-band-labels true ' +
    '--show-chromosome-labels true ' +
    '--orientation horizontal ' +
    '--local-annotations-path data/annotations/100_virtual_snvs.json'
  );
  console.log('');
});

program
  .version('0.1.0')
  .option('--taxid <n>', 'NCBI Taxonomy ID', parseInt)
  .option('--chromosomes <value>', 'Array of chromosomes')
  .option('--chr-width <n>', 'Chromosome width', parseInt)
  .option('--chr-height <n>', 'Chromosome height')
  .option('--chr-margin <n>', 'Chromosome margin')
  .option('--show-band-labels', 'Show band labels flag')
  .option('--show-chromosome-labels', 'Show chromosome labels flag')
  .option('--orientation <value>', 'Chromosome orientation')
  .option('--local-annotations-path <value>',
    'Path to local JSON annotations file');

program.parse(process.argv);


var path = require('path'),
    phantomjs = require('phantomjs'),
    binPath = phantomjs.path,
    readline = require('readline'),
    spawn = require('child_process').spawn;

var batchRender = binPath;
var batchRenderArgs = process.argv.slice(2);
batchRenderArgs.splice(0,0,path.join(__dirname, 'batch-render.js'));

var br = spawn(batchRender, batchRenderArgs);

readline.createInterface({
  input: br.stdout,
  terminal: false
}).on('line', function(line) {
  console.log(line);
});

readline.createInterface({
  input: br.stderr,
  terminal: false
}).on('line', function(line) {
  console.log(line);
});

br.on('exit', function() {
  process.exit(0);
})

process.on('exit', function() {
    br.kill();
});
