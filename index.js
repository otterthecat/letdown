#!/usr/bin/env node
/* eslint no-console: 0 */
'use strict';
let args = require('minimist')(process.argv.slice(2));
let fs = require('fs');
let cp = require('child_process');
let markdownToJSON = require('./lib/markdownToJSON');
let createDetails = require('./lib/createDetails');
let errorHandler = require('./lib/errorhandler');

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

      writeDbFile(createDetails(file, data), errorHandler)
        .then(function () {
          console.log('process complete');
        }, errorHandler);
    });
  });
});
