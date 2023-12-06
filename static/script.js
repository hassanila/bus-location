let map;
let wss;
let errorCount = 0;
let countdownInterval;
let reconnectTimeout;
let showErrorTimeout;
let firstMessage = true;
let firstRun = true;
let isRestarting = false;
let buses = {};
let icons = {
    red: './static/bus_top_red.png',
    grey: './static/bus_top_grey.png',
    blue: './static/bus_top_blue.png',
    error: './static/bus_top_error.png',
}

let initialZoom = 13;
let initialTextSize = 15;
let maxZoom = 20;
let initialLocation = [59.50169484910924, 17.672710418701175];
let busIconSize = {height: 185, width: 75};
let busIconScale = 0.5;

let stations = [
    {
        "name": "Kungsängens station",
        "lat": "59.477532",
        "lon": "17.750307"
    },
    {
        "name": "Bygdegårdsvägen",
        "lat": "59.47719",
        "lon": "17.738468"
    },
    {
        "name": "Sylta",
        "lat": "59.479168",
        "lon": "17.713307"
    },
    {
        "name": "Vickberga",
        "lat": "59.481029",
        "lon": "17.706475"
    },
    {
        "name": "Aspvik",
        "lat": "59.488112",
        "lon": "17.690942"
    },
    {
        "name": "Ängsuddsvägen",
        "lat": "59.495124",
        "lon": "17.680281"
    },
    {
        "name": "Lindhagaberg",
        "lat": "59.500859",
        "lon": "17.669143"
    },
    {
        "name": "Fjärilsstigen",
        "lat": "59.511916",
        "lon": "17.655884"
    },
    {
        "name": "Vallmostigen",
        "lat": "59.513893",
        "lon": "17.656181"
    },
    {
        "name": "Rosenlundsvägen",
        "lat": "59.51801",
        "lon": "17.657385"
    },
    {
        "name": "Finnsta",
        "lat": "59.518055",
        "lon": "17.652989"
    },
    {
        "name": "Rosenlundsvägen",
        "lat": "59.517992",
        "lon": "17.657367"
    },
    {
        "name": "Vallmostigen",
        "lat": "59.514316",
        "lon": "17.656244"
    },
    {
        "name": "Fjärilsstigen",
        "lat": "59.511017",
        "lon": "17.655201"
    },
    {
        "name": "Finnsta östra",
        "lat": "59.512212",
        "lon": "17.648845"
    },
    {
        "name": "Bro centrum",
        "lat": "59.51437",
        "lon": "17.642427"
    },
    {
        "name": "Bro station",
        "lat": "59.5117",
        "lon": "17.636045"
    },
    {
        "name": "Norrgårdsvägen",
        "lat": "59.515089",
        "lon": "17.639254"
    },
    {
        "name": "Härnevistigen",
        "lat": "59.51597",
        "lon": "17.633932"
    },
    {
        "name": "Korpstigen",
        "lat": "59.518424",
        "lon": "17.631128"
    },
    {
        "name": "Fasanstigen",
        "lat": "59.521255",
        "lon": "17.6328"
    },
    {
        "name": "Råby",
        "lat": "59.523799",
        "lon": "17.628844"
    },
    {
        "name": "Kvista",
        "lat": "59.513255",
        "lon": "17.615423"
    },
    {
        "name": "Rättarboda",
        "lat": "59.504652",
        "lon": "17.611091"
    },
    {
        "name": "Hammartorp",
        "lat": "59.507871",
        "lon": "17.599297"
    },
    {
        "name": "Säbyholm",
        "lat": "59.507115",
        "lon": "17.585157"
    },
    {
        "name": "Låssa kyrka",
        "lat": "59.507799",
        "lon": "17.569893"
    }
];


class Bus {
    // Invalidate after 10 sec

