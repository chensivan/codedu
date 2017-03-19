var fse = require('fs-extra'),
	fs = require('fs');

module.exports = {
	mkdirp: function(path) {
		return new Promise(function(resolve, reject) {
			fse.mkdirp(path, function(err) {
				if(err) {
					reject(err);
				} else {
					resolve(path);
				}
			});
		});
	},
	readFile: function(filename, encoding) {
		return new Promise(function(resolve, reject) {
			fs.readFile(filename, encoding, function(err, data) {
				if(err) { reject(err); }
				else { resolve(data); }
			});
		});
	},
	writeFile: function(filename, content, encoding) {
		return new Promise(function(resolve, reject) {
			fs.writeFile(filename, content, encoding, function(err) {
				if(err) {
					reject(err);
				} else {
					resolve(filename);
				}
			});
		});
	},
	remove: function(path) {
		return new Promise(function(resolve, reject) {
			fse.remove(path, function(err) {
				if(err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	},
	writeJson: function(filename, json_contents) {
		return new Promise(function(resolve, reject) {
			fse.writeJson(filename, json_contents, function(err) {
				if(err) {
					reject(err);
				} else {
					resolve(filename);
				}
			});
		});
	}
};