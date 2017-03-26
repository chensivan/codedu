var _ = require('underscore'),
  RecordRTC = require('recordrtc'),
  fs = require('fs'),
  pfs = require('../../utils/promised_fs'),
  path = require('path');

var recognitionEngine = new webkitSpeechRecognition();
recognitionEngine.continue = true;
recognitionEngine.interimResults = false;
recognitionEngine.maxResults = 1;


function getUserMedia() {

  return new Promise(function(resolve, reject) {
    navigator.webkitGetUserMedia({
      audio: true
    }, function(audioStream) {
      console.log("getUserMedia : audioStream received:  ");

      resolve(audioStream);
    }, function(err) {
      console.log("wrong");
      reject(err);
    });
  });

}


module.exports = function(app) {
  var transcriptPromise, audioStreamPromise, recorder;
  var question_id;
  var audio_Stream;
  var stopped = false;
  var transcriptResult;

  app.factory('VoiceRecorder', ['$q', 'STORAGE_DIRECTORY', function($q, STORAGE_DIRECTORY) {
    return {
      start: function(uid) {
        transcriptResult = '';
        stopped = false;
        question_id = uid;
        audioStreamPromise = getUserMedia().then(function(audioStream) {
          console.log("RecordRTC startRecording now  ");

          recorder = RecordRTC(audioStream, {
            type: 'audio'
          });
          recorder.startRecording();
          return audioStream;
        });

      },
      stop: function(uid) {
        console.log("RecordRTC stopRecording now  ");
        stopped = true;

        var wavPromise = audioStreamPromise.then(function(audioStream) {
          return new Promise(function(resolve, reject) {
            recorder.stopRecording(function() {
              resolve(recorder.getBlob());
            });
            audioStream.stop();
          });
        }).then(function(blob) {
          return new Promise(function(resolve, reject) {
            var fr = new FileReader();
            fr.addEventListener("loadend", function() {
              resolve(fr.result);

            })
            fr.readAsBinaryString(blob);
          });
        }).then(function(binaryContent) {
          var folder = path.join(STORAGE_DIRECTORY, uid),
            fullFilename = path.join(folder, 'audio.wav');

          return pfs.mkdirp(folder).then(function() {
            return pfs.writeFile(fullFilename, binaryContent, 'binary');
          });
        });

        return wavPromise;

      },
      cancel: function() {
        // recognitionEngine.abort();
        audioStreamPromise.then(function(audioStream) {
          audioStream.stop();
        });
      }
    }
  }]);
};
