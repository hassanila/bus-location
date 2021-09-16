const path = require("path");
express = require('express'),
    http = require('http'),
    app = express(),
    request = require('request'),
    cors = require('cors'),
    compression = require('compression'),
    https = require('https');

let httpServer = http.createServer(null, app);

//app.set('json spaces', 4)
app.set('trust proxy', true);
app.use(cors());
app.use(compression());
app.disable('x-powered-by');


httpServer.listen(3299, function () {
    console.log('HTTP on port 3294!');
});

app.use('/static', express.static('static'))

httpServer.on('error', err => console.log(('\nhttpServer:\n' + err)));
app.get('/', function(req, resp) {

    resp.sendFile(path.join(__dirname + '/index.html'));

});
app.get('/positions', function(req, resp) {

    request('https://production-dot-nobina-eu.appspot.com/api/GetVehiclePositions', {
        qs: req.query,
        headers: {
            'Host': 'production-dot-nobina-eu.appspot.com',
            'user-agent': 'gzip',
    'x-user-agent': 'Res i STHLM',
    'x-version': '2.2.2',
    'x-os': 'Android',
    'x-osversion': '29',
    'x-devicename': 'SM-G986B',
    'x-language': 'English'
        },
        gzip: true,
        followRedirect: false,
        strictSSL: false
    }, function (err, res, body) {

        body = JSON.parse(body);

        resp.json(body)
    });


});