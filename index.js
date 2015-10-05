#!/usr/bin/env node

var fs = require('fs'),
    helper = require('./lib/helper'),
    filePath = process.env.MD_POSTS_DIR;

fs.readdir(filePath, function(err, files){
  if(err){
    console.log('Error: ', err);
    return false;
  }

  files.forEach(function(file){
    var contents = fs.readFile(filePath + file, 'utf8', function(err, data){
      if(err){
        console.log("Error: ", err);
        return false;
      }
      var newPath = filePath + file.replace('.md', '.json');
      fs.writeFile(newPath, helper.createJSON(filePath + file, data), function(err){
        if(err){
          console.log("ERROR: ", err);
          return false;
        }

        console.log('file created');
      });
    });
  });
});