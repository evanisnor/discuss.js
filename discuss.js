(function (scope) {

    var Request = function (d, method, path) {
        this.d = d;
        this.method = method;
        this.path = path;
    };

    Request.prototype.headers = function (reqHeaders) {
        if (typeof reqHeaders === 'object') {
            this.reqHeaders = reqHeaders;
        }
        return this;
    };

    Request.prototype.query = function (_query) {
        if (this.method.query && (typeof _query === 'object' || typeof _query === 'string')) {
            this._query = _query;
        }
        return this;
    };

    Request.prototype.body = function (_body) {
        if (this.method.body && (typeof _body === 'object' || typeof _body === 'string')) {
            this._body = _body;
        }
        return this;
    };

    Request.prototype.success = function(onSuccess) {
        this.onSuccess = onSuccess;
        return this;
    };

    Request.prototype.error = function(onError) {
        this.onError = onError;
        return this;
    };

    Request.prototype.send = function () {
        var self = this;
        (function () {
            self.d.send(self);
        })();
    };

    var Discuss = function (basepath) {
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

    Discuss.prototype.headers = function (reqHeaders) {
        if (typeof reqHeaders === 'object') {
            this.reqHeaders = reqHeaders;
        }
        return this;
    };

    Discuss.prototype.configure = function (options) {
        for (var o in options) {
            if (options.hasOwnProperty(o) && this.options.hasOwnProperty(o)) {
                this.options[o] = options[o];
            }
        }
        return this;
    };

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

    Discuss.prototype.buildXHR = function () {
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

    Discuss.prototype.send = function (request) {
        if (!request || !(request instanceof Request) || !request.onSuccess) {
            throw new Error('Invalid send parameters');
        }

        var url = this.basepath;
        if (request.path) {
            url = this.joinPaths(this.basepath, request.path);
        }

        if (request._query) {
            url = url + this.buildQueryString(request._query);
        }

        var xhr = this.buildXHR();
        xhr.open(request.method.name, url, true);

        var headers = this.buildHeaders(request.reqHeaders, typeof request._body);
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
                var responseHeaders = self.parseResponseHeaders(xhr.getAllResponseHeaders());
                var responseBody = self.parseResponseBody(xhr.responseText, responseHeaders);
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

    Discuss.prototype.buildQueryString = function (query) {
        if (typeof query === 'string' && /^[?]((?:(?!=[\w*-+_.!'()$])&|([\w*-+_.!'()$]+=[\w*-+_.!'()$]+))+)*$/.test(query)) {
            // Test for a query string with a leading question mark
            return query;
        }
        else if (typeof query === 'string' && /^((?:(?!=[\w*-+_.!'()$])&|([\w*-+_.!'()$]+=[\w*-+_.!'()$]+))+)*$/.test(query)) {
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

    Discuss.prototype.parseResponseHeaders = function(responseHeaderText) {
        var responseHeaders = responseHeaderText;
        if (this.options.autoParse) {
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

    Discuss.prototype.parseResponseBody = function (responseText, responseHeaders) {
        var responseBody = responseText;
        if (this.options.autoParse && typeof responseHeaders === 'object') {
            if ('Content-Type' in responseHeaders && responseHeaders['Content-Type'].indexOf('application/json') > -1) {
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
     *  Discuss.request(method [, pathAmmendment] [, query | body], callback [, headers]);
     */
    // Discuss.prototype.request = function () {
    //     var args = Array.prototype.slice.call(arguments);
    //     if (typeof args[0] !== 'string' || !(args[0] in this.methods)) {
    //         throw 'Invalid method type: ' + (typeof args[0]);
    //     }

    //     var method = this.methods[args[0]];

    //     if (args[1] && typeof args[1] === 'number') {
    //         args[1] = args[1].toString();
    //     }

    //     if (args.length >= 2 && typeof args[1] === 'function') {
    //         args.splice(1, 0, undefined, undefined, undefined);
    //     }
    //     else if (method.query && args.length >= 3 && typeof args[1] === 'string' && (typeof args[2] === 'string' || typeof args[2] === 'object') && typeof args[3] === 'function') {
    //         args.splice(3, 0, undefined);
    //     }
    //     else if (method.body && args.length >= 3 && typeof args[1] === 'string' && (typeof args[2] === 'string' || typeof args[2] === 'object') && typeof args[3] === 'function') {
    //         args.splice(2, 0, undefined);
    //     }
    //     else if (method.query && args.length >= 2 && (typeof args[1] === 'string' || typeof args[1] === 'object') && typeof args[2] === 'function') {
    //         args.splice(2, 0, undefined);
    //         args.splice(1, 0, undefined);
    //     }
    //     else if (method.body && args.length >= 2 && (typeof args[1] === 'string' || typeof args[1] === 'object') && typeof args[2] === 'function') {
    //         args.splice(1, 0, undefined, undefined);
    //     }

    //     if (args.length == 5) {
    //         args.push(undefined);
    //     }

    //     if (args.length === 6
    //         && (typeof args[1] === 'string' || !args[1])
    //         && (typeof args[2] === 'string' || typeof args[2] === 'object' ||!args[2])
    //         && (typeof args[3] === 'string' || typeof args[3] === 'object' ||!args[3])
    //         && (typeof args[4] === 'function' || !args[4])
    //         && (typeof args[5] === 'object' || !args[5])) {
    //         Discuss.prototype.send.apply(this, args);
    //     }
    //     else {
    //         throw new Error('Invalid parameters');
    //     }
    // };

    // Discuss.prototype._send = function (method, path, query, body, callback, headers) {
    //     var url = this.basepath;
    //     if (path && typeof path === 'string') {
    //         url = this.joinPaths(this.basepath, path);
    //     }

    //     if (query && typeof query === 'object' && Object.keys(query).length > 0) {
    //         url = url + this._buildQueryString(query);
    //     }

    //     var xhr = this._buildXHR();
    //     xhr.open(method, url, true);

    //     var compiledHeaders = this._buildHeaders(headers, typeof body);
    //     for (var p in compiledHeaders) {
    //         if (compiledHeaders.hasOwnProperty(p)) {
    //             xhr.setRequestHeader(p, compiledHeaders[p]);
    //         }
    //     }

    //     var timer = setTimeout(function() {
    //         xhr.abort();
    //         callback(null, new Error('Request has timed out'), 0);
    //     }, this.options.timeout);

    //     var self = this;
    //     xhr.onerror = function () {
    //         clearTimeout(timer);
    //         callback(null, new Error('A network-level error has occurred'), 0);
    //     };
    //     xhr.onreadystatechange = function () {
    //         clearTimeout(timer);
    //         if (xhr.readyState === 4) {
    //             self._handleResponse(xhr.status, xhr.responseText, xhr.getAllResponseHeaders(), callback);
    //         }
    //     };

    //     try {
    //         if (body && typeof body === 'object') {
    //             xhr.send(JSON.stringify(body));
    //         }
    //         else if (body && typeof body === 'string') {
    //             xhr.send(body);
    //         }
    //         else {
    //             xhr.send();
    //         }
    //     }
    //     catch (error) {
    //         xhr.onerror(error);
    //     }
    // };

    // Discuss.prototype._handleResponse = function (status, responseText, responseHeaderText, callback) {
    //     if (status === 0) {
    //         return; // Network-level error. To be handled by xhr.onerror instead.
    //     }

    //     var responseBody = responseText,
    //         responseHeaders = responseHeaderText;
    //     if (this.options.autoParse) {
    //         try {
    //             responseHeaders = this._parseResponseHeaders(responseHeaderText);
    //         }
    //         catch (e) {
    //             responseHeaders = new Error('Unable to parse response headers');
    //         }

    //         if ('Content-Type' in responseHeaders && responseHeaders['Content-Type'].indexOf('application/json') > -1) {
    //             try {
    //                 responseBody = JSON.parse(responseBody);
    //             }
    //             catch (e) {
    //                 callback(new Error('Unable to parse response body'), null, status, responseHeaders);
    //             }
    //         }
    //     }

    //     if (status >= 100 && status < 300 || status === 304) {
    //         // Success
    //         callback(responseBody, null, status, responseHeaders);
    //     }
    //     else {
    //         // Server error of some kind
    //         callback(null, responseBody, status, responseHeaders);
    //     }
    // };

    // Discuss.prototype._parseResponseHeaders = function (responseHeaderText) {
    //     var headers = {};
    //     var lines = responseHeaderText.split('\n');
    //     for (var i in lines) {
    //         if (lines[i] === '') {
    //             continue;
    //         }
    //         var line = lines[i].trim();
    //         var splitHeader = line.split(':');
    //         headers[splitHeader[0].trim()] = splitHeader[1].trim();
    //     }
    //     return headers;
    // };

    Discuss.prototype.buildHeaders = function (headers, bodyType) {
        var compiledHeaders = {};
        for (var defaultHeader in this.reqHeaders) {
            if (this.reqHeaders.hasOwnProperty(defaultHeader)) {
                compiledHeaders[defaultHeader] = this.reqHeaders[defaultHeader];
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

    Discuss.prototype.joinPaths = function (first, second) {
        if (typeof second === 'number') {
            second = second.toString();
        }

        var endsWithSlash = new RegExp(/^(.*\w)\/*$/);
        var beginsWithSlash = new RegExp(/^\/*(.*\w)$/);
        if (endsWithSlash.test(first) && beginsWithSlash.test(second)) {
            return endsWithSlash.exec(first)[1] + '/' + beginsWithSlash.exec(second)[1];
        }
        else {
            throw 'Unable to parse paths';
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