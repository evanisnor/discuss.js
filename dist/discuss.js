(function (scope) {
    var Discuss, Request, Utilities = {};

    /*
     * Declare an HTTP resource to talk to.
     *
     * Options may be set by calling the configure decorator with an object that declares
     * any of these parameters:
     *      charset     (default: utf-8)    - Used for plain text HTTP requests
     *      autoParse   (default: true)     - Automatically parse bodies and headers to and from Objects (JSON)
     *      timeout     (default: 30000ms)  - Request timeout in milliseconds
     *      cors        (default: false)    - Enable CORS support for older browsers
     *      corsWithCredentials     (default: false) - Enable CORS support with credentials
     *
     * @param basepath - An HTTP endpoint
     */
    Discuss = function (basepath) {
        this.methods = [
            { name : 'get', query: true },
            { name : 'post', body: true },
            { name : 'put', body: true },
            { name : 'delete', query: true },
            { name : 'head', query: true }
        ];

        this.basepath = basepath;
        this.reqHeaders = {};
        this.options = {
            charset: 'utf-8', // Used for encoding when the body to send is a string
            autoParse: true,  // Automatic parsing of response object to JSON if the content type is application/json
            timeout: 30000,
            cors: false,
            corsWithCredentials: false
        };
        this.setupMethodHandlers();
    };

    /*
     * Decorator for declaring headers that will apply to all HTTP requests sent from this
     * Discuss object.
     * @param reqHeaders - An Object (key/value)
     * @return Discuss instance
     */
    Discuss.prototype.header = function (reqHeaders) {
        if (typeof reqHeaders === 'object') {
            this.reqHeaders = reqHeaders;
        }
        return this;
    };

    /*
     * Decorator for configuring the Discuss object. See constructor docs for options.
     * @param options - Object (key/value)
     * @return Discuss instance
     */
    Discuss.prototype.configure = function (options) {
        for (var o in options) {
            if (options.hasOwnProperty(o) && this.options.hasOwnProperty(o)) {
                this.options[o] = options[o];
            }
        }
        return this;
    };

    /*
     * Add functions to the Discuss prototype for each HTTP method.
     */
    Discuss.prototype.setupMethodHandlers = function () {
        var self = this;
        for (var i in this.methods) {
            (function (method) {
                Discuss.prototype[method.name] = function (path) {
                    return new Request(self, method, path);
                };
            }(this.methods[i]));
        }
    };

    Discuss.prototype.send = function (request) {
        if (!request || !(request instanceof Request) || !request.onSuccess) {
            throw new Error('Invalid send parameters');
        }

        var url = this.basepath;
        if (request.path) {
            url = Utilities.joinPaths(this.basepath, request.path);
        }

        if (request._query) {
            url = url + Utilities.buildQueryString(request._query);
        }

        var xhr = Utilities.buildXHR(this.options.cors, this.options.corsWithCredentials);
        xhr.open(request.method.name, url, true);

        var headers = Utilities.buildHeaders(this.reqHeaders, request.reqHeaders, typeof request._body, this.options.charset);
        for (var header in headers) {
            if (headers.hasOwnProperty(header)) {
                xhr.setRequestHeader(header, headers[header]);
            }
        }

        var timer = setTimeout(function() {
            xhr.abort();
            if (request.onError) {
                request.onError('A network timeout has occurred', 0);
            }
        }, this.options.timeout);

        var self = this;
        xhr.onerror = function () {
            clearTimeout(timer);
            if (request.onError) {
                request.onError('A network-level exception has occurred', 0);
            }
        };
        xhr.onreadystatechange = function () {
            clearTimeout(timer);
            if (xhr.readyState === 4) {
                var responseHeaders = Utilities.parseResponseHeaders(xhr.getAllResponseHeaders(), self.options.autoParse);
                var responseBody = Utilities.parseResponseBody(xhr.responseText, responseHeaders, self.options.autoParse);
                var callback = (xhr.status >= 100 && xhr.status < 300 || xhr.status === 304) ? request.onSuccess : request.onError;
                if (callback && xhr.status !== 0) {
                    callback(responseBody, xhr.status, responseHeaders);
                }
            }
        };

        try {
            if (request._body && typeof request._body === 'object') {
                xhr.send(JSON.stringify(request._body));
            }
            else if (request._body && typeof request._body === 'string') {
                xhr.send(request._body);
            }
            else {
                xhr.send();
            }
        }
        catch (error) {
            if (request.onError) {
                request.onError(error, 0);
            }
        }

    };

    /*
     * HTTP Request builder - decorator pattern.
     * @param d - Reference to the parent Discuss object
     * @param method - Object declaring the HTTP method name and properties
     * @param path - The path portion of the URL to send the request to
     */
    Request = function (d, method, path) {
        this.d = d;
        this.method = method;
        this.path = path;
    };

    /*
     * Declare request headers in Object (key/value) format
     * @param - Request headers (key/value)
     * @return Request instance
     */
    Request.prototype.header = function (reqHeaders) {
        if (typeof reqHeaders === 'object') {
            this.reqHeaders = reqHeaders;
        }
        return this;
    };

    /*
     * Declare a Query string in standard URL query format or by providing an object with
     * key/value pairs. Query will only be set if the HTTP method supports it (GET/DELETE/HEAD).
     * @param _query - Query string or Object
     * @return Request instance
     */
    Request.prototype.query = function (_query) {
        if (this.method.query && (typeof _query === 'object' || typeof _query === 'string')) {
            this._query = _query;
        }
        return this;
    };

    /*
     * Declare a request body in Object or String format. For objects, the 'application/json'
     * header will be automatically added during sending. Body will oly be set if the HTTP
     * method supports it (POST/PUT).
     * @param _body - Object or string content for the HTTP request
     * @return Request instance
     */
    Request.prototype.body = function (_body) {
        if (this.method.body && (typeof _body === 'object' || typeof _body === 'string')) {
            this._body = _body;
        }
        return this;
    };

    /*
     * Declare a callback to be called when the HTTP request is successful. The callback will
     * be triggered with the following signature: (body, status, responseHeaders), where the
     * body and responseHeaders will be parsed into Objects if the 'autoParse' option is enabled.
     * @param onSuccess - A function to be called after successful HTTP request
     * @return Request instance
     */
    Request.prototype.success = function(onSuccess) {
        this.onSuccess = onSuccess;
        return this;
    };

    /*
     * Declare a callback to be called when the HTTP request has encountered an error, server side
     * or local. The callback will be triggered with the following signature: (error, status, responseHeaders),
     * where the error and response headers will be parsed into Objects if the 'autoParse' option is enabled.
     * @param onError - A function to be called after an unsuccessful HTTP request
     * @return Request instance
     */
    Request.prototype.error = function(onError) {
        this.onError = onError;
        return this;
    };

    /*
     * Send the request after building it.
     */
    Request.prototype.send = function () {
        var self = this;
        (function () {
            self.d.send(self);
        })();
    };

    /*
     * Build an XMLHttpRequest object based on the user agent and CORS options
     * @return XMLHttpRequest
     */
    Utilities.buildXHR = function (isCorsEnabled, isCorsWithCredentialsEnabled) {
        if (isCorsEnabled && typeof XDomainRequest !== 'undefined') {
            return new XDomainRequest();
        }
        var xhr = new XMLHttpRequest();
        if (isCorsEnabled && !('withCredentials' in xhr)) {
            throw new Error('CORS is not supported by this user agent');
        }
        else if (isCorsEnabled && isCorsWithCredentialsEnabled && 'withCredentials' in xhr) {
            xhr.withCredentials = 'true';
        }
        return xhr;
    };

    /*
     * Build a request header object by combining all declared headers. Will automatically
     * populate the Content-Type header as long as the Body type is an object or string.
     * @param discussHeaders - An object of header key/values declared on the Discuss object
     * @param requestHeaders - An object of header key/values declared on the Request object
     * @param bodyType - The object type (typeof) of the HTTP request content
     * @param charset - The encoding to declare for a request body that is a string
     * @return An object containing all compiled headers
     */
    Utilities.buildHeaders = function (discussHeaders, requestHeaders, bodyType, charset) {
        var compiledHeaders = {};
        for (var defaultHeader in discussHeaders) {
            if (discussHeaders.hasOwnProperty(defaultHeader)) {
                compiledHeaders[defaultHeader] = discussHeaders[defaultHeader];
            }
        }
        if (bodyType === 'object') {
            compiledHeaders['Content-Type'] = 'application/json';
        }
        else if (bodyType === 'string') {
            compiledHeaders['Content-Type'] = 'text/html; charset=' + charset;
        }

        for (var newHeader in requestHeaders) {
            if (requestHeaders.hasOwnProperty(newHeader)) {
                compiledHeaders[newHeader] = requestHeaders[newHeader];
            }
        }
        return compiledHeaders;
    };

    /*
     * Build a valid query string from an Object or from a properly formatted query string. 
     * @param query - A query string or Object (key/value)
     * @return A valid query string
     */
    Utilities.buildQueryString = function (query) {
        if (typeof query === 'string' && /^[?](?:(?:(?!=[^?&=])&|(?:[^?&=]+=[^?&=]+))+)*$/.test(query)) {
            // Test for a query string with a leading question mark
            return query;
        }
        else if (typeof query === 'string' && /^(?:(?:(?!=[^?&=])&|(?:[^?&=]+=[^?&=]+))+)*$/.test(query)) {
            // Add a leading question mark if the query string is otherwise valid
            return '?' + query;
        }
        else if (typeof query === 'object' && Object.keys(query).length > 0) {
            var queryString = '';
            for (var p in query) {
                if (query.hasOwnProperty(p)) {
                    if (queryString) {
                        queryString = queryString + '&';
                    }
                    queryString = queryString + encodeURIComponent(p) + '=' + encodeURIComponent(query[p]);
                }
            }
            return '?' + queryString;
        }
        return '';
    };

    /*
     * Return response headers. If autoParse is enabled, will attempt to parse them into
     * an object.
     * @param responseHeaderText - The header text from the HTTP response
     * @param isAutoParseEnabled - Parse the headers into an object if true
     * @return A string or an object containing HTTP headers
     */
    Utilities.parseResponseHeaders = function(responseHeaderText, isAutoParseEnabled) {
        var responseHeaders = responseHeaderText;
        if (isAutoParseEnabled) {
            try {
                var headers = {};
                var lines = responseHeaderText.split('\n');
                for (var i in lines) {
                    if (lines[i] === '') {
                        continue;
                    }
                    var line = lines[i].trim();
                    var splitHeader = line.split(':');
                    headers[splitHeader[0].trim()] = splitHeader[1].trim();
                }
                responseHeaders = headers;
            }
            catch (e) {
                console.error('Unable to parse response headers');
            }
        }
        return responseHeaders;
    };

    /*
     * Parses the response body into an Object if autoParse is enabled and if the response headers
     * contain the 'application/json' Content-Type.
     * @param responseText - The body of the HTTP response
     * @param responseHeaders - The headers from the HTTP response as a String or an Object (key/value)
     * @param isAutoParseEnabled - Parse the body into a object if true.
     * @return A string or an object containing the body of the response
     */
    Utilities.parseResponseBody = function (responseText, responseHeaders, isAutoParseEnabled) {
        var responseBody = responseText;
        if (isAutoParseEnabled) {
            if ((typeof responseHeaders === 'object' && 'Content-Type' in responseHeaders && responseHeaders['Content-Type'].indexOf('application/json') > -1) ||
                (typeof responseHeaders === 'string' && /^Content-Type:.*application\/json.*$/m.test(responseHeaders))) {
                try {
                    responseBody = JSON.parse(responseBody);
                }
                catch (e) {
                    console.error('Unable to parse response body');
                }
            }
        }
        return responseBody;
    };

    /*
     * Combine two portions of a URL. Accounts for forward slashes and concatenates them.
     * @param first - Left string argument
     * @param second - Right string argument
     * @return A concatenated URL
     */
    Utilities.joinPaths = function (first, second) {
        if (typeof second === 'number') {
            second = second.toString();
        }

        var endsWithSlash = new RegExp(/^(.*\w)\/*$/);
        var beginsWithSlash = new RegExp(/^\/*(.*\w)$/);
        if (endsWithSlash.test(first) && beginsWithSlash.test(second)) {
            return endsWithSlash.exec(first)[1] + '/' + beginsWithSlash.exec(second)[1];
        }
        else {
            throw new Error('Unable to parse paths');
        }
    };

    if (typeof define === 'function') {
        define(function () {
            return Discuss;
        });
    }
    else {
        scope.Discuss = Discuss;
    }

})(this);