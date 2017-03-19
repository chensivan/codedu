var TooltipView = require('../utils/requestbutton-view.js');
// var codeContext = require('../utils/codeContext-view.js');
var CompositeDisposable = require('atom').CompositeDisposable;
var Range = require('atom').Range;


//MAIN ATOM FILE
var TestPKG = {
  editorViewMappings: {},
  modalPanel: null,
  subscriptions: null,

  initialize: function(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    var _self = this; //Arrow functions are too much work.

    // this is to show the help button when there is any selection.
    atom.workspace.observeTextEditors(editor => {
      this.editorViewMappings[editor] = [];
      this.editorViewMappings[editor][0] = new TooltipView();
      // this.editorViewMappings[editor][1] = new codeContext();
      var requestButtonControl = new TooltipView();
      editor.observeSelections(function(sel) {

        sel.onDidChangeRange(function() {
          var EditorView = atom.views.getView(editor);

          EditorView.addEventListener('mouseup', function(event) {
            var isTopPanelOpen = atom.workspace.getTopPanels()[0].visible;
            var isTitlePanelOpen = atom.workspace.getModalPanels()[0].visible;
            var isClickingOnLineNumber = (((sel.getBufferRange().end.row - sel.getBufferRange().start.row) == 1) && ((sel.getBufferRange().end.column - sel.getBufferRange().start.column) == 0))
            if (!sel.isEmpty() && !isTopPanelOpen && !isTitlePanelOpen && !isClickingOnLineNumber) {
              if (!EditorView) return;
              var EditorElement = EditorView.shadowRoot | EditorView;
              _self.editorViewMappings[editor][0].setParams({});
              _self.editorViewMappings[editor][0].open();
              // var a = _self.editorViewMappings[editor][1].setParams({});
              // _self.editorViewMappings[editor][1].open();

            } else {
              _self.editorViewMappings[editor][0].close();
              // _self.editorViewMappings[editor][1].close();

            }

            //if selection is single row and if there is a marker on this row

            // console.log(sel.getScreenRange())
          });
        })

      });
    });
  },

  deactivate: function() {
    this.subscriptions.dispose();

    // Destroy all views.
    var viewMappingKeys = Object.keys(this.editorViewMappings);
    for (var i = 0; i < viewMappingKeys.length; i++) {
      this.editorViewMappings[viewMappingKeys[i]].destroy();
      this.editorViewMappings[viewMappingKeys[i]] = null;
      delete this.editorViewMappings[viewMappingKeys[i]];
    }
  },

  toggle: function() {},
};

module.exports = TestPKG;
