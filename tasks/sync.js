var fs = require('promised-io/fs');
var promise = require('promised-io/promise');
var path = require('path');

module.exports = function(grunt) {

  var overwriteDest = function(options, src, dest) {
      grunt[options.logMethod].writeln('Overwriting ' + dest.cyan + 'because type differs.');
      grunt.file['delete'](dest);
      grunt.file.copy(src, dest);
    };
  var updateIfNeeded = function(options, src, dest, srcStat, destStat) {
      // we can now compare modification dates of files
      if(srcStat.mtime.getTime() > destStat.mtime.getTime()) {
        grunt[options.logMethod].writeln('Updating file ' + dest.cyan);
        // and just update destination
        grunt.file.copy(src, dest);
      }
    };

  var processPair = function(options, src, dest) {
      //stat destination file
      return promise.all([fs.stat(src), fs.stat(dest)]).then(function(result) {
        var srcStat = result[0], destStat = result[1];

        var isSrcDirectory = srcStat.isDirectory();
        var typeDiffers = isSrcDirectory !== destStat.isDirectory();

        // If types differ we have to overwrite destination.
        if(typeDiffers) {
          overwriteDest(options,src, dest);
        } else if(!isSrcDirectory) {
          updateIfNeeded(options, src, dest, srcStat, destStat);
        }
      }, function() {
        // we got an error which means that destination file does not exist
        // so make a copy
        if(grunt.file.isDir(src)) {
          grunt[options.logMethod].writeln('Creating ' + dest.cyan);
          grunt.file.mkdir(dest);
        } else {
          grunt[options.logMethod].writeln('Copying ' + src.cyan + ' -> ' + dest.cyan);
          grunt.file.copy(src, dest);
        }
      });
    };

  grunt.registerMultiTask('sync', 'Synchronize content of two directories.', function() {
    var done = this.async();
    var options = {
      logMethod: this.data.verbose ? 'log' : 'verbose'
    };

    promise.all(this.files.map(function(fileDef) {
      var cwd = fileDef.cwd ? fileDef.cwd : '.';
      return promise.all(fileDef.src.map(function(src){
        var dest = path.join('Z:\\', src.replace('C:/Users/goyalvik/', ''));
        // when using expanded mapping dest is the destination file
        // not the destination folder
        if(fileDef.orig.expand) {
          dest = fileDef.dest;
        }
        return processPair(options, path.join(cwd, src), dest);
      }));      
    })).then(function(promises) {
      promise.all(promises).then(done);
    });
  });
};
