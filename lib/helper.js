var fs = require('fs'),
    md = require('markdown-it')(),
    parseTitle, parseTimestamp;

exports.parseTitle = parseTitle = function(str){
  var title = str.match(/^(#{1})[- !:()a-zA-Z]+?\n/gi)[0];
  return title
};

exports.parseTimestamp = parseTimestamp = function(path){
  var mtime = fs.statSync(path).mtime,
      date = new Date(mtime),
      isoString = date.toISOString();
  return isoString.substring(0, isoString.length - 1) + '+0' + (date.getTimezoneOffset() / 60) + '00';
};

exports.createJSON = function(path, contents){
  var title = parseTitle(contents).trim();
  var timestamp = parseTimestamp(path);
  var post = md.render(contents.replace(title, '' ).trim()).replace(/\n/g, '');
  var jsonString = '[\n';
  jsonString += '{"title": "' + title.substr(2) + '", "date": {"$date": "' + timestamp + '"}, "post": "' + post + '"}';
  jsonString += '\n]';
  return jsonString;
};