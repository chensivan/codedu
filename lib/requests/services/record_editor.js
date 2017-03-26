var _ = require('underscore'),
  diff = require('diff'),
  path = require('path');

var changelog;
module.exports = function(app) {
  app.factory('EditorRecorder', ['$q', function($q) {
    return {
      start: function(uid, cwd) {

        changelog = [];
        pushChange(false, "startRecording");
        var activeEditor = atom.workspace.getActiveTextEditor();
        atom.workspace.observeTextEditors(function(editor) {

          if (atom.workspace.getActiveTextEditor() != null && editor.id == atom.workspace.getActiveTextEditor().id) {
            var editorPath = editor.getPath(),
              filePath;

            filePath = editorPath;
            var editorElement = atom.views.getView(editor);
            pushChange(editor, "start", {
              title: editor.getTitle(),
              text: editor.getText(),
              path: filePath,
              editor: editor.serialize(),
              topRow: editorElement.getFirstVisibleScreenRow(),
              active: activeEditor === editor,
              beginningSelection: editor.getSelectedScreenRanges()
            });
            cursorChangeListeners.push(editor.onDidChangeCursorPosition(onChangeCursorPosition.bind(this, editor)));
            selectionChangeListeners.push(editor.onDidChangeSelectionRange(onChangeSelectionRange.bind(this, editor)));
            changeListeners.push(editor.onDidStopChanging(onChange.bind(this, editor)));
            scrollListeners.push(editor.onDidChangeScrollTop(onScroll.bind(this, editor)));
          }

        });
        var activePane = atom.workspace.getActivePane();
        // activePaneListener = atom.workspace.onDidChangeActivePaneItem(function() {
        // 	var activeEditor = atom.workspace.getActiveTextEditor();
        // 	pushChange(activeEditor, "changeTab", {
        // 		topRow: activeEditor.getFirstVisibleScreenRow()
        // 	});
        // })
        // also removed activePaneListener.dispose();
      },
      stop: function() {
        disposeListeners();
        pushChange(false, "stopRecording");
        return prepareChangelog(changelog);
      },
      cancel: function() {
        disposeListeners();
      }
    };
  }]);
};

var onChangeCursorPosition = _.throttle(function(editor, event) {
  var newBufferPosition = event.newBufferPosition;

  pushChange(editor, "cursor", {
    cursor: newBufferPosition.serialize()
  });
}, 500);

var onChangeSelectionRange = _.throttle(function(editor, event) {
  pushChange(editor, "selection_range", {
    range: event.newBufferRange.serialize()
  });
}, 500);

function onChange(editor) {
  pushChange(editor, "delta", {
    text: editor.getText()
  });
}

var onScroll = _.throttle(function(editor, event) {
  var editorElement = atom.views.getView(editor);
  pushChange(editor, "scroll", {
    topRow: editorElement.getFirstVisibleScreenRow()
  });
}, 500);

var cursorChangeListeners = [],
  selectionChangeListeners = [],
  changeListeners = [],
  scrollListeners = [],
  activePaneListener;

function disposeListeners() {
  _.each(cursorChangeListeners.concat(selectionChangeListeners, changeListeners, scrollListeners), function(listener) {
    listener.dispose();
  });
  // activePaneListener.dispose();
}

function pushChange(editor, type, info) {
  var item = _.extend(info || {}, {
    editorID: editor ? editor.id : false,
    type: type,
    timestamp: (new Date().getTime())
  });
  changelog.push(item);
}

function diffifyDeltas(changeLog) {
  return new Promise(function(resolve) {
    var editorContents = {}; // will have diffs by id
    var promises = [];
    _.each(changeLog, function(item) {
      var type = item.type;
      if (type === 'start' || type === 'delta') {
        var newText = item.text,
          oldText;
        if (type === 'delta') {
          oldText = editorContents[item.editorID];
          var diffPromise = new Promise(function(resolve, reject) {
            diff.diffLines(oldText, newText, function(err, changes) {
              if (err) {
                reject(err);
              } else {
                item.delta = changes;
                resolve(changes);
              }
            });
          });
          promises.push(diffPromise);
        }
        editorContents[item.editorID] = newText;
      }
    });

    return Promise.all(promises).then(function() {
      resolve(changeLog);
    });
  });
}

function prepareChangelog(changeLog) {
  return diffifyDeltas(changeLog);
}
