'use strict';
let fs = require('fs');
let md = require('markdown-it')();
let parseMeta, parseTitle, parseTimestamp, parsedContent = {};

parseMeta = function (str) {
  return str.replace(/^<\!--\n([a-zA-Z0-9_\-,: \n]+)?\n-->\n/, function (match, n1) {
    n1.trim().split('\n').forEach(function (item) {
      let keyVal = item.split(': ');
      let key = keyVal[0];
      let val = keyVal[1];
      // meta values are to be interpreted as arrays if commas are found
      if (val.indexOf(',') > -1) {
        // trim whitespace between commas & words so when broken into array
        // there is no leading/trailing whitespace
        val = val.replace(/, +/g, ',').split(',');
      }
      parsedContent[key] = val;
    });
    return '';
  });
};

parseTitle = function (str) {
  let title = str.match(/^(#{1})[- !:()a-z0-9]+/i);
  return title ? title[0] : false;
};

parseTimestamp = function (path) {
  let date = new Date(fs.statSync(path).mtime);
  return date.toISOString();
};

module.exports = function (path, contents) {
  contents = parseMeta(contents).trim();
  let title = parseTitle(contents);
  if (!title) {
    throw new Error('JSON not created. Title could not be parsed.');
  }
  title.trim();
  parsedContent.title = title.substr(2);
  parsedContent.date = {
    '$date': parseTimestamp(path)
  };
  parsedContent.post = md.render(contents.replace(title, '').trim()).replace(/\n/g, '');

  return `[\n ${JSON.stringify(parsedContent).trim()} \n]`;
};