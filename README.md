discuss.js [![Build Status](https://travis-ci.org/leadhead9/discuss.js.svg?branch=master)](https://travis-ci.org/leadhead9/discuss.js)
============================

A lightweight REST abstraction library for JavaScript in the browser with optional support for Promises. An alternative to 
[jQuery.ajax()](https://api.jquery.com/jquery.ajax/). Node.js is not supported at this time.

	$ bower install discuss.js

**NEW** in version **1.1.0**: Optional support for Promises! If Discuss detects a Promises/A+ implementation present in the environment it will use it. Because this is an optional feature, environments without a valid Promises/A+ implementation will be forced to use a different syntax.

Tested Promises/A+ implementations include:

* Q
* Y
* bluebird
* assure
* Promiz
	
Usage with Promises
---------------
If Discuss detects a Promises/A+ implementation present in the environment it will use it. The `send()` function will return a Promise that will allow you to handle fulfillments and rejections in whatever pattern you require.

Supported HTTP methods: GET, PUT, POST, DELETE, HEAD

	var user = new Discuss("http://yourhost.com/api/user");
	
	user.get("/all")
		.header({
			"API-Key": "KPAMzayVs9j8hvru9aS4HW46kKkfZEkQRfK"
		})
		.query({
			location: "CA"
		})
		.send()
		.then(function(response) {
			// Handle successful response object:
			// {
			//		"body" : ... ,
			// 		"status" : ... ,
			//		"headers" : ...
			// }
		})
		.catch(function(error) {
			// Handle error object:
			// {
			//		"body" : ... ,
			// 		"status" : ... ,
			//		"headers" : ...
			// }
		});
		
	user.post()
		.body({
			username: "jsmith",
			location: "CA"
		})
		.send()
		.then(function(response) {
			// Handle successful response object:
			// {
			//		"body" : ... ,
			// 		"status" : ... ,
			//		"headers" : ...
			// }
		})
		.catch(function(error) {
			// Handle error object:
			// {
			//		"body" : ... ,
			// 		"status" : ... ,
			//		"headers" : ...
			// }
		});
		
	user.put() ...
	user.delete() ...
	user.head() ...

Available builder functions:

* `query(string | object)`
* `body(string | object)`
* `header(object)`

Builder functions may be called in any order but the chain must end with a call to the `send()` function, where a Promise will be returned.


Usage without Promises
---------------
Discuss will revert to a chained style syntax if a Promises/A+ library is not discovered, or when the `noPromises` option is enabled. Please be aware that the callback method signatures are different and the `send()` function must be called last.

Supported HTTP methods: GET, PUT, POST, DELETE, HEAD

	var user = new Discuss("http://yourhost.com/api/user");
	
	user.get("/all")
		.header({
			"API-Key": "KPAMzayVs9j8hvru9aS4HW46kKkfZEkQRfK"
		})
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

Building an HTTP request is done via function chain syntax. The `send()` method is required while all others are not. Adding a query to a PUT or POST will have no effect. Adding a body to a GET, DELETE or HEAD will have no effect.

Available builder functions:

* `query(string | object)`
* `body(string | object)`
* `header(object)`
* `success(function)`
* `error(function)`

Builder functions may be called in any order but the chain must end with a call to the `send()` function. Feel free to call `send()` at your leisure, as it will inititate the HTTP connection.
	
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
*      `noPromises`     (default: false) - Ignore any present Promises libs and force the alternate chaining syntax

Headers
---------------
Header objects may be applied to a Discuss instance or during request building.

    var user = new Discuss("http://yourhost.com/api/user").header({
        "Token": "KPAMzayVs9j8hvru9aS4HW46kKkfZEkQRfK",
        "The-Answer": "42"
    });

	// Chained syntax exampled -- no Promises used.
    user.post("/coordinates")
        .header({
            "Format" : "GRS80"
        })
        .body({
            "coodinates": "55 deg 45' N, 37 deg 37' E"
        })
        .success(function(body, status) {
            // Handle success
        })
        .send();

Discuss will automatically add a `Content-Type` header for `application/json` or `text/html` (in the specified charset, default utf-8). In the event of a header conflict, headers declared during instantiation will be overwritten by headers declared during request building. Request building headers will also overwrite any automatic headers provided by this library.

The `header()` and `configuration()` methods may be chained together in any order.


License
---------------
This project is distrubuted under the MIT License.
Copyright (c) 2014 Evan W. Isnor