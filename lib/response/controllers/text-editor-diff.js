var fs = require('fs');
var diff3 = require('node-diff3').diff;
var jsdiff = require('diff');
var Range = require('atom').Range;

var TextEditorDiff {
  constructor(editor) {
    // Bad hack to get around some bugs.
    editor.__textEditorDiff = this;
    this.editor = editor;
    this.newText;
    this.view = 'normal';

    this.markers = [];
  }

  toggleDiffView(localText, newText) {
    if (this.view === 'diff') {
      this.diffOff();
    } else {
      this.diffOn(localText, newText);
    }
  }

  diffOn(localText, newText) {
    this.localText = localText;
    this.newText = newText || this.newText;

    const workingDiff = jsdiff.diffLines(this.localText, this.newText);

    // Clear the editor.
    this.editor.setText('');

    // Get the amount of lines in the editor, subtract one to get the line index.
    let lastLine = this.editor.getLineCount() - 1;

    //Render the diff'd text.
    workingDiff.forEach(function(part, index) {
      const diffClass = part.added ? 'add' : part.removed ? 'delete' : 'nothingchanged';

      // Insert the diff fragment.
      this.editor.insertText(part.value);

      // Get the new last line position, adjusted for the end of the previous line.
      let currentLastLine = this.editor.getLineCount() - 2;

      if (diffClass !== 'nothingchanged') {
        // Create the marker range.
        const range = new Range([lastLine, 0], [currentLastLine, 1]);
        // Create the marker.
        const marker = this.editor.markBufferRange(range, {
          invalidate: 'inside',
        });
        // Decorate the marker.
        this.editor.decorateMarker(marker, {
          type: 'line',
          class: diffClass
        });

        // Add the marker to our markers list.
        this.markers.push(marker);
      }

      // Update the last line for future diff framgments.
      lastLine = currentLastLine + 1;
    });

    this.view = 'diff';
  }

  diffOff() {
    this.markers.forEach(function(marker) {
      marker.destroy();
    });

    if (this.localText)
      this.editor.setText(this.localText);

    this.view = 'normal';
  }

  setMerge() {
    const lineArr = this.editor.getText().split('\n');
    this.markers.forEach(function(marker) {
      marker.destroy();
    });

    if (this.newText)
      this.editor.setText(this.newText);
  }
}

module.exports = TextEditorDiff;
