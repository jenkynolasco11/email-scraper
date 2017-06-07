/***************************************************
 * rest.js                                         *
 *                                                 *
 * This defines an interface to facilitate IPC     *
 * between remote machines and http web server     *
 *                                                 *
 ***************************************************/

/////////////////////////////////////////////////////
// Project Classes                                 //
/////////////////////////////////////////////////////
var fs = require('fs');
var path = require('path');
var http = require('http');

/////////////////////////////////////////////////////
// void process_body(res, res, callback)           //
/////////////////////////////////////////////////////
// Helper to process body                          //
/////////////////////////////////////////////////////
function process_body(req, callback) {

    req.body = '';

    req.on('data', function(chunk) {

        //
        // We have data to receive
        //
        req.body += chunk;

    }).on('end', function() {

        //
        // Our request is complete
        //

        //
        // Before executing our callback, check what
        // type of data we received
        //
        if (req.headers['content-type'] == 'application/json') {

            //
            // We have JSON data. Normalize it.
            //
            req.body = JSON.parse(req.body);

        }

        //
        // Execute callback
        //
        callback();

    });
}

/////////////////////////////////////////////////////
// class RESTClient(ip, port)                      //
/////////////////////////////////////////////////////
// Creates and executes a REST client with event   //
/////////////////////////////////////////////////////
function RESTClient(ip, port) {

    //
    // Private field "ip"
    //
    this._ip = ip;

    //
    // Private field "port"
    //
    this._port = port;

}

/////////////////////////////////////////////////////
// void RESTClient::send(event, data, callback)    //
/////////////////////////////////////////////////////
// Executes a REST command and invokes callback    //
// when done                                       //
/////////////////////////////////////////////////////
function RESTClient__send(event, data, callback) {

    //
    // Local variables
    //
    var headers, body, request;

    //
    // Convert data into string
    //
    body = JSON.stringify(data);

    //
    // Initialize headers
    // 
    post_options = {

        host: this._ip,
        port: this._port,
        path: '/' + event,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': body.length
        }

    };


    request = http.request(post_options, function(res) {

        process_body(res, function() {
            callback(null, res.body);
        });

    });

    request.on('error', function(err) {
        callback(err, null);
    });

    // console.log(post_options);
    // console.log(body);
    request.write(body);
    request.end();

}

RESTClient.prototype.send = RESTClient__send;
/////////////////////////////////////////////////////
// class RESTServer                                //
/////////////////////////////////////////////////////
// Defines methods for a RESTful server            //
/////////////////////////////////////////////////////
function RESTServer(htdocs, port) {

    //
    // private field: "server"
    //
    this._server = null;

    //
    // private field: "htdocs"
    //
    this._htdocs = path.resolve(__dirname, htdocs);

    //
    // Server "signals"
    //
    this._signals = {};

    //
    // Start
    //
    this.start(port);

}
/////////////////////////////////////////////////////
// void RESTServer::start(port)                    //
/////////////////////////////////////////////////////
// This method will instantiate a HttpServer       //
// instance                                        //
/////////////////////////////////////////////////////
function RESTServer__start(port) {

    //
    // Local variables
    //
    var server, fn;

    //
    // Use a bind on our callback so we can preserve "this"
    //
    fn = RESTServer__onRequest.bind(this);

    //
    // Set up server
    //
    server = http.createServer(function(req, res) {

        process_body(req, function() {

            fn(req, res);

        });

    }).listen(port);

}

RESTServer.prototype.start = RESTServer__start;

/////////////////////////////////////////////////////
// void RESTServer::onRequest(request, response)   //
/////////////////////////////////////////////////////
// Executes every time there is a request          //
/////////////////////////////////////////////////////
function RESTServer__onRequest(req, res) {

    //
    // Local variables
    //
    var fp, method, uri, file, body = "",
        worker = {},
        self = this;

    //
    // Determine the method(i.e. GET or POST)
    //
    method = req.method;

    //
    // Determine the URI
    //
    uri = (req.url == '/') ? '/index.html' : req.url;

    //
    // We'll treat a GET as a regular request
    //
    if (method == "GET") {

        //
        // Open file for reading
        //
        file = path.resolve(this._htdocs, './' + uri);
        fp = fs.createReadStream(file);


        fp.on('error', function(error) {

            //
            // File does not exist(or cannot be opened)
            //
            res.writeHead(404);
            res.write("File could not be found...");
            res.end();

        });

        fp.on('readable', function() {

            //
            // Output the file
            //
            fp.pipe(res);

        });

        //
        // We will end the GET request here
        //
        return;

    }

    //
    // We'll assume a POST request at this point
    //
    body = req.body;

    //
    // Encapsulate for a common interface
    //
    worker.send = function(json) {

        //
        // Write a JSON response
        //
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify(json));
        res.end();

    };

    //
    // Determine the callback for the "signal"
    //
    fn = self._signals[uri.substr(1)];

    //
    // Check if handler exists
    //
    if (fn) {

        //
        // Call the handler
        //
        fn(worker, body);

    } else {

        //
        // No handler. Send out error
        //
        worker.send({ success: false, msg: 'Signal handler was not found' });

    }

}

RESTServer.prototype.onRequest = RESTServer__onRequest;
/////////////////////////////////////////////////////
// void RESTServer::on(event, callback)            //
/////////////////////////////////////////////////////
// This method will associate an event with a      //
// function handler                                //
/////////////////////////////////////////////////////
function RESTServer__on(event, callback) {

    //
    // Just set the entry
    //
    this._signals[event] = callback;

    //
    // Return the object for method chaining
    //
    return this;

}

RESTServer.prototype.on = RESTServer__on;
/////////////////////////////////////////////////////
// Export                                          //
/////////////////////////////////////////////////////
module.exports = {

    Server: RESTServer,
    Client: RESTClient

};