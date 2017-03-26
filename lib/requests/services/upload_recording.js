var pfs = require('../../utils/promised_fs');
var prefs = require('../../utils/user_preferences');
//var angular = require('angular');
var fs = require('fs');
var path = require('path');
var FormData = require('form-data');
var _ = require('underscore')
var guid = require('../../utils/guid');

module.exports = function(app) {
  var changelog;
  app.factory('UploadRecording', ['$q', '$rootScope', 'STORAGE_DIRECTORY', 'Slack', function($q, $rootScope, STORAGE_DIRECTORY, Slack) {
    return function(uid, editorRecorder, voiceRecorder, workspaceSnapshot, cwd, requestTitle, requestTags) {
      var changelogPromise = editorRecorder.stop(uid);
      var promises = voiceRecorder.stop(uid),
        wavPromise = promises;

      var wavFilePromise = wavPromise.then(function(wavFilename) {
        console.log("wavPromise : " + wavFilename);
        workspaceSnapshot.addFile(wavFilename, path.basename(wavFilename));
      });
      var folder = path.join(STORAGE_DIRECTORY, uid);
      var skype = prefs.getContact();
      if (requestTitle == null) {
        requestTitle = 'This person is too lazy to leave anything ...'
      }
      changelogPromise.then(function(info) {

        var changelog = info;
        var recordingInfo = {
          contact: skype,
          title: requestTitle,
          tags: requestTags,
          question_id: uid,
          private_id: guid(),
          editor_id: prefs.getEditorID(),
          transcript: "worked",
          changelog: changelog,
          cwd: cwd
        };

        //add gutter icon to indicate the location, which should be the same as showlocation
        var editor = atom.workspace.getActiveTextEditor();
        _.every(changelog, function(obj) {
          if (obj.type == 'cursor') {
            editor.scrollToScreenPosition(obj.cursor, {
              center: true
            });
            editor.setCursorScreenPosition(obj.cursor);
            return false;
          }

          if (obj.type == 'selection_range') {
            editor.scrollToScreenPosition(obj.range[0], {
              center: true
            });
            editor.setCursorScreenPosition(obj.range[0]);
            return false;
          }

          return true;
        });

        var filename = 'recording.json',
          fullFilename = path.join(folder, filename);

        return pfs.mkdirp(folder).then(function() {

          return pfs.writeJson(fullFilename, recordingInfo).then(function() {
            return workspaceSnapshot.addFile(fullFilename, filename);
          });
        });
      });

      return Promise.all([wavFilePromise, changelogPromise]).then(function() {
        console.log("transcript(wavFilePromise, infoPromise) : ");

        return workspaceSnapshot.stop(uid);
      }).then(function(zipFilename) {
        console.log("transcript(wavFilePromise, infoPromise)2 : ");

        return pfs.remove(folder).then(function() {
          return zipFilename;
        });
      }).then(function(zipFilename) {
        console.log("Wrote to " + zipFilename);
        var form = new FormData();
        form.append('recording', fs.createReadStream(zipFilename));
        return new Promise(function(resolve, reject) {
          form.submit(prefs.getUploadURL(), function(err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(zipFilename);
            }
          });
        });
      }).then(function(zipFilename) {
        return pfs.remove(zipFilename);
      }).then(function() {
        if (prefs.postRequestsToSlack()) {
          return Slack.postRequest(uid, requestTitle);
        } else {
          return;
        }
      }).then(function() {
        console.log("Uploaded to " + prefs.getUploadURL());
      }, function(err) {
        console.error(err.stack);
      });
    };
  }]);
};
