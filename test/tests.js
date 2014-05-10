describe('discuss.js', function () {

    it('should perform a basic GET', function (done) {
        var d = new Discuss('http://localhost:9000/user', { cors: true });
        d.get(function(body, error, status, responseHeaders) {
            chai.assert.equal(status, 200);
            chai.assert.deepEqual(body, {
                username: 'testuser'
            });
            done();
        });
    });

    it('should perform a basic POST', function (done) {
        var postdata = {
            username: 'testuser',
            score: '4358194'
        };

        var d = new Discuss('http://localhost:9000/highscore', { cors: true });
        d.post(postdata,
            function(body, error, status, responseHeaders) {
                chai.assert.equal(status, 201);
                chai.assert.deepEqual(body, postdata);
                done();
            }
        );
    });

    it('should perform a basic PUT', function (done) {
        var putdata = {
            'message' : 'what is the question?'
        };

        var d = new Discuss('http://localhost:9000/answers/42', { cors: true });
        d.put(putdata,
            function(body, error, status, responseHeaders) {
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

    it('should destroy the Test API server', function (done) {
        var d = new Discuss('http://localhost:9000/finished', { cors: true });
        d.post(function(body, error, status, responseHeaders) {
            chai.assert.equal(status, 200);
            done();
        });
    });
});