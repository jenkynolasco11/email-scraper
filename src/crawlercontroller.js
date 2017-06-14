/***************************************************
 * crawlercontroller.js                            *
 *                                                 *
 * This defines a class for controlling a set of   *
 * crawlers                                        *
 *                                                 *
 ***************************************************/

/////////////////////////////////////////////////////
// Project Classes                                 //
/////////////////////////////////////////////////////
var RemoteDispatcher = require('./remotedispatcher.js');
var Dispatcher = require('./dispatcher.js');
var Crawler = require('./crawler.js');

/////////////////////////////////////////////////////
// class CrawlerController                         //
/////////////////////////////////////////////////////
// This class is designed to be a singleton class. //
// It will handle remote and local requests to a   //
// worker process                                  //
/////////////////////////////////////////////////////
function CrawlerController() {

    //
    // private field: "master"
    //
    this._master = null;

    //
    // private field: "workers"
    //
    this._workers = [];

}

/////////////////////////////////////////////////////
// void CrawlerController::getWorker( id )         //
/////////////////////////////////////////////////////
// Fetches a worker by id. Returns NULL on         //
// existent worker                                 //
/////////////////////////////////////////////////////
function CrawlerController__getWorker(id) {

    //
    // Return the entry
    //
    return this._workers[id] || null;

}

CrawlerController.prototype.getWorker = CrawlerController__getWorker;
/////////////////////////////////////////////////////
// void CrawlerController::startWorkers()          //
/////////////////////////////////////////////////////
// Signals the workers to begin work               //
/////////////////////////////////////////////////////
function CrawlerController__startWorkers() {

    //
    // Local variables
    //
    var i, len, self = this;

    //
    // Loop through the amount of workers and start 
    // them
    // 
    len = this._workers.length;
    for (i = 0; i < len; i++) {

        //
        // Start the worker
        //
	setTimeout(function(i){
	        this.getWorker(i).start();
	}, 200 * i, i);

    }

}

CrawlerController.prototype.startWorkers = CrawlerController__startWorkers;


///////////////////////////////////
function CrawlerController__workerExit(id, lastfile){
	console.log('\n\x1b[33m[ Restarting ]\x1b[0m Worker #' + id + '\n');
	if(lastfile) console.log('\x1b[33m [ File ]\x1b[0m File to handle: ' + lastfile);

	this._workers[id] = null;
	var worker = new Crawler(id, lastfile);
	
	onReadyBind = CrawlerController__onReady.bind(this);
        onProgressBind = CrawlerController__onProgress.bind(this);

        worker.onReady(onReadyBind);
        worker.onProgress(onProgressBind);
        worker.onWorkerDied = this.workerExit.bind(this);

	this._workers[id] = worker;
	return this.getWorker(id).start();
}

CrawlerController.prototype.workerExit = CrawlerController__workerExit;
///////////////////////////////////

/////////////////////////////////////////////////////
// boolean CrawlerController::createWorkers(       //
// workers )                                       //
/////////////////////////////////////////////////////
// This function will create a specified number    //
// of local workers                                //
/////////////////////////////////////////////////////
function CrawlerController__createWorkers(workers) {

    //
    // Local variables
    //
    var i, worker, onReadyBind, onProgressBind;

    //
    // Create a bind to preserve the CrawlerMaster class
    //
    onReadyBind = CrawlerController__onReady.bind(this);
    onProgressBind = CrawlerController__onProgress.bind(this);
    // onWorkerDiedBind = CrawlerController__workerExit.bind(this);
    // 
    // Create the specified amount of workers
    // 
    for (i = 0; i < workers; i++) {

        //
        // Create worker and add into a list
        //
        worker = new Crawler(i);
        this._workers[i] = worker;

        //
        // Set callback for "ready" event
        //
        worker.onReady(onReadyBind);
        worker.onProgress(onProgressBind);
	worker.onWorkerDied = this.workerExit.bind(this);
    }

}

CrawlerController.prototype.createWorkers = CrawlerController__createWorkers;
/////////////////////////////////////////////////////
// void CrawlerController::crawl()                 //
/////////////////////////////////////////////////////
// Signals the workers to begin work               //
/////////////////////////////////////////////////////
function CrawlerController__crawl() {

    //
    // Local variables
    //
    var i, len;

    //
    // Loop through the amount of workers and start 
    // them
    // 
    len = this._workers.length;
    for (i = 0; i < len; i++) {

        //
        // Start the worker
        //
        setTimeout(function(self, index) {
	   // console.log(self)
           self.getWorker(index).start();
        }, 100 * i, this, i);

    }

}

CrawlerController.prototype.crawl = CrawlerController__crawl;
/////////////////////////////////////////////////////
// boolean CrawlerController::init( workers,       //
// dispatcherIp, callback )                        //
/////////////////////////////////////////////////////
// This function will initialize the master        //
// worker. When remoteMaster is null, the calling  //
// server will act as a node for remote workers    //
/////////////////////////////////////////////////////
function CrawlerController__init(workers, dispatcherIp, callback) {

    //
    // Local variables
    //
    var self = this;

    //
    // Set up the workers
    //
    this.createWorkers(workers);

    //
    // Create a reference to our dispatcher
    //
    this._dispatcher = (dispatcherIp) ? new RemoteDispatcher(dispatcherIp) : new Dispatcher();

    //
    // Intialize the dispatcher
    //
    this._dispatcher.init(workers, callback);

}

CrawlerController.prototype.init = CrawlerController__init;

/////////////////////////////////////////////////////
// void CrawlerController::onReady( worker,        //
// emails )                                        //
/////////////////////////////////////////////////////
// This is called when a worker is ready to accept //
// new tasks. May contain emails                   //
/////////////////////////////////////////////////////
function CrawlerController__onReady(worker, data) {

    //
    // Signal the dispatcher that we are ready and 
    // send over emails
    //
    // ready is at (remote)dispatcher.js @ Dispatcher__ready
    //
    this._dispatcher.ready(data, function(url) {

        //
        // Send worker the next URL
        //
        worker.send(url);

    });

}

/////////////////////////////////////////////////////
// void CrawlerController::onProgress( worker,     //
// emails )                                        //
/////////////////////////////////////////////////////
// This is called when a worker is updating its    //
// download progress                               //
/////////////////////////////////////////////////////
function CrawlerController__onProgress(worker, data) {

    //
    // Signal the dispatcher about our progress
    //
    this._dispatcher.progress(data);

}

CrawlerController.prototype.onProgress = CrawlerController__onProgress;
/////////////////////////////////////////////////////
// Export our class to other parts of the app      //
/////////////////////////////////////////////////////
module.exports = new CrawlerController();
