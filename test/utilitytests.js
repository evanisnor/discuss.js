chai.config.includeStack = true;
describe('Utility', function () {
    var Utilities = Discuss._support.Utilities;

    describe('joinPaths', function () {

        it('should join an optional basepath and an optional URI path', function () {

            chai.assert.equal(Utilities.joinPaths(undefined, undefined), "/");
            chai.assert.equal(Utilities.joinPaths("", undefined), "/");
            chai.assert.equal(Utilities.joinPaths(undefined, ""), "/");
            chai.assert.equal(Utilities.joinPaths(undefined, 42), "/42");
            chai.assert.equal(Utilities.joinPaths("/api", 42), "/api/42");
            chai.assert.equal(Utilities.joinPaths(227, 42), "/227/42");
            chai.assert.equal(Utilities.joinPaths("", ""), "/");
            chai.assert.equal(Utilities.joinPaths("", "/test"), "/test");
            chai.assert.equal(Utilities.joinPaths("", "//////test"), "/test");
            chai.assert.equal(Utilities.joinPaths("", "/test/path/here"), "/test/path/here");
            chai.assert.equal(Utilities.joinPaths("/", "/test"), "/test");
            chai.assert.equal(Utilities.joinPaths("/////", "test"), "/test");
            chai.assert.equal(Utilities.joinPaths("///", "//////test"), "/test");
            chai.assert.equal(Utilities.joinPaths("/api", "/test/path/here"), "/api/test/path/here");

            chai.assert.equal(Utilities.joinPaths("", "/test/path/here?val=9&filter=test"), "/test/path/here");
            chai.assert.equal(Utilities.joinPaths("http://testserver.com/", "/test/path/here"), "http://testserver.com/test/path/here");
            chai.assert.equal(Utilities.joinPaths("http://testserver.com//api//", "/test/path/here"), "http://testserver.com/api/test/path/here");
            chai.assert.equal(Utilities.joinPaths("http://testserver.com//api//", "/test/path/here?val=9&filter=test"), "http://testserver.com/api/test/path/here");

        });

    });

    describe('buildQueryString', function () {
       
        it('should build query strings', function () {
            
            chai.assert.equal(Utilities.buildQueryString(""), "?");
            chai.assert.equal(Utilities.buildQueryString("?"), "?");
            chai.assert.equal(Utilities.buildQueryString("?value=24"), "?value=24");
            chai.assert.equal(Utilities.buildQueryString("?value=24&hello=yes&this=is&dog=true"), "?value=24&hello=yes&this=is&dog=true");
            
            chai.assert.equal(Utilities.buildQueryString({}), "");
            chai.assert.equal(Utilities.buildQueryString({ value: 24 }), "?value=24");
            chai.assert.equal(Utilities.buildQueryString({ value: true }), "?value=true");
            chai.assert.equal(Utilities.buildQueryString({ value: true, hello: 'yes' }), "?value=true&hello=yes");
            chai.assert.equal(Utilities.buildQueryString({ value: true, hello: 'yes', "this": "is", dog: true }), "?value=true&hello=yes&this=is&dog=true");

            chai.assert.equal(Utilities.buildQueryString({ nonsense: "&?/"}), "?nonsense=%26%3F%2F");
            chai.assert.equal(Utilities.buildQueryString({ nonsense: "&?/", "more&nonsense": "hello-*va#lue"}), "?nonsense=%26%3F%2F&more%26nonsense=hello-*va%23lue");

        });

    });

});