    constructor(data, nr) {
        this.id = data.inv;

        this.nr = nr || 0;
        this.latLng = L.latLng(data.lat, data.lon);
        this.s = data.s;
        this.t = data.t;
        this.end = data.end;

        this.visible = true;

        this.prev = data.prev ? data.prev.slice(-3) : [];
        let lastPrev = this.prev[this.prev.length - 1];
        this.heading = lastPrev && lastPrev.heading ? lastPrev.heading : 45;

        this.marker = L.marker(this.latLng, {
            icon: new L.DivIcon({
                html: `<img src="${this.s > 0 ? icons.red : icons.grey}" class="leaflet-marker-icon" style="transform: translate(-50%, -50%));" alt="">
                    <div id="${this.id}" class="busID" style="transform: translate(-50%, -50%);">${this.id}</div>`,
                className: '', //'smoothTransition',
                iconAnchor: [0, 0],
                iconSize: [0, 0]
            }),
            rotationAngle: this.heading,
            rotationOrigin: 'center center',

        }).bindTooltip('', {direction: 'center'}).addTo(map);

        setTimeout(() => {
            this.interval = setInterval(() => {
                this.updateTooltip();
            }, 1000);
        }, (Date.now() - this.t)%1000);

        //this.updateTooltip();

        this.container = $(`div.leaflet-marker-icon:has(div#${this.id}.busID)`);
        this.imageElement = this.container.find('img');
        this.textElement = this.container.find('div.busID');

        this.resize().rotate();
    }

    update(data, nr) {

        let prev = {
            latLng: this.latLng,
            s: this.s,
            t: this.t,
            nr: this.nr,
            heading: this.heading,
            end: this.end
        };

        data.latLng = L.latLng(data.lat, data.lon);

        if (data.t !== prev.t) {

            //this.log((data.t - prev.t) + 'ms difference')

            this.show();

            this.prev.push(prev);
            this.prev = this.prev.slice(-3);

            this.latLng = data.latLng;
            this.s = data.s;
            this.t = data.t;
            this.nr = nr || 0;
            this.end = data.end;


            this.marker.setLatLng(this.latLng);
            this.updateTooltip();
            let distance = prev.latLng.distanceTo(this.latLng);

            //this.log('Distance ' + distance + 'm');

                if ((prev.s !== 0 || this.s !== 0) && distance >= 1) {
                    this.heading = closestEquivalentAngle(this.heading, L.GeometryUtil.bearing(prev.latLng, this.latLng));

                    this.rotate(this.heading, this.prev.length > 1);
                }

            if ((prev.s <= 20 && this.s === 0) || (this.s > 0 && prev.s === 0)) {
                this.changeIcon(this.s > 0 ? icons.red : icons.grey);
            }
        } else if ((Date.now() - data.t)/1000 > 120 && prev.s > 0) {
            if (this.visible) {
                this.log(Date.now() + ' Data is older than 1m ' + data.t);
                this.hide();
            }

        }

        return this;
    }

    remove() {
        clearInterval(this.interval);
        map.removeLayer(this.marker);
        delete buses[this.id];
        return this;
    }

    hide () {
        this.container.hide();
        this.visible = false;

        this.log('Hidden');

        return this;
    }

    show () {
        if (!this.visible) {
            this.container.show();
            this.visible = true;
            this.log('Visible');
        }

        return this;
    }

    updateTooltip() {

        this.marker.setTooltipContent(this.nr + ' mot ' + this.end + '<br>' + Math.round((Date.now() - this.t)/1000) + 's ago<br>' + this.s + 'km/h');

        return this;
    }

    changeIcon(iconUrl) {

        this.imageElement.attr('src', iconUrl);

        return this;
    }

