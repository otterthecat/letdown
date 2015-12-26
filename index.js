#!/usr/bin/env node
/* eslint no-console: 0 */
'use strict';
let args = require('minimist')(process.argv.slice(2));
let fs = require('fs');
let cp = require('child_process');
let helper = require('./lib/helper');

let filePath = process.env.MD_POSTS_DIR,
    cmdString = helper.createQueryString(filePath, args);

let removeFile = function (targetFile) {
  return new Promise(function (resolve, reject) {
    fs.unlink(targetFile, function (err) {
      if (err) {
        reject(err);
      }
      else {
        resolve();
      }
    });
  });
};

let moveToArchive = function (sourcePath) {
  return new Promise(function (resolve, reject) {
    var read = fs.createReadStream(sourcePath);
    var stamp = new Date().toISOString();
    var write = fs.createWriteStream(`${filePath.replace('new', 'archive')}_post_${stamp}.json`);
    read.on('error', reject);
    write.on('error', reject).on('finish', function () {
      resolve(sourcePath);
    });
    read.pipe(write);
  });
};

let importToDb = function () {
  return new Promise(function (resolve, reject) {
    cp.exec(cmdString, function (err) {
      if (err) {
        reject(err);
      }
      resolve(`${filePath}/db/mongo_insertion.json`);
    });
  });
};

let writeDbFile = function (data) {
  return new Promise(function (resolve, reject) {
    var path = `${filePath}/db/mongo_insertion.json`;
    fs.writeFile(path, data, function (err) {
      if (err) {
        reject(err);
      }
      resolve(path);
    });
  });
};


fs.readdir(filePath, function (err, files) {
  if (err) {
    throw new Error(`Failed reading directory ${filePath}`);
  }

  files.forEach(function (file) {
    fs.readFile(filePath + file, 'utf8', function (er, data) {
      if (er) {
        // check if directory (no recursion)
        if (er.code === 'EISDIR') {
          console.log('file is a directory. Skipping it.');
          return false;
        }
        throw new Error('Could not successfully read file ', er);
      }

      writeDbFile(helper.createJSON(filePath + file, data))
        .then(importToDb)
        .then(moveToArchive)
        .then(removeFile)
        .then(function () {
          console.log('process complete');
        });
    });
  });
});
