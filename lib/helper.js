'use strict';
let fs = require('fs');
let md = require('markdown-it')();

let parseMeta, parseTitle, parseTimestamp, meta = {};

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
      meta[key] = val;
    });
    return '';
  });
};

parseTitle = function (str) {
  let title = str.match(/^(#{1})[- !:()a-z0-9]+/i);
  return title ? title[0] : false;
};

parseTimestamp = function (path) {
  let mtime = fs.statSync(path).mtime,
      date = new Date(mtime);
  return date.toISOString();
};

exports.createJSON = function (path, contents) {
  contents = parseMeta(contents).trim();
  let title = parseTitle(contents);
  if (!title) {
    throw new Error('JSON not created. Title could not be parsed.');
  }
  title.trim();
  meta.title = title.substr(2);
  meta.date = {
    '$date': parseTimestamp(path)
  };
  meta.post = md.render(contents.replace(title, '').trim()).replace(/\n/g, '');

  return `[\n ${JSON.stringify(meta).trim()} \n]`;
};

exports.createQueryString = function (path, user) {
  if (!user.u || !user.p) {
    throw new Error('you must authenticate your db using -u and -p flags');
  }
  return `mongoimport --host localhost --db foobar -u ${user.u} -p ${user.p} --authenticationDatabase foobar --collection posts < ${path} --jsonArray`;
};
