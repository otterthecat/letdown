#!/usr/bin/env node
/* eslint no-console: 0 */
'use strict';
let fs = require('fs');
let cp = require('child_process');
let helper = require('./lib/helper');

let filePath = process.env.MD_POSTS_DIR,
    cmdString = `mongoimport --host localhost --db foobar --collection posts < ${filePath}/db/mongo_insertion.json --jsonArray`;

let importToDb = function () {
  cp.exec(cmdString, function (er) {
    if (er) {
      throw new Error ('Failed to import to DB');
    }

    console.log('insertion complete');
    console.log('cleaing up json file');
    fs.unlink(`${filePath}/db/mongo_insertion.json`, function () {
      console.log('clean up complete.');
      console.log('Get back to work');
    });
  });
};

let writeDbFile = function (data) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(`${filePath}/db/mongo_insertion.json`, data, function (err) {
      if (err) {
        reject();
        throw new Error('Failed to write file');
      }

      console.log('file created');
      console.log('inserting into mongo...');
      resolve();
    });
  });
};


fs.readdir(filePath, function (err, files) {
  if (err) {
    throw new Error(`Failed reading directory ${filePath}`);
  }

  // TODO use generator function
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
        .then(importToDb);
    });
  });
});
