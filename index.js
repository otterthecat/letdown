#!/usr/bin/env node
/* eslint no-console: 0 */
'use strict';
let fs = require('fs');
let cp = require('child_process');
let helper = require('./lib/helper');

let filePath = process.env.MD_POSTS_DIR,
    cmdString = `mongoimport --host localhost --db foobar --collection posts < ${filePath}/db/mongo_insertion.json --jsonArray`;

fs.readdir(filePath, function (err, files) {
  if (err) {
    console.log('Error: ', err);
    return false;
  }

  files.forEach(function (file) {
    fs.readFile(filePath + file, 'utf8', function (err, data) {
      if (err) {
        // check if directory (no recursion)
        if (err.code === 'EISDIR') {
          console.log('file is a directory. Skipping it.');
          return false;
        }
        console.log('Error: ', err);
        return false;
      }

      let newPath = filePath + '/db/mongo_insertion.json';
      let jsonData = helper.createJSON(filePath + file, data);
      fs.writeFile(newPath, jsonData, function (err) {
        if (err) {
          console.log('ERROR: ', err);
          return false;
        }

        console.log('file created');
        console.log('inserting into mongo...');

        cp.exec(cmdString, function (err) {
          if (err) {
            console.log('Error inserting into DB: ', err);
            return false;
          }
          console.log('insertion complete');
          console.log('cleaing up json file');
          fs.unlink(newPath, function () {
            console.log('clean up complete.');
            console.log('Get back to work');
          });
        });
      });
    });
  });
});
