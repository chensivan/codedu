var _ = require('underscore');
var prefs = require('../utils/user_preferences');

module.exports = function(app) {
	app.factory('Slack', ['$q', '$http', function ($q, $http) {
		return {
			postRequest: function(uid, title) {
				var text = 'New Request: '+title+'\n' + prefs.getServerURL()+'/#/requests/'+ uid;
				return $http({
					method: 'POST',
					url: prefs.getSlackWebhookURL(),
					data: {
						text: text
					}
				});
			}
		};
	}]);
};
