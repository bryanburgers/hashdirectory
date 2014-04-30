# hashdirectory

Create an sha1 hash sum from a directory of files using the git algorithm.

[![Build Status](https://travis-ci.org/bryanburgers/hashdirectory.svg?branch=master)](https://travis-ci.org/bryanburgers/hashdirectory)

Creating a hash for an entire directory, instead of for a single file, can be
useful for cache busting. Using git's method of creating the hash just builds
upon something consistent that is known to work.

This package does not requires git to be installed on the production server,
however. It only reproduces the git algorithm for hashing files and folders
(but not commits or tags).

## Installation

```
npm install --save hashdirectory
```

## Usage

```
var hashdirectory = require('hashdirectory');

// Synchronous, for before your webserver starts up.
var hashed = hashdirectory.sync('./public');

// Asynchronous, for everything else.
hashdirectory('./public', function(err, hashed) {
});

// Or, if promises are more your thing.
var hashedPromise = hashdirectory('./public');
```
