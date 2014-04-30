"use strict";

var Q = require('q');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

function hashdirectory(dir, callback) {
	return hashDirectory(dir).then(function(res) {
		return res.hash;
	}).nodeify(callback);
};

function hashdirectorySync(dir) {
	var res = hashDirectorySync(dir);
	return res.hash;
}

module.exports = hashdirectory;
module.exports.sync = hashdirectorySync;

var stat = Q.denodeify(fs.stat);

function hashDirectoryItem(filepath) {
	return stat(filepath).then(function(stats) {
		if (stats.isDirectory()) {
			return hashDirectory(filepath);
		}
		else if (stats.isFile()) {
			return hashFile(filepath, stats);
		}
		else {
			throw new Error("Unsupported directory item type");
		}
	});
}

function hashDirectoryItemSync(filepath) {
	var stats = fs.statSync(filepath);

	if (stats.isDirectory()) {
		return hashDirectorySync(filepath);
	}
	else if (stats.isFile()) {
		return hashFileSync(filepath, stats);
	}
	else {
		throw new Error("Unsupported directory item type");
	}
}

var readdir = Q.denodeify(fs.readdir);

function hashDirectory(filepath) {
	return readdir(filepath).then(function(files) {
		var buffers = [];

		var promises = files.map(function(file) {
			return hashDirectoryItem(path.join(filepath, file));
		});
		var allFinished = Q.all(promises);
		return allFinished.then(function(directoryItems) {
			var buffers = [];

			directoryItems.sort(function(a, b) {
				return a.name > b.name;
			});

			directoryItems.forEach(function(di) {
				buffers.push(new Buffer(di.mode + " " + di.name + "\0", 'utf-8'));
				buffers.push(new Buffer(di.hash, 'hex'));
			});

			var buffer = Buffer.concat(buffers);

			var shasum = crypto.createHash('sha1');
			shasum.update('tree ' + buffer.length.toString() + '\0');
			shasum.update(buffer);

			var digest = shasum.digest('hex');

			return {
				type: 'tree',
				path: filepath,
				name: path.basename(filepath),
				hash: digest,
				mode: '40000'
			}
		});
	});
}

function hashDirectorySync(filepath) {
	var files = fs.readdirSync(filepath);

	var directoryItems = files.map(function(file) {
		return hashDirectoryItemSync(path.join(filepath, file));
	});

	var buffers = [];

	directoryItems.sort(function(a, b) {
		return a.name > b.name;
	});

	directoryItems.forEach(function(di) {
		buffers.push(new Buffer(di.mode + " " + di.name + "\0", 'utf-8'));
		buffers.push(new Buffer(di.hash, 'hex'));
	});

	var buffer = Buffer.concat(buffers);

	var shasum = crypto.createHash('sha1');
	shasum.update('tree ' + buffer.length.toString() + '\0');
	shasum.update(buffer);

	var digest = shasum.digest('hex');

	return {
		type: 'tree',
		path: filepath,
		name: path.basename(filepath),
		hash: digest,
		mode: '40000'
	}
}

function hashFile(filepath, stats) {
	return Q.Promise(function(resolve, reject) {
		var shasum = crypto.createHash('sha1');

		// Use git's header.
		shasum.update('blob ' + stats.size + '\0');

		// Read the file, and hash the results.
		var stream = fs.createReadStream(filepath);
		stream.on('data', function(chunk) {
			shasum.update(chunk);
		});

		// When the file is done, we have the complete shasum.
		stream.on('end', function() {
			var d = shasum.digest('hex');
			resolve({
				type: 'blob',
				path: filepath,
				name: path.basename(filepath),
				hash: d,
				mode: '100644'
			});
		});
	});
}

function hashFileSync(filepath, stats) {
	var shasum = crypto.createHash('sha1');

	// Use git's header.
	shasum.update('blob ' + stats.size + '\0');

	// Read the file, and hash the results.
	var buffer = fs.readFileSync(filepath);
	shasum.update(buffer);

	// When the file is done, we have the complete shasum.
	var d = shasum.digest('hex');
	return {
		type: 'blob',
		path: filepath,
		name: path.basename(filepath),
		hash: d,
		mode: '100644'
	};
}
