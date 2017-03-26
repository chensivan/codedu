var RequestView = require('./requestView');

//MAIN ATOM FILE
module.exports = {
	initialize: function() {
		this.requestView = new RequestView();
		atom.commands.add('atom-workspace', 'atom-codeon:toggle-recording', this.toggle.bind(this));
	},
	destroy: function() {
		this.requestView.destroy();
	},
	serialize: function() {
		return {};
	},
	toggle: function() {
		// this.requestView.toggle();
		if(!atom.workspace.getTopPanels()[0].visible){
			this.requestView.openPrompt();
		}
	}
};
