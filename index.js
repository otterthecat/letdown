#!/usr/bin/env node

var fs = require('fs'),
    cp = require('child_process'),
    helper = require('./lib/helper'),
    filePath = process.env.MD_POSTS_DIR,
    cmdString = 'mongoimport --host localhost --db foobar --collection posts < ' + filePath + '/db/mongo_insertion.json --jsonArray';

fs.readdir(filePath, function(err, files){
  if(err){
    console.log('Error: ', err);
    return false;
  }

  files.forEach(function(file){
    var contents = fs.readFile(filePath + file, 'utf8', function(err, data){
      if(err){
        // check if directory (no recursion)
        if(err.code === 'EISDIR'){
          console.log('file is a directory. Skipping it.');
          return false
        }
        console.log("Error: ", err);
        return false;
      }

      var newPath = filePath + '/db/mongo_insertion.json';
      fs.writeFile(newPath, helper.createJSON(filePath + file, data), function(err){
        if(err){
          console.log("ERROR: ", err);
          return false;
        }

        console.log('file created');
        console.log('inserting into mongo...');

        cp.exec(cmdString, function(err){
          if(err){
            console.log("Error inserting into DB: ", err);
            return false;
          }
          console.log('insertion complete');
        });

      });
    });
  });
});