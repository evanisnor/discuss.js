var express = require('express');
var bodyparser = require('body-parser');
var url = require('url');
var app = express();
app.use(bodyparser());

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,HEAD');
    res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
    next();
});

app.get('/user', function (req, res) {
    console.log('GET /user');
    res.send(200, {
        username: 'testuser'
    });
});

app.get('/logs', function (req, res) {
    var queryString = req.url.substr(req.url.indexOf('/logs') + 5);
    console.log('GET /logs' + queryString);
    res.send(200, queryString);
});

app.post('/highscore', function (req, res) {
    console.log('POST /highscore: ' + JSON.stringify(req.body));

    var responsebody = {};
    responsebody.username = req.body.username;
    responsebody.score = req.body.score;

    res.send(201, responsebody);
});

app.put('/answers/:num', function (req, res) {
    console.log('PUT /answers: ' + req.params.num + ' :: ' + JSON.stringify(req.body));

    res.send(200, {
        id: req.params.num,
        about: ['life', 'the universe', 'everything'],
        original: req.body
    });
});

app.delete('/something/we/dont/need/:id', function (req, res) {
    console.log('DELETE /something/we/dont/need/' + req.params.id);
    res.send(200);
});

app.post('/finished', function (req, res) {
    console.log('POST /finished');
    res.send(200);
    console.log('Test API is shutting down.');
    process.exit(0);
});

var server = app.listen(9000, function() {
    console.log('Listening on port %d', server.address().port);
});