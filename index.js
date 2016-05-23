#!/usr/bin/env node
/* eslint no-console: 0 */
'use strict';
let args = require('minimist')(process.argv.slice(2));
let fs = require('fs');
let cp = require('child_process');
let markdownToJSON = require('./lib/markdownToJSON');
let createDetails = require('./lib/createDetails');
let Mongonaut = require('mongonaut');
let errorHandler = require('./lib/errorhandler');

let mongonaut = new Mongonaut({
  'user': args.u,
  'pwd': args.p,
  'db': args.d,
  'collection': args.c
});

let completePromise = function (resolve, reject, obj) {
  return function (err) {
    if (err) {
      reject(err);
    }
    else {
      resolve(obj);
    }
  }
};

let removeFileType = function (type) {
  return function (obj) {
    return new Promise(function (resolve, reject) {
      fs.unlink(obj[`${type}Path`], completePromise(resolve, reject, obj));
    });
  };
};

let moveToArchive = function (obj) {
  return new Promise(function (resolve, reject) {
    let details = createDetails(obj[0].file);
    let read = fs.createReadStream(details.mdPath);
    let stamp = new Date().toISOString();
    let write = fs.createWriteStream(`${details.archivePath}${details.fileName}_${stamp}.md`);
    read.on('error', reject);
    write.on('error', reject).on('finish', function () {
      resolve(details);
    });
    read.pipe(write);
  });
};

let isMarkdown = function (file) {
  return file.substr(file.lastIndexOf('.') + 1) === 'md';
};

let importToDb = function (obj) {
  return mongonaut.import(obj.jsonPath);
};

let writeDbFile = function (obj) {
  return new Promise(function (resolve, reject) {
    obj.data = markdownToJSON(obj.mdPath, obj.data);
    fs.writeFile(obj.jsonPath, obj.data, completePromise(resolve, reject, obj))
  });
};

fs.readdir(createDetails().rootPath, function (err, files) {
  if (err) {
    throw new Error('Failed reading source directory');
  }

  files.filter(isMarkdown).forEach(function (file) {
    fs.readFile(createDetails().rootPath + file, 'utf8', function (er, data){
      writeDbFile(createDetails(file, data), errorHandler)
        .then(importToDb, errorHandler)
        .then(moveToArchive, errorHandler)
        .then(removeFileType('json'), errorHandler)
        .then(removeFileType('md'), errorHandler)
        .then(function () {
          console.log('process complete');
        }, errorHandler);
    });
  });
});
