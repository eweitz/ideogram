var fs = require('fs');

fs.readFile('package.json', 'utf8', function(error, text) {
  var json = JSON.parse(text);
  fs.writeFile('src/js/version.js', 
    'var version = \'' + json.version + '\';\n' + 
    'export default version;'
  );
});
