describe('discuss.js', function () {

    describe('GET', function () {
        it ('should perform a basic GET', function (done) {
            var d = new Discuss('http://localhost:9000/user', { cors: true });
            d.get(function(body, error, status) {
                chai.assert(!error);
                chai.assert.equal(status, 200);
                chai.assert.deepEqual(body, {
                    username: 'testuser'
                });
                done();
            });
        });

        it ('should translate query parameter into a query string', function (done) {
            var d = new Discuss('http://localhost:9000/logs', { cors: true, autoParse: false });
            d.get({ 'from': 523, 'to': 'end' },
                function(body, error, status) {
                    chai.assert(!error);
                    chai.assert.equal(status, 200);
                    chai.assert.equal(body, "?from=523&to=end");
                    done();
                }
            );
        });
    });

    describe('POST', function () {
        it ('should perform a basic POST', function (done) {
            var postdata = {
                username: 'testuser',
                score: '4358194'
            };

            var d = new Discuss('http://localhost:9000/highscore', { cors: true });
            d.post(postdata,
                function(body, error, status) {
                    chai.assert(!error);
                    chai.assert.equal(status, 201);
                    chai.assert.deepEqual(body, postdata);
                    done();
                }
            );
        });
    });

    describe('PUT', function () {
        it ('should perform a basic PUT', function (done) {
            var putdata = {
                'message' : 'what is the question?'
            };

            var d = new Discuss('http://localhost:9000/answers/42', { cors: true });
            d.put(putdata,
                function(body, error, status) {
                    chai.assert(!error);
                    chai.assert.equal(status, 200);
                    chai.assert.equal(body.id, 42);
                    chai.assert.equal(body.about.length, 3);
                    chai.assert.equal(body.about[0], 'life');
                    chai.assert.equal(body.about[1], 'the universe');
                    chai.assert.equal(body.about[2], 'everything');
                    chai.assert.deepEqual(body.original, putdata);
                    done();
                }
            );
        });
    });

    describe('DELETE', function () {
        it ('should perform a basic DELETE', function (done) {
            var d = new Discuss('http://localhost:9000/something/we/dont/need/93793', { cors: true });
            d.delete(function (body, error, status) {
                chai.assert(!error);
                chai.assert.equal(status, 200);
                done();
            });
        });
    });

    describe('', function () {
        it ('should destroy the Test API server', function (done) {
            var d = new Discuss('http://localhost:9000/finished', { cors: true, timeout: 1000 });
            d.post(function(body, error, status) {
                chai.assert(!error);
                chai.assert.equal(status, 200);
           
                d.post(function (body, error, status) {
                    // Verify that it's dead
                    chai.assert(!body);
                    chai.assert(error instanceof Error);
                    chai.assert.equal(status, 0);
                    done();
                });
            });
        });
    });
});