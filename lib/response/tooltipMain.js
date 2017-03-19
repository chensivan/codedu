'use strict';

const TooltipView = require('../utils/tooltip-view.js');
const CompositeDisposable = require('atom').CompositeDisposable;
const Range = require('atom').Range;

const exampleRanges = [
  // new Range([13,16],[13,25])
];

const markers = [

];

const TestPKG = {
  editorViewMappings: {},
  modalPanel: null,
  subscriptions: null,

  initialize: function(exampleRangess) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    // exampleRanges = exampleRangess;

    const _self = this; //Arrow functions are too much work.
    atom.workspace.observeTextEditors(editor => {

      this.editorViewMappings[editor] = new TooltipView();


      editor._tooltipMarkers = [];

      // Decorate example ranges
      if(exampleRangess!=null){
        exampleRanges.forEach(function(range) {

          let marker = editor.markBufferRange(range);
          editor.decorateMarker(marker, {
            class: 'test-pkg-highlight',
            type: 'highlight',
          });

          editor._tooltipMarkers.push(marker);
        });
      }

      // _self.editorViewMappings[editor].setText("This is a dependency that you need to add");
      // _self.editorViewMappings[editor].open(Range);

      editor.observeCursors(function(cursor) {
        cursor.onDidChangePosition(function(e) {

          // Get cursor position.
          const cursorPosition = e.newScreenPosition;
          console.log(e);
          let intersectionRange;
          let selectedMarker;

          // Check each marker to see if the cursor position intersects. Return first intersection.
          editor._tooltipMarkers.some((testMarker) => {

            const markerRange = testMarker.getScreenRange();
            if(markerRange.containsPoint(cursorPosition)) {
              intersectionRange = markerRange;
              selectedMarker = testMarker;

              return true;
            }

          });

          if(intersectionRange && selectedMarker) {
            // Open a tooltip at the cursor if there was an intersection.
            const EditorView = atom.views.getView(editor);
            if(!EditorView) return;

            const EditorElement = EditorView.shadowRoot | EditorView;

            // _self.editorViewMappings[editor].setText("This is a dependency that you need to add");
            // _self.editorViewMappings[editor].open(Range);


            _self.editorViewMappings[editor].setParams({
              text: 'This is a dependency that you need to add',
              title: 'TEXT TITLE',
            });

            _self.editorViewMappings[editor].open();


          } else {
            _self.editorViewMappings[editor].close();
          }
        });
      });


    });




  },

  deactivate: function() {
    this.subscriptions.dispose();

    // Destroy all views.
    const viewMappingKeys = Object.keys(this.editorViewMappings);
    for(let i = 0; i < viewMappingKeys.length; i++) {
      this.editorViewMappings[viewMappingKeys[i]].destroy();
      this.editorViewMappings[viewMappingKeys[i]] = null;
      delete this.editorViewMappings[viewMappingKeys[i]];
    }
  },

  toggle: function() {
  },
};

module.exports = TestPKG;
