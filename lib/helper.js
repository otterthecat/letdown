var fs = require('fs'),
    md = require('markdown-it')(),
    parseMeta, parseTitle, parseTimestamp, meta = {};

parseMeta = function(str){
  return str.replace(/^<\!--\n([a-zA-Z0-9_\-: \n]+)?\n-->\n/, function(match, n1){
    n1.trim().split('\n').forEach(function(item){
      var keyVal = item.split(': ');
      meta[keyVal[0]] = keyVal[1];
    });
    return '';
  });
};

parseTitle = function(str){
  var title = str.match(/^(#{1})[- !:()a-zA-Z]+?\n/gi)[0];
  return title
};

parseTimestamp = function(path){
  var mtime = fs.statSync(path).mtime,
      date = new Date(mtime),
      isoString = date.toISOString();
  return isoString.substring(0, isoString.length - 1) + '+0' + (date.getTimezoneOffset() / 60) + '00';
};

exports.createJSON = function(path, contents){

  contents = parseMeta(contents).trim();
  var title = parseTitle(contents).trim();
  var timestamp = parseTimestamp(path);
  var post = md.render(contents.replace(title, '' ).trim()).replace(/\n/g, '');
  meta.title = title.substr(2);
  meta.date = {
    "$date": timestamp
  }
  meta.post = post;

  return '[\n' + JSON.stringify(meta) + '\n]';
};