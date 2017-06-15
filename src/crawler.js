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
function Crawler(id, lastfile) {

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



    this.onWorkerDied = null;

    this._addHandlers = null;

    this._lastfile = lastfile || null;
}

/////////////////////////////////////////////////////
// Crawler::start()                                //
/////////////////////////////////////////////////////
// Starts a worker process and sets up Inter       //
// Process Communication(IPC)                      //
/////////////////////////////////////////////////////
function Crawler__start() {
    console.log('\n[ Starting - ' + this._id + ']\n')
        //
        // Local variables
        //
    var tmp;
    var args = [this._id];

    if (this._lastfile) args.push(this._lastfile);

    // 
    // Spawn master
    //
    tmp = fork(__dirname + '/ipc_worker.js', args);

    //
    // Create the IPC class for the new process and
    // use 'this' object as context for callbacks
    // 
    ipc = new Ipc(tmp, this);

    //
    // Save to our object
    //
    this._ipc = ipc;


    this.addHandlers(ipc);
}

Crawler.prototype.start = Crawler__start;


// Emergent Function
function Crawler__addHandlers(ipc) {
    var self = this;

    //
    // Set up a callback
    //
    ipc.on('ready', function(data) {

        //
        // Check if we have a callback set up
        //
        if (self._onReady) {

            //
            // Call the onReady handler and
            // pass worker object
            //
            // The handler is typically 
            // crawlercontroller.js @ CrawlerController__onReady
            //
            self._onReady(self, data);

        }

        //
        // This is for the child process
        //
        return true;

    });

    ipc.on('file', function(file) {
        self._lastfile = file;
        return true;
    });

    //
    // Set up a callback
    //
    ipc.on('progress', function(data) {

        //
        // Check if we have a callback set up
        //
        if (self._onProgress) {

            //
            // On Progress
            // 
            self._onProgress(self, data);

        }

        //
        // This is for the child process
        //
        return true;

    });

    ipc.on('error', function(err) {
        console.log('\n======================================Error:\n\n');
        console.log(ipc)
    })

    function restartIt(msg) {
        console.log('\x1b[31m\n[ Restarting #' + this._id + ' ]\x1b[33m Trying to ' + msg + '...\n\x1b[0m');
        console.log('\x1b[33mLast URL handled\x1b[35m : ' + this._lastfile, '\x1b[0m');
        return this.onWorkerDied(this._id, this._lastfile);
    }

    ipc.on('exit', restartIt.bind(this, 'exit'))

    ipc.on('close', restartIt.bind(this, 'close'))
}

Crawler.prototype.addHandlers = Crawler__addHandlers;

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
    var self = this;
    //
    // Send the URL
    //
    this._ipc.send('url', url, function(retval) {
        self._lastfile = url;
    });

}

Crawler.prototype.send = Crawler__send;

/////////////////////////////////////////////////////
// Export our class to other parts of the app      //
/////////////////////////////////////////////////////
module.exports = Crawler;