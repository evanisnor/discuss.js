discuss.js
============================
[![Build Status](https://travis-ci.org/leadhead9/discuss.js.svg?branch=master)](https://travis-ci.org/leadhead9/discuss.js)

A lightweight REST abstraction library for JavaScript in the browser. An alternative to 
[jQuery.ajax()](https://api.jquery.com/jquery.ajax/).

	$ bower install discuss.js
	
Usage
---------------
Supported HTTP methods: GET, PUT, POST, DELETE, HEAD

	var user = new Discuss("http://yourhost.com/api/user");
	
	user.get("/all")
		.query({
			location: "CA"
		})
		.success(function(body, status, headers) {
			// Handle success
		})
		.error(function(error, status, headers) {
			// Handle error
		})
		.send();
		
	user.post()
		.body({
			username: "jsmith",
			location: "CA"
		})
		.success(function(body, status, headers) {
			// Handle success
		})
		.error(function(error, status, headers) {
			// Handle error
		})
		.send();
		
	user.put() ...
	user.delete() ...
	user.head() ...

Building an HTTP request is done via method chain syntax. The `success()` and `send()` methods are required while all others are not. Adding a query to a PUT or POST will have no effect. Adding a body to a GET, DELETE or HEAD will have no effect.

Available builder methods:

* `query(string | object)`
* `body(string | object)`
* `header(object)`
* `success(function)`
* `error(function)`

Method chains may be provided in any order but they must end with a call to the `send()` function. Feel free to call `send()` at your leisure, as it will inititate the HTTP connection.
	
Configuration
---------------
You may provide Discuss with optional parameters that affect its behavior. 
	
	var user = new Discuss("http://yourhost.com/api/user").configure({
		charset: "ISO-8859-1",
		cors: true
	});

Available parameters include:
	
*      `charset`     (default: utf-8)    - Used for plain text HTTP requests
*      `autoParse`   (default: true)     - Automatically parse bodies and headers to and from Objects (JSON)
*      `timeout`     (default: 30000)  - Request timeout in milliseconds
*      `cors`        (default: false)    - Enable CORS support for older browsers
*      `corsWithCredentials`     (default: false) - Enable CORS support with credentials
