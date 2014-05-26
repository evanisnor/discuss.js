chai.config.includeStack = true;
describe('discuss.js', function () {

    describe('GET', function () {
        it ('should perform a basic GET', function (done) {
            var d = new Discuss('http://localhost:9000/user').configure({ cors: true });
            d.get().success(function(body, status, responseHeaders) {
                chai.assert.equal(status, 200);
                chai.assert('Content-Type' in responseHeaders);
                chai.assert(responseHeaders['Content-Type'], 'application/json');
                chai.assert.deepEqual(body, {
                    '2345' : {
                        'username': 'testuser1'
                    },
                    '2346' : {
                        'username': 'testuser2'
                    },
                    '2347' : {
                        'username': 'testuser3'
                    },
                    '2348' : {
                        'username': 'testuser4'
                    }
                });
                done();
            }).error(function() {
                chai.assert(false);
                done();
            }).send();
        });

        it ('should perform a basic GET with a path ammendment', function (done) {
            var d = new Discuss('http://localhost:9000/user').configure({ cors: true });

            var userId = 2347;
            d.get('/' + userId).success(function(body, status, responseHeaders) {
                    chai.assert.equal(status, 200);
                    chai.assert('Content-Type' in responseHeaders);
                    chai.assert(responseHeaders['Content-Type'], 'application/json');
                    chai.assert.deepEqual(body, { 'username': 'testuser3' });
                    done();
            }).error(function() {
                chai.assert(false);
            }).send();
        });

        it ('should translate query parameter into a query string', function (done) {
            var d = new Discuss('http://localhost:9000/logs').configure({ cors: true });
            d.get().query({ 'from': 523, 'to': 'end' })
                .success(function(body, status, responseHeaders) {
                    chai.assert.equal(status, 200);
                    chai.assert('Content-Type' in responseHeaders);
                    chai.assert.equal(responseHeaders['Content-Type'], 'text/html; charset=utf-8');
                    chai.assert.equal(body, "?from=523&to=end");
                    done();
                })
                .error(function() {
                    chai.assert(false);
                    done();
                }).send();
        });

        it ('should accept custom headers at instantiation', function (done) {
            var d = new Discuss('http://localhost:9000/headerbounce')
                .configure({ cors: true })
                .header({
                    'custom-header-a' : 'value goes here',
                    'custom-header-b' : 'more data here',
                });

            d.get().success(function(body, status, responseHeaders) {
                chai.assert.equal(status, 200);
                chai.assert('Content-Type' in responseHeaders);
                chai.assert(responseHeaders['Content-Type'], 'application/json');
                chai.assert.equal(body['custom-header-a'], 'value goes here');
                chai.assert.equal(body['custom-header-b'], 'more data here');
                done();
            }).error(function() {
                chai.assert(false);
                done();
            }).send();
        });

        it ('should accept custom headers after instatiation', function (done) {
            var d = new Discuss('http://localhost:9000/headerbounce').configure({ cors: true });

            d.get().header({
                    'custom-header-a' : 'value goes here',
                    'custom-header-b' : 'more data here',
                })
                .success(function(body, status, responseHeaders) {
                    chai.assert.equal(status, 200);
                    chai.assert('Content-Type' in responseHeaders);
                    chai.assert(responseHeaders['Content-Type'], 'application/json');
                    chai.assert.equal(body['custom-header-a'], 'value goes here');
                    chai.assert.equal(body['custom-header-b'], 'more data here');
                    done();
                })
                .error(function() {
                    chai.assert(false);
                    done();
                }).send();
        });
    });

    describe('POST', function () {
        it ('should perform a basic POST', function (done) {
            var postdata = {
                username: 'testuser',
                score: '4358194'
            };

            var d = new Discuss('http://localhost:9000/highscore').configure({ cors: true });
            d.post().body(postdata).success(function(body, status, responseHeaders) {
                chai.assert.equal(status, 201);
                chai.assert.deepEqual(body, postdata);
                done();
            }).error(function() {
                chai.assert(false);
                done();
            }).send();
        });
    });

    describe('PUT', function () {
        it ('should perform a basic PUT', function (done) {
            var putdata = {
                'message' : 'what is the question?'
            };

            var d = new Discuss('http://localhost:9000/answers').configure({ cors: true });
            d.put(42).body(putdata).success(function(body, status, responseHeaders) {
                chai.assert.equal(status, 200);
                chai.assert.equal(body.id, 42);
                chai.assert.equal(body.about.length, 3);
                chai.assert.equal(body.about[0], 'life');
                chai.assert.equal(body.about[1], 'the universe');
                chai.assert.equal(body.about[2], 'everything');
                chai.assert.deepEqual(body.original, putdata);
                done();
            }).error(function() {
                chai.assert(false);    
                done();
            }).send();
        });
    });

    describe('DELETE', function () {
        it ('should perform a basic DELETE', function (done) {
            var d = new Discuss('http://localhost:9000/something/we/dont/need').configure({ cors: true });
            d.delete('/93793').success(function(body, status) {
                chai.assert.equal(status, 200);
                done();
            }).error(function() {
                chai.assert(false);
                done();
            }).send();
        });

        it ('should translate query parameter into a query string', function (done) {
            var d = new Discuss('http://localhost:9000/something/else/we/dont/need').configure({ cors: true });
            d.delete(43622).query({ 'zip': 90210, 'haircolor': 'brown', 'disposition': 'idiot' })
                .success(function(body, status, responseHeaders) {
                    chai.assert.equal(status, 200);
                    chai.assert('Content-Type' in responseHeaders);
                    chai.assert.equal(responseHeaders['Content-Type'], 'text/html; charset=utf-8');
                    chai.assert.equal(body, "?zip=90210&haircolor=brown&disposition=idiot");
                    done();
                })
                .error(function() {
                    chai.assert(false);
                    done();
                }).send();
        });
    });

});