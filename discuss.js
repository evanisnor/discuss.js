(function (scope) {

    var Discuss = function (path, options, headers) {
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
        this._initOptions(options);
        this._initHeaders(headers);
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
            (function (method) {
                Discuss.prototype[method] = function () {
                    var args = Array.prototype.slice.call(arguments);
                    args.unshift(method);
                    Discuss.prototype.request.apply(self, args);
                };
            }(m));
        }
    };

    /*
     *  Discuss.request(method [, query | body], callback [, headers]);
     */
    Discuss.prototype.request = function () {
        var args = Array.prototype.slice.call(arguments);
        if (typeof args[0] !== 'string' || !(args[0] in this.methods)) {
            throw 'Invalid method type: ' + (typeof args[0]);
        }

        var method = this.methods[args[0]];

        if (args.length >= 2 && typeof args[1] === 'function') {
            args.splice(1, 0, undefined, undefined);
        }
        else if (method.query && args.length >= 3 && typeof args[2] === 'function') {
            args.splice(2, 0, undefined);
        }
        else if (method.body && args.length >= 3 && typeof args[2] === 'function') {
            args.splice(1, 0, undefined);
        }

        if (args.length === 4 || args.length === 5 && typeof args[args.length - 1] === 'object') {
            Discuss.prototype.send.apply(this, args);
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

        var timer = setTimeout(function() {
            xhr.abort();
            callback(new Error('Request has timed out'));
        }, this.options.timeout);

        var self = this;
        xhr.onreadystatechange = function () {
            clearTimeout(timer);
            if (xhr.readyState === 4) {
                self._handleResponse(xhr.status, xhr.responseText, xhr.getAllResponseHeaders(), callback);
            }
        };

        if (body && typeof body === 'object') {
            xhr.send(JSON.stringify(body));
        }
        else if (body && typeof body === 'string') {
            xhr.send(body);
        }
        else {
            xhr.send();
        }
    };

    Discuss.prototype._handleResponse = function (status, responseText, responseHeaderText, callback) {
        var responseBody = responseText, responseHeaders;
        if (this.options.autoParse) {
            try {
                responseHeaders = this._parseResponseHeaders(responseHeaderText);
            }
            catch (e) {
                responseHeaders = new Error('Unable to parse response headers');
            }

            if ('Content-Type' in responseHeaders && responseHeaders['Content-Type'].indexOf('application/json') > -1) {
                try {
                    responseBody = JSON.parse(responseBody);
                }
                catch (e) {
                    callback(new Error('Unable to parse response body'), null, status, responseHeaders);
                }
            }
        }

        if (status >= 100 || status < 300 || status === 304) {
            // Success
            callback(responseBody, null, status, responseHeaders);
        }
        else {
            // Error of some kind
            callback(null, responseBody, status, responseHeaders);
        }
    };

    Discuss.prototype._parseResponseHeaders = function (responseHeaderText) {
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
        return headers;
    };

    Discuss.prototype._buildXHR = function () {
        if (this.options.cors && typeof XDomainRequest !== 'undefined') {
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
        for (var defaultHeader in this.headers) {
            if (this.headers.hasOwnProperty(defaultHeader)) {
                compiledHeaders[defaultHeader] = this.headers[defaultHeader];
            }
        }
        if (bodyType === 'object') {
            compiledHeaders['Content-Type'] = 'application/json';
        }
        else if (bodyType === 'string') {
            compiledHeaders['Content-Type'] = 'text/plain; charset=' + this.options.charset;
        }

        for (var newHeader in headers) {
            if (headers.hasOwnProperty(newHeader)) {
                compiledHeaders[newHeader] = headers[newHeader];
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