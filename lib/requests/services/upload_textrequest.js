var prefs = require('../../utils/user_preferences');
var pfs = require('../../utils/promised_fs');
var fs = require('fs');
var path = require('path');
var FormData = require('form-data');
var _ = require('underscore')
var guid = require('../../utils/guid');

module.exports = function(app){
  app.factory('UploadTextRequest', ['STORAGE_DIRECTORY','EditorRecorder','Slack', function(STORAGE_DIRECTORY, EditorRecorder, Slack){
    return function(uid, cwd, title, request, tags, workspaceSnapshot){
      var folder = path.join(STORAGE_DIRECTORY, uid);
      var filename = 'recording.json',
          fullFilename = path.join(folder, filename);
      EditorRecorder.start(uid, cwd);
      EditorRecorder.stop(uid).then(function(info){
            var recordingInfo = {
              title: title,
              request_description: request,
              tags: tags,
              question_id: uid,
              private_id: guid(),
              editor_id: prefs.getEditorID(),
              transcript: "worked",
              changelog: info,
              cwd: cwd
            };
        return pfs.mkdirp(folder).then(function() {
           ;
          return pfs.writeJson(fullFilename, recordingInfo).then(function() {
            return workspaceSnapshot.addFile(fullFilename, filename);
          });
        });
      }).then(function(){
        return workspaceSnapshot.stop(uid);
      }).then(function(zipFilename){
        return pfs.remove(folder).then(function() {
          return zipFilename;
        });
      }).then(function(zipFilename){
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
    }
  }]);
}