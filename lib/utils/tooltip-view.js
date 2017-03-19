'use strict';
const Range = require('atom').Range;

const tooltipTemplate = require('./tooltip-template.js');

const idMappings = [

];

atom.__closeTooltip = function(id) {
  idMappings[id].close();
};

class TooltipView {
  constructor() {
    idMappings.push(this);

    const _workspace = atom.workspace;
    const _workspaceView = atom.views.getView(_workspace);

    this.params = {};
    this.listeners = {};
    this.targetObject;
    this.myId = idMappings.indexOf(this);

    // Create element wrapper.
    this.element = require('./tooltip-element-wrapper')();

    // Close the tooltip when the mouse is pressed anywhere on-screen other than the tooltip.
    this.listeners['mousedown'] = (e) => {
      if(!this.element.isOpen()) return;

      const _isPickerEvent = this.element.hasChild(e.target);
      if(!_isPickerEvent) return this.close();
    };

    // Close the tooltip when the window is resized.
    this.listeners['resize'] = (e) => {
      return this.close();
    };

    // Register all window event listeners.
    const listenerKeys = Object.keys(this.listeners);
    for(let i = 0; i < listenerKeys.length; i++) {
      window.addEventListener(listenerKeys[i], this.listeners[listenerKeys[i]], true);
    }

    // Close the tooltip when any key is pressed, unless it is focused on the tooltip.
    _workspaceView.addEventListener('keydown', (e) => {
      if(!this.element.isOpen()) return;

      const _isPickerEvent = this.element.hasChild(e.target);
      if(!_isPickerEvent) return this.close();
    });

    const _self = this;
    const positionUpdater = function() {
      if(_self.element.isOpen() && _self.reposition(_self.targetObject)) {
        return true;
      } else {
        _self.close();
      }
    };

    // Close the tooltip when the workspace scrolls.
    atom.workspace.observeTextEditors((editor) => {
      const _editorView = atom.views.getView(editor);
      const _subscriptionTop = _editorView.onDidChangeScrollTop(() => positionUpdater());
      const _subscriptionLeft = _editorView.onDidChangeScrollLeft(() => positionUpdater());

      editor.onDidDestroy(function() {
        _subscriptionTop.dispose();
        _subscriptionLeft.dispose();
      });
    });

    // Close it when the active workspace item changes.
    _workspace.getActivePane().onDidChangeActiveItem(() => this.close());

    // Add the tooltip element to the workspace.
    this.Parent = atom.views.getView(atom.workspace).querySelector('.vertical');
    this.Parent.appendChild(this.element.el);
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    // Detatch all event listeners.
    for(let i = 0; i < listenerKeys.length; i++) {
      window.removeEventListener(listenerKeys[i], this.listeners[listenerKeys[i]]);
    }

    // Destroy element.
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

  // setParams(params) {
  //
  //   this.element.el.innerHTML = tooltipTemplate(params, this);
  //   document.getElementById(`__tooltip-${this.myId}`).addEventListener('mousedown', function(e){
  //     this.close();
  //     // var markers = params.markers;
  //     // //remove the markers
  //     // for(i=0;i<10;i++){
	// 		// 	markers.forEach(function(mk){
	// 		// 		mk.destroy();
	// 		//   })
	// 		// }
  //
  //   });
  // }
  setParams(params) {
    this.element.el.innerHTML = tooltipTemplate(params, this);
      document.getElementById(`__tooltip-${this.myId}`).addEventListener('mouseup', (e) => {
         ;
        this.close();

        // var markers = params.marker;
        // //remove the markers
        // for(var i=0;i<10;i++){
  			// 	markers.forEach(function(mk){
  			// 		mk.destroy();
  			//   })
  			// }
      });
  }

  open(targetObject) {
    this.targetObject = targetObject;
    this.reposition(targetObject);

    // Open the tooltip.
    requestAnimationFrame(() => {
      this.element.open();
    });

    return true;
  }

  reposition(targetObject) {
    const Editor = atom.workspace.getActiveTextEditor();
    const EditorView = atom.views.getView(Editor);

    if(!EditorView) return;

    const EditorRoot = EditorView.shadowRoot || EditorView;

    // Find the current marker
    const Marker = targetObject || Editor.getLastCursor().marker;

    // Exit if the cursor is out of view.
    const _visibleRowRange = EditorView.getVisibleRowRange();
    const _cursorScreenRow = Marker.getEndScreenPosition().row;
    const _cursorBufferRow = Marker.getEndBufferPosition().row;
    //const _cursorScreenRow = Marker.getScreenRow();
    //const _cursorBufferRow = Marker.getBufferRow();

    if((_cursorScreenRow < _visibleRowRange[0]) || (_cursorScreenRow > _visibleRowRange[1])) return false;

    const _cursorPosition = Editor.pixelRectForScreenRange(new Range(Marker.getEndScreenPosition(), Marker.getEndScreenPosition()));

    // Get information about the editor.
    const PaneView = atom.views.getView(atom.workspace.getActivePane());
    const _paneOffsetTop = PaneView.offsetTop;
    const _paneOffsetLeft = PaneView.offsetLeft;

    const _editorOffsetTop = EditorView.parentNode.offsetTop;
    const _editorOffsetLeft = EditorRoot.querySelector('.scroll-view').offsetLeft;
    const _editorScrollTop = EditorView.getScrollTop();

    const _lineHeight = Editor.getLineHeightInPixels();
    const _lineOffsetLeft = EditorRoot.querySelector('.line').offsetLeft;

    // Calculate Top Offset
    const _totalOffsetTop = _paneOffsetTop + _cursorPosition.height - _editorScrollTop + _editorOffsetTop;
    // Calculate Left Offset
    const _totalOffsetLeft = _paneOffsetLeft + _editorOffsetLeft + _lineOffsetLeft;

    const _position = {
      x: _cursorPosition.left + _totalOffsetLeft,
      y: _cursorPosition.top + _totalOffsetTop,
    };

    // Calculate boundaries and flip the vertical alignment if needed.
    const _tooltipPosition = {
      x: (() => {
        const _tooltipWidth = this.element.width();
        const _halfColorPickerWidth = (_tooltipWidth / 2) << 0;

        // Make sure the tooltip isn't too far to the left.
        let _x = Math.max(10, _position.x - _halfColorPickerWidth);

        // Make sure the tooltip isn't too far to the right
        _x = Math.min(this.Parent.offsetWidth - _tooltipWidth - 10, _x);

        return _x;
      })(),
      y: (() => {
        this.element.unflip();

        // If the tooltip is too far down, flip it.
        if(this.element.height() + _position.y > this.Parent.offsetHeight - 32) {
          this.element.flip();
          return _position.y - _lineHeight - this.element.height();
        } else {
          // Otherwise keep the Y position.
          return _position.y;
        }
      })(),
    };

    // Set the tooltip position.
    this.element.setPosition(_tooltipPosition.x, _tooltipPosition.y);

    return true;
  }

  close() {
    this.element.close();
    return true;
  }
}

module.exports = TooltipView;
