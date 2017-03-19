
//MAIN ATOM FILE
module.exports = {
	initialize: function() {
		atom.commands.add('atom-workspace', 'atom-codeon:toggle-recording', this.toggle.bind(this));
	},
	destroy: function() {
	},
	serialize: function() {
		return {};
	}
};
