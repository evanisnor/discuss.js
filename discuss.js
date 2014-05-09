(function (scope) {

    var Discuss = function (path, headers, options) {
        this.methods = {
            'get': {
                query: true
            },
            'post': {
                body: true
            },
            'put': {
                body: true
            },
            'delete': {
            },
            'head': {
                query: true
            } 
        };

        this.path = path;
        this._initHeaders(headers);
        this._initOptions(options);
        this._initMethods();
    };

    Discuss.prototype._initHeaders = function (headers) {
        this.headers = headers;
    };

    Discuss.prototype._initOptions = function (options) {
        this.options = {
            charset: 'utf-8', // Used for encoding when the body to send is a string
            autoParse: true,  // Automatic parsing of response object to JSON if the content type is application/json
            timeout: 30000,
            cors: false,
            corsWithCredentials: false
        };
        for (var o in options) {
            if (options.hasOwnProperty(o) && this.options.hasOwnProperty(o)) {
                this.options[o] = options[o];
            }
        }
    };

    Discuss.prototype._initMethods = function () {
        var self = this;
        for (var m in this.methods) {
            (function(method) {
                Discuss.prototype[method] = function () {
                    arguments.unshift(method);
                    Discuss.prototype.request(self, arguments);
                };
            }(this.methods[m]));
        }
    };

    /*
     *  Discuss.request(method [, query | body], callback [, headers]);
     */
    Discuss.prototype.request = function () {
        if (typeof arguments[0] !== 'string' || !(arguments[0] in this.methods)) {
            throw 'Invalid method type';
        }

        var method = this.methods[arguments[0]];

        if (arguments.length > 2 && typeof arguments[1] === 'function') {
            arguments.splice(1, 0, undefined, undefined);
        }
        else if (method.query && arguments.length > 3 && typeof arguments[2] === 'function') {
            arguments.splice(2, 0, undefined);
        }
        else if (method.body && arguments.length > 3 && typeof arguments[2] === 'function') {
            arguments.splice(1, 0, undefined);
        }

        if (arguments.length == 4
            || arguments.length == 5 && typeof arguments[arguments.length - 1] == 'object') {
            Discuss.prototype.send.apply(this, arguments);
        }
        else {
            throw 'Invalid parameters';
        }
    };

    Discuss.prototype.send = function (method, query, body, callback, headers) {
        var url = this.path;

        if (query && Object.keys(query).length > 0) {
            url = url + this._buildQueryString(query);
        }

        var xhr = this._buildXHR();
        xhr.open(method, this.path, true);

        var compiledHeaders = this._buildHeaders(headers, typeof body);
        for (var p in compiledHeaders) {
            if (compiledHeaders.hasOwnProperty(p)) {
                xhr.setRequestHeader(p, compiledHeaders[p]);
            }
        }

        var timer = setTimer(function() {
            xhr.abort();
            callback(new Error('Request has timed out'));
        }, self.options.timeout);

        xhr.readystatechange = function () {
            clearTimeout(timeout);
            if (xhr.readyState === 4) {
                this._handleResponse(xhr.status, xhr.responseText, xhr.getAllResponseHeaders(), callback);
            }
        };

        xhr.send(body);
    };

    Discuss.prototype._handleResponse = function (status, responseText, responseHeaderText, callback) {
        var responseBody = responseText, responseHeaders;
        if (this.options.autoParse) {
            try {
                responseHeaders = this._parseResponseHeaders(responseHeaderText);
            }
            catch {
                responseHeaders = new Error('Unable to parse response headers');
            }

            if ('Content-Type' in responseHeaders && responseHeaders['Content-Type'].indexOf('application/json') > -1) {
                try {
                    responseBody = JSON.parse(responseBody);
                }
                catch {
                    callback(new Error('Unable to parse response body'), null, status, responseHeaders);
                }
            }
        }

        if (status < 100 || status >= 300) {
            callback(responseBody, null, status, responseHeaders);
        }
        else {
            callback(null, responseBody, status, responseHeaders);
        }
    };

    Discuss.prototype._parseResponseHeaders = function (responseHeaderText) {
        var headers = {};
        for (var i in responseHeaderText.split('\n')) {
            var splitHeader = responseHeaderText[i].split(':');
            headers[splitHeader[0]] = splitHeader[1];
        }
        return headers;
    };

    Discuss.prototype._buildXHR = function () {
        if (this.options.cors && typeof XDomainRequest !== 'undefined' {
            return new XDomainRequest();
        }
        var xhr = new XMLHttpRequest();
        if (this.options.cors && !('withCredentials' in xhr)) {
            throw 'CORS is not supported by this user agent';
        }
        else if (this.options.cors && this.options.corsWithCredentials && 'withCredentials' in xhr) {
            xhr.withCredentials = 'true';
        }
        return xhr;
    };

    Discuss.prototype._buildQueryString = function (query) {
        var queryString;
        for (var p in query) {
            if (query.hasOwnProperty(p)) {
                if (queryString) {
                    queryString = queryString + '&' + p + '=' + query[p];
                }
                else {
                    queryString = p + '=' + query[p];
                }
            }
        }
        return '?' + queryString;
    };

    Discuss.prototype._buildHeaders = function (headers, bodyType) {
        var compiledHeaders = {};
        for (var p in this.headers) {
            if (this.headers.hasOwnProperty(p)) {
                compiledHeaders[p] = this.headers[p];
            }
        }
        if (bodyType === 'object') {
            compiledHeaders['Content-Type'] = 'application/json';
        }
        else if (bodyType === 'string') {
            compiledHeaders['Content-Type'] = 'text/plain; charset=' + this.options.charset;
        }

        for (var p in headers) {
            if (headers.hasOwnProperty(p)) {
                compiledHeaders[p] = headers[p];
            }
        }
        return compiledHeaders;
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