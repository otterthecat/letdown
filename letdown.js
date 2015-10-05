#!/usr/bin/env node

var fs = require('fs'),
    md = require('markdown-it')();

var filePath = '/home/d/Documents/posts/new/';

var parseTitle = function(str){
  var title = str.match(/^(#{1})[- !:()a-zA-Z]+?\n/gi)[0];
  return title
};

var parseTimestamp = function(path){
  return fs.statSync(path).mtime;
};

var createJSON = function(path, contents){
  var title = parseTitle(contents).trim();
  var timestamp = parseTimestamp(path);
  var post = md.render(contents.replace(title, '' ).trim());
  return '{"title": "' + title.substr(2) + '", "timestamp": "' + timestamp + '", "post": "' + post + '"}';
};

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
      fs.writeFile(newPath, createJSON(filePath + file, data), function(err){
        if(err){
          console.log("ERROR: ", err);
          return false;
        }

        console.log('file created');
      });
    });
  });

});