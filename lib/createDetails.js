'use strict';
let Details = function (file, data) {
  this.fileName = typeof file === 'string' ? file.substring(file.lastIndexOf('/') + 1, file.lastIndexOf('.')) : '';
  this.rootPath = process.env.MD_POSTS_DIR;
  this.archivePath = `${this.rootPath}archive/`;
  this.mdPath = `${this.rootPath}${this.fileName}.md`;
  this.jsonPath = `${this.rootPath}${this.fileName}.json`;
  this.data = data || '';
};

module.exports = function (f, d) {
  return new Details(f, d);
};
