var recorder = require('./requests/request-main');
var response = require('./response/response-main');
var requestbutton = require('./requests/requestbutton');
var guid = require('./utils/guid');
var user_preferences = require('./utils/user_preferences');
var editorID;
var pfs = require('./utils/promised_fs');
var path = require('path');
require('electron').ipcRenderer.setMaxListeners(20);
global.jQuery = require('jquery');
require('bootstrap');

module.exports= {

    activate: function(state) {
        editorID = user_preferences.getEditorID();

        if(!editorID) {
            editorID = user_preferences.setEditorID(guid());
        }

        if(!state) {
            state = {};
        }
        // activate atom-codeon
        recorder.initialize(editorID, state.recorder);

        // activate response vizView
        response.initialize(editorID, state.response);

        // activate request button
        requestbutton.initialize()

        // declare csp

    },
    serialize: function() {
      return {
          editorID: editorID,
          recorder: recorder.serialize(),
          response: response.serialize()
      };
    },
    deactivate: function() {
      recorder.destroy();
      response.destroy();

      // Destroy all views.
      var viewMappingKeys = Object.keys(this.editorViewMappings);
      for(var i = 0; i < viewMappingKeys.length; i++) {
        this.editorViewMappings[viewMappingKeys[i]].destroy();
        this.editorViewMappings[viewMappingKeys[i]] = null;
        delete this.editorViewMappings[viewMappingKeys[i]];
      }
    },
    config: user_preferences.configDefaults
};
