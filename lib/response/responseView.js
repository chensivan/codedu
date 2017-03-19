var $ = require('jquery'),
	ResizableWidthView = require('../utils/resizable-width-view'),
	angular = require('angular'),
	angular_route = require('angular-route'),
	_ = require('underscore'),
	angular_animate = require('angular-animate'),
	angular_moment = require('angular-moment'),
	less = require('less'),
	helpers = require('atom-helpers'),
	pfs = require('../utils/promised_fs'),
	path = require('path');
	require("jquery-ui");
	require('angular-material');
	require('angular-aria');

module.exports = ResponseView;

function ResponseView(isEnabled) {
	ResponseView.__super__.constructor.apply(this, arguments);
	this.panel = atom.workspace.addRightPanel({
		item: this.element
	});
	this.sliderElement = $('<div />').addClass('codeon-slider-wrapper');
	//$("atom-pane-container").append(this.sliderElement);
	// TODO this (livewriting slider) is disabled for now. BTW, adding to the atom-pane-container will have conflicts with splitting panes.
	// TODO consider adding it as a sibling  of atom-pane-container (or on the bottom panel)
	this.app = angular.module('codeon_response', ['angularMoment', 'ngMaterial',  ]);
	this.app2 = angular.module('codeon_replay', ['angularMoment']);


	require('./controllers/helper_response.controller')(this.app);
	require('./controllers/livewriting.slider.controller')(this.app2);
	require('./controllers/response_panel.controller')(this.app);
	require('./controllers/request.controller')(this.app);
	require('./services/question_manager')(this.app);
	require('./services/response_manager')(this.app);
	require('./services/play_request')(this.app);
	require('./services/slider')(this.app2);
	require('./services/slider')(this.app);
	require('./services/edit.in.place')(this.app);
	require('./services/alertMessage')(this.app);

	pfs.readFile(path.join(__dirname, 'views', 'response_panel.view.html'), 'utf8').then(_.bind(function(contents) {

		this.mainView.html(contents);

		angular.element(this.mainView).ready(_.bind(function() {
			angular.bootstrap(this.mainView, ['codeon_response']);
		}, this));
	}, this), function(err) {
		console.error(err);
	});


	pfs.readFile(path.join(__dirname, 'views', 'livewriting.slider.view.html'), 'utf8').then(_.bind(function(contents) {

		this.sliderElement.html(contents);
		angular.element(this.sliderElement).ready(_.bind(function() {
			angular.bootstrap(this.sliderElement, ['codeon_replay']);
		}, this));
	}, this), function(err) {
		console.error(err);
	});

	this.enable(isEnabled);
}

(function(My) {
	helpers.extends(ResponseView, ResizableWidthView);
	var proto = My.prototype;

	proto.destroy = function() {
		this.panel.destroy();
	};

	proto.setVisibility = function() {
		$('button.zi-button-expand').text(function(i,text){
			return text === "Codeon ↑"? "Codeon ↓":"Codeon ↑";
		});
		if(this.enabled) {
			// this.panel.show();
			atom.workspace.getRightPanels()[0].item[0].setAttribute("style", "width:400px; transition: width 1s;");

		} else {
			// this.panel.hide();
			atom.workspace.getRightPanels()[0].item[0].setAttribute("style", "width:0px; transition: width 1s;")

		}
	};

	proto.enable = function(enable) {
		this.enabled = enable;
		this.setVisibility();
	};
}(ResponseView));
