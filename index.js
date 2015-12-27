#!/usr/bin/env node
/* eslint no-console: 0 */
'use strict';
let args = require('minimist')(process.argv.slice(2));
let fs = require('fs');
let cp = require('child_process');
let query = require('./lib/query');
let markdownToJSON = require('./lib/markdownToJSON');

const FILE_PATH = process.env.MD_POSTS_DIR;

let removeDbFile = function (obj) {
  return new Promise(function (resolve, reject) {
    fs.unlink(obj.db, function (err) {
      if (err) {
        reject(err);
      }
      else {
        resolve(obj);
      }
    });
  });
};

let removeMdFile = function (obj) {
  return new Promise(function (resolve, reject) {
    fs.unlink(obj.md, function (err) {
      if (err) {
        reject(err);
      }
      else {
        resolve(obj);
      }
    });
  });
};

let moveToArchive = function (sourcePath) {
  return new Promise(function (resolve, reject) {
    var fileName = sourcePath.substring(sourcePath.lastIndexOf('/') + 1, sourcePath.lastIndexOf('.'));
    var read = fs.createReadStream(`${FILE_PATH}${fileName}.md`);
    var stamp = new Date().toISOString();
    var write = fs.createWriteStream(`${FILE_PATH}archive/${fileName}_${stamp}.md`);
    read.on('error', reject);
    write.on('error', reject).on('finish', function () {
      resolve({
        "db": sourcePath,
        "md": `${FILE_PATH}${fileName}.md`,
        "archive": `${FILE_PATH}archive/${fileName}_${stamp}.md`
      });
    });
    read.pipe(write);
  });
};

let importToDb = function (dataFile) {
  return new Promise(function (resolve, reject) {
    cp.exec(query(dataFile, args), function (err) {
      if (err) {
        reject(err);
      }
      resolve(dataFile);
    });
  });
};

let writeDbFile = function (file, json) {
  return new Promise(function (resolve, reject) {
    var data = markdownToJSON(FILE_PATH + file, json);
    var path = `${FILE_PATH}${file.substr(0, file.lastIndexOf('.'))}.json`;
    fs.writeFile(path, data, function (err) {
      if (err) {
        reject(err);
      }
      resolve(path);
    });
  });
};


fs.readdir(FILE_PATH, function (err, files) {
  if (err) {
    throw new Error(`Failed reading directory ${FILE_PATH}`);
  }

  files.forEach(function (file) {
    fs.readFile(FILE_PATH + file, 'utf8', function (er, data) {
      if (er) {
        // check if directory (no recursion)
        if (er.code === 'EISDIR') {
          // found a directory. skip it.
          return false;
        }
        throw new Error('Could not successfully read file ', er);
      }

      writeDbFile(file, data)
        .then(importToDb)
        .then(moveToArchive)
        .then(removeDbFile)
        .then(removeMdFile)
        .then(function () {
          console.log('process complete');
        });
    });
  });
});
