chai.config.includeStack = true;
describe('discuss.js', function () {

    describe('GET', function () {
        it ('should perform a basic GET', function (done) {
            var d = new Discuss('http://localhost:9000/user').configure({ cors: true });
            d.get().send().then(function(response) {
                chai.assert.equal(response.status, 200);
                chai.assert('Content-Type' in response.headers);
                chai.assert(response.headers['Content-Type'], 'application/json');
                chai.assert.deepEqual(response.body, {
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
            })
            .catch(function(error) {
                chai.assert(false);
                done();
            });

            
        });

        it ('should obey the noPromises flag for a basic GET', function (done) {
            
            var d = new Discuss('http://localhost:9000/user').configure({
                cors: true,
                noPromises: true
            });
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
            d.get('/' + userId).send().then(function(response) {
                    chai.assert.equal(response.status, 200);
                    chai.assert('Content-Type' in response.headers);
                    chai.assert(response.headers['Content-Type'], 'application/json');
                    chai.assert.deepEqual(response.body, { 'username': 'testuser3' });
                    done();
            })
            .catch(function(error) {
                chai.assert(false);
                done();
            });
        });

        it ('should translate query parameter into a query string', function (done) {
            var d = new Discuss('http://localhost:9000/logs').configure({ cors: true });

            d.get().query({ 'from': 523, 'to': 'end' }).send()
                .then(function(response) {
                    chai.assert.equal(response.status, 200);
                    chai.assert('Content-Type' in response.headers);
                    chai.assert.equal(response.headers['Content-Type'], 'text/html; charset=utf-8');
                    chai.assert.equal(response.body, "?from=523&to=end");
                    done();
                })
                .catch(function(error) {
                    chai.assert(false);
                    done();
                });
        });

        it ('should accept custom headers at instantiation', function (done) {
            var d = new Discuss('http://localhost:9000/headerbounce')
                .configure({ cors: true })
                .header({
                    'custom-header-a' : 'value goes here',
                    'custom-header-b' : 'more data here',
                });

            d.get().send()
                .then(function(response) {
                    chai.assert.equal(response.status, 200);
                    chai.assert('Content-Type' in response.headers);
                    chai.assert(response.headers['Content-Type'], 'application/json');
                    chai.assert.equal(response.body['custom-header-a'], 'value goes here');
                    chai.assert.equal(response.body['custom-header-b'], 'more data here');
                    done();
                })
                .catch(function(error) {
                    chai.assert(false);
                    done();
                });
        });

        it ('should accept custom headers after instatiation', function (done) {
            var d = new Discuss('http://localhost:9000/headerbounce').configure({ cors: true });

            d.get().header({
                    'custom-header-a' : 'value goes here',
                    'custom-header-b' : 'more data here',
                })
                .send()
                .then(function(response) {
                    chai.assert.equal(response.status, 200);
                    chai.assert('Content-Type' in response.headers);
                    chai.assert(response.headers['Content-Type'], 'application/json');
                    chai.assert.equal(response.body['custom-header-a'], 'value goes here');
                    chai.assert.equal(response.body['custom-header-b'], 'more data here');
                    done();
                })
                .catch(function(error) {
                    chai.assert(false);
                    done();
                });
        });
    });

    describe('POST', function () {
        it ('should perform a basic POST', function (done) {
            var postdata = {
                username: 'testuser',
                score: '4358194'
            };

            var d = new Discuss('http://localhost:9000/highscore').configure({ cors: true });

            d.post().body(postdata).send()
                .then(function(response) {
                    chai.assert.equal(response.status, 201);
                    chai.assert.deepEqual(response.body, postdata);
                    done();
                })
                .catch(function(error) {
                    chai.assert(false);
                    done();
                });
        });
    });

    describe('PUT', function () {
        it ('should perform a basic PUT', function (done) {
            var putdata = {
                'message' : 'what is the question?'
            };

            var d = new Discuss('http://localhost:9000/answers').configure({ cors: true });

            d.put(42).body(putdata).send()
                .then(function(response) {
                    chai.assert.equal(response.status, 200);
                    chai.assert.equal(response.body.id, 42);
                    chai.assert.equal(response.body.about.length, 3);
                    chai.assert.equal(response.body.about[0], 'life');
                    chai.assert.equal(response.body.about[1], 'the universe');
                    chai.assert.equal(response.body.about[2], 'everything');
                    chai.assert.deepEqual(response.body.original, putdata);
                    done();
                })
                .catch(function(error) {
                    chai.assert(false);    
                    done();
                });
        });
    });

    describe('DELETE', function () {
        it ('should perform a basic DELETE', function (done) {
            var d = new Discuss('http://localhost:9000/something/we/dont/need').configure({ cors: true });

            d.delete('/93793').send()
                .then(function(response) {
                    chai.assert.equal(response.status, 200);
                    done();
                })
                .catch(function(error) {
                    chai.assert(false);
                    done();
                });
        });

        it ('should translate query parameter into a query string', function (done) {
            var d = new Discuss('http://localhost:9000/something/else/we/dont/need').configure({ cors: true });

            d.delete(43622).query({ 'zip': 90210, 'haircolor': 'brown', 'disposition': 'idiot' }).send()
                .then(function(response) {
                    chai.assert.equal(response.status, 200);
                    chai.assert('Content-Type' in response.headers);
                    chai.assert.equal(response.headers['Content-Type'], 'text/html; charset=utf-8');
                    chai.assert.equal(response.body, "?zip=90210&haircolor=brown&disposition=idiot");
                    done();
                })
                .catch(function(error) {
                    chai.assert(false);
                    done();
                });
        });
    });

    describe('', function () {
        it ('should destroy the Test API server', function (done) {
            var d = new Discuss('http://localhost:9000/finished').configure({ cors: true, timeout: 1000 });

            d.post().send()
                .then(function(response) {
                    chai.assert.equal(response.status, 200);
                })
                .catch(function(error) {
                    chai.assert(false);
                    done();
                })
                .then(function() {
                    d.post().send()
                        .then(function(response) {
                            chai.assert(false);
                            done();
                        })
                        .catch(function (error) {
                            // Verify that it's dead
                            chai.assert.equal(error.status, 0);
                            done();
                        });
                });
        });
    });
});