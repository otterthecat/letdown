#!/usr/bin/env node
/* eslint no-console: 0 */
'use strict';
let args = require('minimist')(process.argv.slice(2));
let fs = require('fs');
let cp = require('child_process');
let helper = require('./lib/helper');

let filePath = process.env.MD_POSTS_DIR;

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
    var read = fs.createReadStream(`${filePath}${fileName}.md`);
    var stamp = new Date().toISOString();
    var write = fs.createWriteStream(`${filePath.replace('new', 'archive')}${fileName}_${stamp}.md`);
    read.on('error', reject);
    write.on('error', reject).on('finish', function () {
      resolve({
        'db': sourcePath,
        'md': `${filePath}${fileName}.md`,
        'archive': `${filePath.replace('new', 'archive')}${fileName}_${stamp}.md`
      });
    });
    read.pipe(write);
  });
};

let importToDb = function (dataFile) {
  return new Promise(function (resolve, reject) {
    cp.exec(helper.createQueryString(dataFile, args), function (err) {
      if (err) {
        reject(err);
      }
      resolve(dataFile);
    });
  });
};

let writeDbFile = function (file, json) {
  return new Promise(function (resolve, reject) {
    var data = helper.createJSON(filePath + file, json);
    var path = `${filePath}/db/${file.substr(0, file.lastIndexOf('.'))}.json`;
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
