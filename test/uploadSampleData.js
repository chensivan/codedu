var STORAGE_DIRECTORY = __dirname + '/../lib/recordings/';
var fs = require('fs');
var FormData = require('form-data');

function getUploadURL() {
	return 'http://localhost:3000/upload_recording';
}
var form = new FormData();
var uid = '72de500d-1330-74a6-889b-34b12fa31889';

form.append('recording', fs.createReadStream(STORAGE_DIRECTORY + uid + '.tar.gz'));
return new Promise(function(resolve, reject) {
	form.submit(getUploadURL(), function(err, result) {
		if(err) {
			reject(err);
		} else {
			resolve();
		}
	});
});
