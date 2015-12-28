#!/usr/bin/env node
/* eslint no-console: 0 */
'use strict';
let args = require('minimist')(process.argv.slice(2));
let fs = require('fs');
let cp = require('child_process');
let query = require('./lib/query');
let markdownToJSON = require('./lib/markdownToJSON');
let createDetails = require('./lib/createDetails');

let removeFileType = function (type) {
  return function (obj) {
    return new Promise(function (resolve, reject) {
      fs.unlink(obj[`${type}Path`], function (err) {
        if (err) {
          reject(err);
        }
        else {
          resolve(obj);
        }
      });
    });
  };
};

let moveToArchive = function (obj) {
  return new Promise(function (resolve, reject) {
    var read = fs.createReadStream(obj.mdPath);
    var stamp = new Date().toISOString();
    var write = fs.createWriteStream(`${obj.archivePath}${obj.fileName}_${stamp}.md`);
    read.on('error', reject);
    write.on('error', reject).on('finish', function () {
      resolve(obj);
    });
    read.pipe(write);
  });
};

let importToDb = function (obj) {
  return new Promise(function (resolve, reject) {
    cp.exec(query(obj.jsonPath, args), function (err) {
      if (err) {
        reject(err);
      }
      resolve(obj);
    });
  });
};

let writeDbFile = function (obj) {
  return new Promise(function (resolve, reject) {
    obj.data = markdownToJSON(obj.mdPath, obj.data);
    fs.writeFile(obj.jsonPath, obj.data, function (err) {
      if (err) {
        reject(err);
      }
      resolve(obj);
    });
  });
};


fs.readdir(createDetails().rootPath, function (err, files) {
  if (err) {
    throw new Error('Failed reading source directory');
  }

  files.forEach(function (file) {
    fs.readFile(createDetails().rootPath + file, 'utf8', function (er, data) {
      if (er) {
        // check if directory (no recursion)
        if (er.code === 'EISDIR') {
          // found a directory. skip it.
          return false;
        }
        throw new Error('Could not successfully read file ', er);
      }

      writeDbFile(createDetails(file, data))
        .then(importToDb)
        .then(moveToArchive)
        .then(removeFileType('json'))
        .then(removeFileType('md'))
        .then(function () {
          console.log('process complete');
        });
    });
  });
});
