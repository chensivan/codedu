var $ = require('jquery'),
  angular = require('angular'),
  _ = require('underscore'),
  pfs = require('../utils/promised_fs'),
  path = require('path');


module.exports = RequestView;

function RequestView() {
  this.element = $('<div />').addClass('codeon recording-bar');
  this.promptPanelElement = $('<div />').addClass('codeon title-request');
  this.panel = atom.workspace.addTopPanel({
    item: this.getElement(),
    visible: false
  });

  this.promptPanel = atom.workspace.addModalPanel({
    item: this.getPromptPanelElement(),
    visible: false
  });

  this.app = angular.module('codeon_request', []);

  this.app.constant('STORAGE_DIRECTORY', path.join(__dirname, 'recordings'));

  require('./services/record_editor')(this.app);
  require('./services/record_files')(this.app);
  require('./services/record_voice')(this.app);
  require('./services/upload_recording')(this.app);
  require('./services/upload_textrequest')(this.app);
  require('./services/recorder')(this.app);
  require('./controllers/recording_bar.controller')(this.app);
  require('./controllers/recording_prompt.controller')(this.app, this);
  require('../services/slack')(this.app);

  pfs.readFile(path.join(__dirname, 'views', 'recording_prompt.view.html'), 'utf8').then(_.bind(function(contents) {
    this.promptPanelElement.html(contents);
    angular.element(this.getPromptPanelElement()).ready(_.bind(function() {
      angular.bootstrap(this.getPromptPanelElement(), ['codeon_request']);

    }, this));

  }, this), function(err) {
    console.error(err);
  });

  pfs.readFile(path.join(__dirname, 'views', 'recording_bar.view.html'), 'utf8').then(_.bind(function(contents) {
    this.element.html(contents);
    angular.element(this.getElement()).ready(_.bind(function() {
      angular.bootstrap(this.getElement(), ['codeon_request']);
      this._invoke(function(Recorder, $rootScope) {
        $rootScope.$on('begin_codeon_recording', _.bind(function() {
          this.panel.show();
        }, this));
        $rootScope.$on('end_codeon_recording', _.bind(function() {
          this.panel.hide();
        }, this));
      })
    }, this));
  }, this), function(err) {
    console.error(err);
  });

  pfs.readFile(path.join(__dirname,  'views', 'metafile.html'), 'utf8');

}

(function(My) {
  var proto = My.prototype;

  proto._invoke = function(fn, context) {
    var $injector = angular.element(this.getElement()).injector();
    return $injector.invoke(['Recorder', '$rootScope', _.bind(fn, context || this)]);
  };

  proto.isRecording = function() {
    return this._invoke(function(Recorder) {
      return Recorder.isRecording();
    });
  };
  // enable editor + voice recording
  proto.enable = function(title, tags) {
    if (!this.isRecording()) {

      this._invoke(function(Recorder) {
        Recorder.start(title, tags);
      });
      this.panel.show();
    }
  };

  // send the title and the text description
  proto.sendingTextDesc = function(title, request, tags){
    // console.log(title, request);
    this._invoke(function(Recorder) {
      Recorder.sendingTextRequest(title, request, tags);
    });
  };

  proto.disable = function() {
    if (this.isRecording()) {

      this._invoke(function(Recorder) {
        Recorder.stop();
      });
      this.panel.hide();
    }
  };

  proto.getElement = function() {
    return this.element;
  };

  proto.getPromptPanelElement = function() {
    return this.promptPanelElement;
  };

  proto.openPrompt = function() {
    this.promptPanel.show();
    var scope = angular.element(document.querySelector('#makeRequest')).scope();
    setTimeout(function() {
      scope.$apply(function() {
        scope.reqSideBarButton = false;
      });
    }, 0, false);
    // start recording with enter key
    // $('textarea', this.getPromptPanelElement()).select().focus().on('keydown.checkEnter', _.bind(function(event) {
    //   if (event.keyCode === 13 && event.shiftKey === false) {
    //     $('#startRecording', this.getPromptPanelElement()).click();
    //   } else if (event.keyCode === 27) {
    //     $('#cancelRecording', this.getPromptPanelElement()).click();
    //   }
    // }, this));

    // send request with enter key
    $('textarea', this.getPromptPanelElement()).select().focus().on('keydown.checkEnter', _.bind(function(event) {
      if (event.keyCode === 13 && event.ctrlKey === true) {
        $('#requestTextSubmittion', this.getPromptPanelElement()).click();
      } else if (event.keyCode === 27) {
        $('#cancelRecording', this.getPromptPanelElement()).click();
      }
    }, this));
  };
  proto.closePrompt = function() {
    var temp = this;
    temp.promptPanel.hide();
    setTimeout(function() {
      $('textarea', temp.getPromptPanelElement()).off('keydown.checkEnter');
    }, 0);

  };

  proto.destroy = function() {
    this._invoke(function(Recorder) {
      Recorder.cancel();
    });
    this.panel.destroy();
  };
  // send the title of the request
  proto.toggle = function(title, tags) {
    if (this.isRecording()) {
      this.disable();
    } else {
      this.enable(title, tags);
    }
  };





}(RequestView));
