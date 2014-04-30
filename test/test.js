"use strict";

var hash = require('../index.js');
var assert = require('assert');

function test(name, result) {
	describe(name, function() {
		var dir = './test/' + name;

		it('async', function(done) {
			hash(dir, function(err, hashed) {
				assert.ok(hashed == result, "Expected '" + hashed + "' to equal '" + result);
				done(err);
			});
		});

		it('promise', function() {
			return hash(dir).then(function(hashed) {
				assert.ok(hashed == result, "Expected '" + hashed + "' to equal '" + result);
			});
		});

		it('sync', function() {
			var hashed = hash.sync(dir);
			assert.ok(hashed == result, "Expected '" + hashed + "' to equal '" + result);
		});
	});
}

describe('hash-directory', function() {
	test('test1', 'f0c7ca61818ed6592d9268d8524c44d64e120e8a');
	test('two-files', '919fc5941aefb59db4e8fcd7332002481dad53a9');
	test('deep-directory', '5132cd209a4fa62ad59c70b568baea502a2976a9');
	test('mixed', 'b7c3fef1cf2a2190b0375d2e731318afc205bd25');
});
