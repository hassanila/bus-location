const path = require("path");
const WebSocket = require('ws');
express = require('express'),
    http = require('http'),
    app = express(),
    request = require('requestretry'),
    cors = require('cors'),
    compression = require('compression'),
    https = require('https');

let httpServer = http.createServer(null, app);

let BUSES = {};

//app.set('json spaces', 4)
app.set('trust proxy', true);
app.use(cors());
app.use(compression());
app.disable('x-powered-by');


httpServer.listen(3299, function () {
    console.log('HTTP on port 3299!');
});

app.use('/static', express.static('static'))

httpServer.on('error', err => console.log(('\nhttpServer:\n' + err)));
app.get('/', function(req, resp) {

    resp.sendFile(path.join(__dirname + '/index.html'));

});
app.get('/positions', function(req, resp) {

resp.json(objToSend);


});




let wss = new WebSocket.Server({server: httpServer});


let broadcastTimeout;
let lastMessageSent = null;
let startBroadcast = function () {

    clearTimeout(broadcastTimeout);

    if (wss.clients.size > 0) {

        let stringified = JSON.stringify(BUSES);

        if (lastMessageSent !== stringified) {
            lastMessageSent = stringified;


            wss.clients.forEach(function each(ws) {

                if (ws.isAlive === false) {
                    return ws.terminate();
                }

                ws.send(stringified);
            });

        }
    }

    broadcastTimeout = setTimeout(startBroadcast, 200);

};
let pingInterval = setInterval(function () {
    //lastMessageSent = null;
    wss.clients.forEach(function (ws) {

        if (ws.isAlive === false) {
            // console.log(getDateTime() + ' ' + (ws._socket.remoteAddress).replace('::ffff:', '') + ' has disconnected');
            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping(() => {
        });
    });
}, 30000);

wss.on('connection', function (ws) {

    console.log(getDateTime() + ' ' + 'New connection from: ' + (ws._socket.remoteAddress).replace('::ffff:', ''));

    lastMessageSent = null;

    ws.isAlive = true;


    ws.on('pong', function () {
        this.isAlive = true;
        //console.log(getDateTime() + ' ' + 'Received: pong from: ' + (ws._socket.remoteAddress).replace('::ffff:', ''))
    });

    ws.on('message', function (message) {
        console.log(getDateTime() + ' ' + 'Received: ' + message + ' from: ' + (ws._socket.remoteAddress).replace('::ffff:', ''));
        //lastMessageSent = null;

        if (message === 'update') {
            console.log('Updating...');
        }

    });

    ws.on('close', function () {
        // console.log(getDateTime() + ' ' + (ws._socket.remoteAddress).replace('::ffff:', '') + ' has disconnected');
    });
});

wss.on('error', function (err) {
    console.log(('WebSocket Server:\n' + err))
});

startBroadcast();

/*

 */

let routes = [
    '518',
    '543',
    '550',
    '542',
    '546',
    '564V',
    '564H',
    '544',
    '553H',
    '553V',
    '567',
    '552H',
    '552V',
    '561',
    '554',
    '541',
    '555',
    '559',
    '558',
    '591'
];


let getData = function (route) {

    request('https://production-dot-nobina-eu.appspot.com/api/GetVehiclePositions', {
        qs: {
            route: route
        },
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
        strictSSL: false,
        maxAttempts: 2,   // (default) try 5 times
        retryDelay: 250,

    }, function (err, res, body) {

        if (err) {
            return console.log(err);
        }

        try {
            let data = JSON.parse(body);

            let now = Date.now();

            data.pos = data.pos.filter((obj) => now-obj.t < 120000);

            // if same id in multiple nr

            BUSES[data.route] = data;

        } catch (e) {
            console.log(e.toString());
        }

    });
}


let i = 0;
let length = routes.length;
setInterval(() => {
    i = i > length-1 ? 0 : i;

    let now = Date.now();

    for (let nr in BUSES) {
        BUSES[nr].pos.forEach((obj, i) => {
            if (now-obj.t > 120000) {
                BUSES[nr].pos.splice(i, 1);
            }
        })
    }

    getData(routes[i++]);
}, Math.max(500, 3000 / length));



function getDateTime(onlyTime, noSeconds, onlyDate, minOffset = 0) {
    var date = new Date();

    date.setMinutes(date.getMinutes() + minOffset);

    var min = String(date.getMinutes()).padStart(2, "0");
    var hour = String(date.getHours()).padStart(2, "0");

    var sec = String(date.getSeconds()).padStart(2, "0");
    var year = String(date.getFullYear());
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");

    if (onlyDate) {
        return year + month + day;
    }

    return onlyTime
        ? hour + ":" + min + (noSeconds ? "" : ":" + sec)
        : year +
        "-" +
        month +
        "-" +
        day +
        " " +
        hour +
        ":" +
        min +
        (noSeconds ? "" : ":" + sec);
}