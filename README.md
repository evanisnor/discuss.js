discuss.js
============================
[![Build Status](https://travis-ci.org/leadhead9/discuss.js.svg?branch=master)](https://travis-ci.org/leadhead9/discuss.js)

A lightweight REST abstraction library for JavaScript in the browser. An alternative to 
[jQuery.ajax()](https://api.jquery.com/jquery.ajax/).

Usage
----------------------------

Instantiate a new Discuss object for each API resource

    var user = new Discuss('http://yourdomain.com/api/user');

Perform basic actions with minimal syntax.
    
    user.get(function (body, error) {
        // Handle the GET response
    });
    
    user.delete(function (body, error) {
        // Handle the DELETE response
    });
    
    user.head(function (body, error) {
        // Handle the HEAD response
    });
    
    user.post({ "Username" : "Edward" }, function (body, error) {
    	// Handle the POST response
    });
    
    user.put({ "Username" : "John" }, function (body, error) {
    	// Handle the PUT response
    });

For GET and DELETE requests, automatically generate a query string from an object. This example will translate into `http://yourdomain.com/api/user?location=CA&areaCode=90210`
    
    user.get({ "location": "CA", "areaCode": 90210 }, function (body, error) {
    	// Handle the GET response
    });

For POST and PUT requests you may optionally specify object or string content instead

	user.post({ "initials": "AAA", "score": 30245 }, function (body, error) {
		// Handle POST response
	});
    
Response callbacks are always called with the following signature:

	function (body, error, status, responseHeaders) { ... }


