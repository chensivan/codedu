module.exports = {
	getServerURL: function() {
		return atom.config.get('atom-codeon.uploadURL');
	},
	getUploadURL: function() {
		return module.exports.getServerURL()+'/upload_recording';
	},
	getContact: function() {
		return atom.config.get('atom-codeon.contactinfo');
	},
	getEditorID: function() {

		//comment
		return atom.config.get('atom-codeon.editorID');
	},
	setEditorID: function(editorID) {
        atom.config.set('atom-codeon.editorID', editorID);
		return editorID;
	},
	includeWorkspaceSnapshot: function() {
		return atom.config.get('atom-codeon.includeWorkspaceSnapshot');
	},
	postRequestsToSlack: function() {
		return atom.config.get('atom-codeon.postToSlack');
	},
	getSlackWebhookURL: function() {
		return atom.config.get('atom-codeon.slackWebhook');
	},
	configDefaults: {
    	uploadURL: {
    		title: 'Upload URL',
    		default: 'http://107.170.53.99:4000',
    		// default: 'http://localhost:4000',
    		type: 'string'
    	},
    	contactinfo: {
    		title: 'Skype Username',
    		default: '',
    		type: 'string'
    	},
        editorID: {
    		title: 'Unique Editor ID',
    		default: '',
    		type: 'string'
        },
        includeWorkspaceSnapshot: {
            title: 'Include Complete Workspace in Requests',
            default: false,
            type: 'boolean'
        },
        postToSlack: {
            title: 'Post requests to Slack',
            default: false,
            type: 'boolean'
        },
        slackWebhook: {
            title: 'Slack WebHook URL',
            default: 'https://hooks.slack.com/services/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',
            type: 'string'
        }
    }
};
