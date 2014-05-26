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
     *      noPromises  (default: false)    - Ignore any present Promises libs and force the alternate chaining syntax
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
            corsWithCredentials: false,
            noPromises: false
        };
        this.setupMethodHandlers();
        this.promiseLib = this.detectPromise();
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
        for (var i in this.methods) {
            (function (instance, method) {
                instance[method.name] = function (path) {
                    return new Request(instance, method, path);
                };
            }(this, this.methods[i]));
        }
    };

    /*
     * Determine if Promises are supported by the current environment.
     * Only supports libraries that abide by the Promises/A+ spec and implement deferred promises.
     */
    Discuss.prototype.detectPromise = function () {
        if (!this.options.noPromises) {
            try {
                var supportedLibs = [window['Promise'], window['Q'], window['assure'], window['Promiz'], window['Y']];
                for (var i in supportedLibs) {
                    var lib = supportedLibs[i];
                    if (!!lib && !!lib.defer) {
                        return lib;
                    }
                }
            }
            catch (e) {
            }
        }
        return undefined;
    };

    Discuss.prototype.send = function (request) {
        var self = this;
        var routine = function (resolve, reject) {
            if (!request || !(request instanceof Request)) {
                throw new Error('Invalid send parameters');
            }

            var url = self.basepath;
            if (!url) {
                url = '';
            }

            if (request.path) {
                url = Utilities.joinPaths(self.basepath, request.path);
            }

            if (request._query) {
                url = url + Utilities.buildQueryString(request._query);
            }

            var xhr = Utilities.buildXHR(self.options.cors, self.options.corsWithCredentials);
            xhr.open(request.method.name, url, true);

            var headers = Utilities.buildHeaders(self.reqHeaders, request.reqHeaders, typeof request._body, self.options.charset);
            for (var header in headers) {
                if (headers.hasOwnProperty(header)) {
                    xhr.setRequestHeader(header, headers[header]);
                }
            }

            var timer = setTimeout(function() {
                xhr.abort();
                if (reject && self.promiseLib) {
                    reject({
                        body: 'A network timeout has occurred',
                        status: 0
                    });
                }
                else if (reject) {
                    reject('A network timeout has occurred', 0);
                }
            }, self.options.timeout);

            xhr.onerror = function () {
                clearTimeout(timer);
                if (reject && self.promiseLib) {
                    reject({
                        body: 'A network-level exception has occurred',
                        status: 0
                    });
                }
                else if (reject) {
                    reject('A network-level exception has occurred', 0);
                }
            };
            xhr.onreadystatechange = function () {
                clearTimeout(timer);
                if (xhr.readyState === 4) {
                    var responseHeaders = Utilities.parseResponseHeaders(xhr.getAllResponseHeaders(), self.options.autoParse);
                    var responseBody = Utilities.parseResponseBody(xhr.responseText, responseHeaders, self.options.autoParse);
                    var callback = (xhr.status >= 100 && xhr.status < 300 || xhr.status === 304) ? resolve : reject;
                    if (callback && xhr.status !== 0 && self.promiseLib) {
                        callback({
                            body: responseBody,
                            status: xhr.status,
                            headers: responseHeaders
                        });
                    }
                    else if (callback && xhr.status !== 0) {
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
                if (reject && self.promiseLib) {
                    reject({
                        body: error,
                        status: 0
                    });
                }
                else if (reject) {
                    reject(error, 0);
                }
            }
        };

        if (this.promiseLib) {
            var deferred = this.promiseLib.defer();
            routine(deferred.resolve, deferred.reject);
            return deferred.promise;
        }
        else {
            routine(request.onSuccess, request.onError);
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
        return (function () {
            return self.d.send(self);
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
                var lines = responseHeaderText.replace(/\r\n/g, '\n').split('\n');
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
     * Combine portions of a URL.
     * @param arguments - Arguments to join into a path
     * @return A concatenated path
     */
    Utilities.joinPaths = function () {
        var args = Array.prototype.slice.call(arguments);
        var elements = [];
        for (var i in args) {
            if (!args[i] || typeof args[i] === 'object' || typeof args[i] === 'function') {
                args[i] = '';
            }
            else if (typeof args[i] !== 'string') {
                args[i] = '' + args[i];
            }
            else if (/.+\?.*/.test(args[i])) {
                args[i] = args[i].match(/(.+)\?.*/)[1];
            }

            var matches = args[i].match(/((?:[a-zA-Z]+:\/\/)?[^\/?&=]+)/g);
            if (matches && matches.length > 0) {
                Array.prototype.push.apply(elements, matches);
            }
        }
        var uri = elements.join('/');
        if (!/[a-zA-Z]+:\/\/.+/.test(uri)) {
            return '/' + uri;
        }
        return uri;
    };


    Discuss._support = {
        Request: Request,
        Utilities: Utilities
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