var fs = require('fs'),
    md = require('markdown-it')(),
    parseTitle, parseTimestamp;

exports.parseTitle = parseTitle = function(str){
  var title = str.match(/^(#{1})[- !:()a-zA-Z]+?\n/gi)[0];
  return title
};

exports.parseTimestamp = parseTimestamp = function(path){
  return fs.statSync(path).mtime;
};

exports.createJSON = function(path, contents){
  var title = parseTitle(contents).trim();
  var timestamp = parseTimestamp(path);
  var post = md.render(contents.replace(title, '' ).trim()).replace(/\n/g, '');
  var jsonString = '[\n';
  jsonString += '{"title": "' + title.substr(2) + '", "timestamp": "' + timestamp + '", "post": "' + post + '"}';
  jsonString += '\n]';
  return jsonString;
};