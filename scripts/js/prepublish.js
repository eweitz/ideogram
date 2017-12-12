var fs = require('fs');
var {execSync} = require('child_process');

fs.readFile('package.json', 'utf8', function(error, text) {
  var version = JSON.parse(text).version;
  fs.writeFile('src/js/version.js',
    'var version = \'' + version + '\';\n' +
    'export default version;'
  );
  execSync('npm install');
});
