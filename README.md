discuss.js
============================

A lightweight REST abstraction library for JavaScript in the browser. An alternative to 
[jQuery.ajax()](https://api.jquery.com/jquery.ajax/).

Basic Usage
----------------------------

Instantiate a new Discuss object for each API resource

    var user = new Discuss('http://yourdomain.com/api/user');

Perform basic actions with minimal syntax.
    
    user.get(function (body, error, status) {
        // Handle the GET response
    });
    
    user.post({ "Username" : "Edward" }, function (body, error, status) {
    	// Handle the POST response
    });
    
    user.put("String content is also supported", function (body, error, status) {
    	// Handle the PUT response
    });

For GET requests, automatically generate a query string from an object. This example will translate into `http://yourdomain.com/api/user?location=CA&areaCode=90210`
    
    user.get({ "location": "CA", "areaCode": 90210 }, function (body, error, status) {
    		// Handle the GET response
    	}
    );
    
    