    resize(zoom = map.getZoom()) {

        let imageScale = (zoom/maxZoom) * busIconScale;

        //this.marker.setRotationOrigin(`0 ${.25*busIconSize.height * imageScale}px`)
        //'margin-top': .25*busIconSize.height * imageScale + 'px',
        this.imageElement.css({transform: `translate(-50%, -50%) scale(${imageScale})`});
        this.textElement.css({transform: `translate(-50%, -50%) scale(${(zoom/initialTextSize)*1.1}) rotate(${(((this.heading % 360 + 360) % 360) / 180 > 1 ? 90 : -90)}deg)`});

        return this;
    }


    rotate(heading = this.heading, animate = true) {

        let zoom = map.getZoom();

        //let imageScale = (zoom/maxZoom) * busIconScale;
        //this.marker.setRotationOrigin(`0 ${.25*busIconSize.height * imageScale}px`)

        this.marker.setRotationAngle(heading);
        this.textElement.css({transform: `translate(-50%, -50%) scale(${(zoom/initialTextSize)*1.1}) rotate(${(((this.heading % 360 + 360) % 360) / 180 > 1 ? 90 : -90)}deg)`});

        return this;
    }

    log(str = '') {

        console.log('BUS ' + '[' + this.id + ']', str);

        return this;
    }

    highlight(timeout) {
        let imageElement = this.imageElement;

        imageElement.css({'border-radius': '25px', border: '31px solid blue'});
        setTimeout(function () {
            console.log('Done highlight')
            imageElement.css({border: 'none'});
        }, timeout * 1000);

        return this;
    }
}



function closestEquivalentAngle(from, to) {
    let delta = ((((to - from) % 360) + 540) % 360) - 180;
    return from + delta;
}


function init_map(cb = () => {}) {

    map = L.map('map', {
        maxZoom: maxZoom,
        maxNativeZoom: maxZoom,
        //minZoom: 1,
        scrollWheelZoom: false,
        smoothWheelZoom: true,
        smoothSensitivity: 1,
    }).whenReady(cb).setView(initialLocation, initialZoom);

    map.scrollWheelZoom = true;


    let baseLayers = {
        "Map": L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
            maxZoom: maxZoom,
            //minZoom: 1,
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: 'YOUR-ACCESS-TOKEN'
        }),
        "Satellite": L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
            maxZoom: maxZoom,
            //minZoom: 1,
            id: 'mapbox/satellite-streets-v11',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: 'YOUR-ACCESS-TOKEN'
        }),
        'Google Satellite': L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
            maxZoom: maxZoom,
            maxNativeZoom: maxZoom,
            subdomains:['mt0','mt1','mt2','mt3']
        })
    };

    let overlays = {};

    L.control.layers(baseLayers, overlays).addTo(map);

    stations.forEach((station) => {
        //L.marker([station.lat, station.lon]).addTo(map);
    })

    baseLayers["Map"].addTo(map);

    map.addControl( (new L.Control.Search({sourceData: function (text, callResponse) {
        //here can use custom criteria or merge data from multiple layers

            let data = [];

            for (let id in buses) {
                if (buses.hasOwnProperty(id)) {
                    data.push({
                            loc: Object.values(buses[id].latLng),
                            title: id
                        }
                    )
                }
            }

        callResponse(data);

        return {	//called to stop previous requests on map move
            abort: function() {
                console.log('aborted request:'+ text);
            }
        };
    }, text:'BUSS NR...', zoom:16, marker: false, markerLocation:false})).on('search:locationfound'	, (data) => {
        for (let id in buses) {
            if (buses.hasOwnProperty(id)) {
                if (map.getBounds().contains(buses[id].latLng)) {
                    buses[id].resize();
                }

            }
        }

        console.log('BUS: ' + data.text)

        buses[data.text].highlight(10);

    }) );




    let zoomInterval = 0;

    map.on('zoomstart', function () {

        //$('.leaflet-marker-pane > .leaflet-marker-icon').removeClass('smoothTransition');

        zoomInterval = setInterval(() => {
            let currentZoom = map.getZoom();


            if (currentZoom % 1 !== 0) {
                //return map.setZoom(Math.round(currentZoom));
            }

            for (let id in buses) {
                if (buses.hasOwnProperty(id)) {
                    if (map.getBounds().contains(buses[id].latLng)) {
                        buses[id].resize();
                    }

                }
            }
        }, 1000/30);


    });

    map.on('zoomend', function () {
        clearInterval(zoomInterval);
        //$('.leaflet-marker-pane > .leaflet-marker-icon').addClass('smoothTransition');

    });
}

