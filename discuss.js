(function (scope) {

    var _arrayContains = function (array, val) {
        for (var i = 0; i < array.length; i++) {
            if (array[i] == val) {
                return true;
            }
        }
        return false;
    };

    var Discuss = function (path, headers, options) {
        this.methods = [ 'get', 'post', 'put', 'delete', 'head' ];
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
            autoParse: true,
            timeout: 30000,
            cors: false
        };
        for (var o in options) {
            if (options.hasOwnProperty(o) && this.options.hasOwnProperty(o)) {
                this.options[o] = options[o];
            }
        }
    };

    Discuss.prototype._initMethods = function () {
        var self = this;
        for (var i in this.methods) {
            (function(method) {
                Discuss.prototype['method'] = function () {
                    arguments.unshift(method);
                    Discuss.prototype.request(self, arguments);
                };
            }(this.methods[i]));
        }
    };

    /*
     *  Discuss.request(method, [[[[headers], ] query, ] body], callback);
     */
    Discuss.prototype.request = function () {
        if (typeof arguments[0] !== 'string' || !_arrayContains(this.methods, arguments[0])) {
            throw 'Invalid method type';
        }

        if (typeof arguments[1] === 'function') {
            arguments[4] = arguments[1];
            arguments[3] = null;
            arguments[2] = null;
            arguments[1] = null;
        }
        else if ((typeof arguments[1] === 'Object' || typeof arguments[1] === 'string')
            && typeof arguments[2] === 'function') {
            
            arguments[4] = arguments[2];
            arguments[3] = arguments[1];
            arguments[2] = null;
            arguments[1] = null;
        }
        else if ((typeof arguments[1] === 'Object' || typeof arguments[1] === 'string')
            && (typeof arguments[2] === 'Object' || typeof arguments[2] === 'string')
            && typeof arguments[3] === 'function') {
            
            arguments[4] = arguments[3];
            arguments[3] = arguments[2];
            arguments[2] = arguments[1];
            arguments[1] = null;
        }

        Discuss.prototype.send.apply(this, arguments);
    };

    Discuss.prototype.send = function (method, headers, query, body, callback) {
        var url = this.path;

        if (query && Object.keys(query).length > 0) {
            url = url + this._buildQueryString(query);
        }

        var xhr = this._buildXHR();
        xhr.open(method, this.path, true);

        var compiledHeaders = this._buildHeaders(headers);
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

            try {
                responseBody = JSON.parse(responseBody);
            }
            catch {
                callback(new Error('Unable to parse response body'), null, status, responseHeaders);
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

    Discuss.prototype._buildHeaders = function (headers) {
        var compiledHeaders = {};
        for (var p in this.headers) {
            if (this.headers.hasOwnProperty(p)) {
                compiledHeaders[p] = this.headers[p];
            }
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