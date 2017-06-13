/***************************************************
 * crawler.js                                      *
 *                                                 *
 * This defines a class for a Crawler              *
 *                                                 *
 ***************************************************/

/////////////////////////////////////////////////////
// System imports                                  //
/////////////////////////////////////////////////////
var fork = require('child_process').fork;

/////////////////////////////////////////////////////
// Project Classes                                 //
/////////////////////////////////////////////////////
var Ipc = require('./ipc.js');

/////////////////////////////////////////////////////
// class Crawler                                   //
/////////////////////////////////////////////////////
// This class represents a LOCAL worker            //
/////////////////////////////////////////////////////

/////////////////////////////////////////////////////
// Crawler::Crawler(id)                            // 
/////////////////////////////////////////////////////
// Creates a new local worker with a specified id  //
/////////////////////////////////////////////////////
function Crawler(id) {

    //
    // private field: "id"
    //
    this._id = id;

    //
    // private field: "ipc"
    //
    this._ipc = null;

    //
    // private field: "busy"
    //
    this._true = false;

    //
    // private field: "onReady"
    //
    this._onReady = null;

    //
    // private field: "onProgress"
    //
    this._onProgress = null;

}

/////////////////////////////////////////////////////
// Crawler::start()                                //
/////////////////////////////////////////////////////
// Starts a worker process and sets up Inter       //
// Process Communication(IPC)                      //
/////////////////////////////////////////////////////
function Crawler__start() {

    //
    // Local variables
    //
    var tmp;

    // 
    // Spawn master
    //
    tmp = fork(__dirname + '/ipc_worker.js');

    //
    // Create the IPC class for the new process and
    // use 'this' object as context for callbacks
    // 
    ipc = new Ipc(tmp, this);

    //
    // Save to our object
    //
    this._ipc = ipc;

    //
    // Set up a callback
    //
    ipc.on('ready', function(data) {

        //
        // Check if we have a callback set up
        //
        if (this._onReady) {

            //
            // Call the onReady handler and
            // pass worker object
            //
            // The handler is typically 
            // crawlercontroller.js @ CrawlerController__onReady
            //
            this._onReady(this, data);

        }

        //
        // This is for the child process
        //
        return true;

    });

    //
    // Set up a callback
    //
    ipc.on('progress', function(data) {

        //
        // Check if we have a callback set up
        //
        if (this._onProgress) {

            //
            // On Progress
            // 
            this._onProgress(this, data);

        }

        //
        // This is for the child process
        //
        return true;

    });

    ipc.on('error', function(err) {
        console.log('======================================Error:\n\n');
        console.log(ipc)
    })

    ipc.on('exit', function(err) {
        console.log('======================================Exit:\n\n');
        console.log(ipc)
    })

    ipc.on('close', function(err) {
        console.log('======================================Close:\n\n');
        console.log(ipc)
    })

}

Crawler.prototype.start = Crawler__start;

/////////////////////////////////////////////////////
// Crawler::getId()                                //
/////////////////////////////////////////////////////
// Returns the id of the work                      //
/////////////////////////////////////////////////////
function Crawler__getId() {

    //
    // Return our id
    //
    return this._id;

}

Crawler.prototype.getId = Crawler__getId;

/////////////////////////////////////////////////////
// Crawler::onReady( callback )                    //
/////////////////////////////////////////////////////
// Specifies a callback for the "ready" event      //
/////////////////////////////////////////////////////
function Crawler__onReady(callback) {

    //
    // Set the field
    //
    this._onReady = callback;

}

Crawler.prototype.onReady = Crawler__onReady;

/////////////////////////////////////////////////////
// Crawler::onProgress( callback )                 //
/////////////////////////////////////////////////////
// Specifies a callback for the "progress" event   //
/////////////////////////////////////////////////////
function Crawler__onProgress(callback) {

    //
    // Set the field
    //
    this._onProgress = callback;

}

Crawler.prototype.onProgress = Crawler__onProgress;
/////////////////////////////////////////////////////
// Crawler::send( url )                            //
/////////////////////////////////////////////////////
// Sends a URL to the worker process               //
/////////////////////////////////////////////////////
function Crawler__send(url) {

    //
    // Send the URL
    //
    this._ipc.send('url', url, function(retval) {});

}

Crawler.prototype.send = Crawler__send;
/////////////////////////////////////////////////////
// Export our class to other parts of the app      //
/////////////////////////////////////////////////////
module.exports = Crawler;