function connect() {

    clearInterval(countdownInterval);

    if (!firstRun) {

        $('.erroralert').html('Reconnecting...');

        countdownInterval = setInterval(function () {
            $('.erroralert').eq(0).append('.');
        }, 1000);
    }

    firstRun = false;

    const wsHost = window.location.hostname;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsPort = window.location.port ? `:${window.location.port}` : '';

    const wss = new WebSocket(`${wsProtocol}//${wsHost}${wsPort}`);

    wss.onopen = function () {

        if (/*errorCount > 1 || */isRestarting) {
            return location.reload();
        }

        isRestarting = false;

        errorCount = 0;

        clearInterval(countdownInterval);
        clearTimeout(showErrorTimeout);
        console.log('Socket sucessfully opened!');
        $('.erroralert').hide();
    };

    let firstmsg2 = true;

    wss.onmessage = (data) => {

        try {
            let json = JSON.parse(data.data);

            try {
                if (!firstmsg2) {//return;
            }
                firstmsg2 = false;

                let ids = [];

                for (let nr in json) {
                    ids = ids.concat(json[nr].pos.map((obj) => obj.inv));

                    json[nr].pos.forEach((data, i) => {
                        let id = data.inv;

                        buses[id] = buses[id] ? buses[id].update(data, nr) : new Bus(data, nr);

                    });

                    if (firstMessage) {
                        if (Object.keys(buses).length > 0) {
                            let markers = new L.featureGroup(Object.keys(buses).map((id) => buses[id].marker));

                           // map.fitBounds(markers.getBounds().pad(0.1), {animate: false});
                            for (let id in buses) {
                                if (buses.hasOwnProperty(id)) {
                                    buses[id].resize();
                                }
                            }

                            firstMessage = false;
                        }
                    }

                }

                for (let id in buses) {
                    if (buses.hasOwnProperty(id) && ids.indexOf(id) === -1) {
                        buses[id].remove();
                    } else if (map.getBounds().contains(buses[id].latLng)) {
                        buses[id].resize();
                    }
                }

            } catch (e) {
                console.log(e.toString())
            }





        } catch (err) {

            throw err;
        }

        //console.log(data.data);
    };

    wss.onclose = function (e = {}) {

        if (isRestarting) {
            reconnectTimeout = setTimeout(connect, 3500);
            return;
        }

        clearInterval(countdownInterval);
        clearTimeout(showErrorTimeout);

        let txt = 'Connection to server lost. Retrying in ' + (errorCount > 0 ? (errorCount) * 10 : 5) + ' seconds';
        console.log(txt, e.reason);


        let secsRemaining = errorCount * 10;
        if (errorCount > 0) {
            countdownInterval = setInterval(function () {
                if (secsRemaining < 1) {
                    return clearInterval(countdownInterval);
                }
                $('.erroralert').eq(0).show().html('Connection to server lost. Retrying in ' + --secsRemaining + ' seconds');
            }, 1000);

            $('.erroralert').eq(0).show().html(txt);
        } else {
            showErrorTimeout = setTimeout(function () {
                wss.close();
            }, 5000);
        }

        clearTimeout(reconnectTimeout);

        reconnectTimeout = setTimeout(connect, errorCount * 10000);

        errorCount++
    };

    wss.onerror = function (err) {
        console.error('Socket encountered an error: ', err, 'Closing socket');
        wss.close();
    };
}

init_map();
connect();
