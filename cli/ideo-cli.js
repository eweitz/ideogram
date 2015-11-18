#! /usr/bin/env node

var program = require('commander');

function list(val) {
  return val.split(',');
}

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
