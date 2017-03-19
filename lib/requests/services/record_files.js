var _ = require('underscore'),
  archiver = require('archiver'),
  mkdirp = require('../../utils/promised_fs').mkdirp,
  prefs = require('../../utils/user_preferences'),
  fs = require('fs'),
  path = require('path');


module.exports = function(app) {
  app.factory('FileRecorder', ['$q', 'STORAGE_DIRECTORY', function($q, STORAGE_DIRECTORY) {
    var archive;
    return {
      start: function(uid) {
        archive = archiver.create('tar', {
          gzip: true
        });
        if (prefs.includeWorkspaceSnapshot()) {
          var rootDirectories = atom.project.getDirectories(),
            directoryPaths = _.map(rootDirectories, function(dir) {
              return dir.getPath();
            });

          if (directoryPaths.length > 0) {
            _.each(directoryPaths, function(path) {
              //archive.bulk([{
              //src: [path+'/**', '!.git']
              //}]);
              archive.directory(path);
            });

            var split_paths = _.map(directoryPaths, function(directoryPath) {
              return directoryPath.split(path.sep);
            });
            var firstSplitPath = split_paths[0];
            var gcd_index = 0;
            for (var i = 0; i < firstSplitPath.length; i++) {
              var pathi = _.pluck(split_paths, i);
              if (allValuesSame(pathi)) {
                gcd_index = i;
              } else {
                break;
              }
            }

            var cwd = firstSplitPath.slice(0, gcd_index + 1).join(path.sep);
            return cwd;
          } else {
            return '';
          }
        } else {
          return '';
        }
      },
      stop: function(uid) {
        var folder = STORAGE_DIRECTORY,
          filename = uid + '.tar.gz',
          fullFilename = path.join(folder, filename);

        var output = fs.createWriteStream(fullFilename);
        var outputClosePromise = new Promise(function(resolve, reject) {
          output.on('close', function() {
            resolve(fullFilename);
          });
        });

        archive.pipe(output);
        archive.finalize();

        return outputClosePromise;
      },
      cancel: function(uid) {
        archive.abort();
        archive = false;
      },
      addFile: function(path, filename) {
        archive.file(path, {
          name: filename
        });
      }
    };
  }]);
};

function allValuesSame(arr) {
  var len = arr.length;
  if (len > 1) {
    var arr0 = arr[0];

    for (var i = 1; i < len; i++) {
      if (arr[i] !== arr0) {
        return false;
      }
    }
  }

  return true;
}
