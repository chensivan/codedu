// from https://github.com/Ziink/atom-nav-panel/tree/master/lib
var $ = require('jquery'),
	LEFT = 'left',
	WIDTH_PADDING = 60;

module.exports = ResizableWidthView;

function ResizableWidthView(isEnabled, resizerPosition) {
	var fragment;
	this.resizerPosition = resizerPosition || LEFT;

	this.element = $('<div/>', {class: 'zi-resizable'});
	this.mainView = $('<div />', {class: 'zi-mainview'});
	this.handle = $('<div />', {class: 'zi-width-resizer'});
	var $button = $("<button class='zi-button-expand'>Codeon ↓</button>");

	$button.click(function(){
		atom.commands.dispatch(atom.views.getView(atom.workspace), 'atom-codeon:toggle-response-panel')

	});

	this.handle.append($button);


	// this.note = $('<div />', {
	// 	text: ' Note: Use  Command (⌘)-i to run your code',
	// 	style: 'margin-left: 11px; font-size: 16px;'
	// });

	if(this.resizerPosition === LEFT) {
		this.element.append(this.handle, this.mainView,this.note);
	} else {
		this.element.append(this.mainView, this.handle,this.note);
	}
	this.addEventHandlers();
}

(function(My) {
	var proto = My.prototype;

	proto.addEventHandlers = function() {
		this.handle.on('mousedown', $.proxy(this.resizeStarted, this));
	};

	proto.resizeStarted = function(event) {
		$(document).on('mousemove.resize_panel', $.proxy(this.resizeView, this));
		$(document).on('mouseup.resize_panel', $.proxy(this.resizeStopped, this));
	};

	proto.resizeStopped = function(event) {
		$(document).off('mouseup.resize_panel mousemove.resize_panel');
	};

	proto.resizeView = function(event) {
		if(which === 1) {
			this.resizeStopped();
		} else {
			var which = event.which,
				pageX = event.pageX,
				deltaX, width;

			if(this.resizerPosition === LEFT) {
				deltaX = this.element.offset().left - pageX;
				width = this.element.width() + deltaX;
			} else {
				width = pageX - this.element.offset().left;
			}

			this.element.width(width);
			this.resizeToFitContent();
		}
	};

	proto.resizeToFitContent = function() {
		this.element.width(this.mainView.width() + WIDTH_PADDING);
	};
}(ResizableWidthView));
