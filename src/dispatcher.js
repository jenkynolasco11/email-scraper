/***************************************************
 * dispatcher.js                                   *
 *                                                 *
 * This defines a class for the Crawler Master     *
 * located on the current machine                  *
 *                                                 *
 ***************************************************/

/////////////////////////////////////////////////////
// System imports                                  //
/////////////////////////////////////////////////////
var fs = require('fs');
var sq = require('sequelize');
var _ = require('lodash');

var Promise = sq.Promise;

/////////////////////////////////////////////////////
// Project Classes                                 //
/////////////////////////////////////////////////////
var CommonCrawlList = require('./commoncrawllist.js');
var CommonCrawl = require('./commoncrawl.js');
var Helper = require('./helper.js');
var REST = require('./rest.js');
var Cpu = require('./cpu.js');

/////////////////////////////////////////////////////
// Settings                                        //
/////////////////////////////////////////////////////
var LastEntry = require('../config/dispatchersettings.js');

/////////////////////////////////////////////////////
// class Dispatcher                                //
/////////////////////////////////////////////////////
// This class is designed to be a singleton class. //
// It defines an interface for the Crawler Master  //
// "local"                                         //
/////////////////////////////////////////////////////
function Dispatcher() {

    //
    // private field: "list"
    //
    this._list = new CommonCrawlList();

    //
    // private field "stats"
    //
    this._stats = {

        network: { download: { downloaded: 0, total: 0 }, total_bandwidth: 0 },
        crawls: { avg_per_crawl: 0, total_time: 0, total_bytes_processed: 0 },
        urls: { processed: 0, processed_run: 0, total: 0 },
        emails: { processed: 0, processed_run: 0, total: 0 },
        cpu: { name: '', cores: 0, ram: 0 },

        workers: {}

    };

    //
    // private field: "nextUrl"
    //
    this._nextUrl = { entry: null, chunk: 0 };

    //
    // private field: "_server"
    //
    this._server = null;

    //
    // Update fields
    //
    this._stats.cpu.name = Cpu.getName();
    this._stats.cpu.cores = Cpu.getCores();
    this._stats.cpu.ram = (Cpu.getRAM() / (1024 * 1024 * 1024)).toFixed(2);

    //
    // Modify fields if we're resuming from a previous crawl
    //
    var tmp;

    tmp = LastEntry.emails;
    this._stats.emails.processed = tmp;
    this._stats.emails.processed_run = tmp;
    this._stats.emails.total = tmp;

    tmp = LastEntry.crawls;
    this._stats.urls.processed = tmp;
    this._stats.urls.processed_run = tmp;

    tmp = LastEntry.time_per_crawl;
    this._stats.crawls.avg_per_crawl = tmp;

    tmp = LastEntry.total_crawl_time;
    this._stats.crawls.total_time = tmp;

    tmp = LastEntry.total_bytes_processed;
    this._stats.crawls.total_bytes_processed = tmp;

    tmp = LastEntry.total_bandwidth;
    this._stats.network.total_bandwidth = tmp;


    this.emails = [];
    this.semaphore = false;
    //this.saveEmails = null;
}

/////////////////////////////////////////////////////
// void Dispatcher::init( workers, callback )      //
/////////////////////////////////////////////////////
// Download the URLs                               //
/////////////////////////////////////////////////////
function Dispatcher__init(workers, callback) {

    //
    // Local variables
    //
    var tmp, self = this;

    //
    // Set a timer for heartbeat
    //
    var REFRESH_DELAY = 5 * 1000;

    //
    // Heartbeat info for this machine
    //
    tmp = {
        id: Cpu.getMachineId(),
        pid: Cpu.getProcessId(),
        workers: workers,
        stats: {
            cpu: self._stats.cpu,
            network: self._stats.network
        }
    };
    self.heartbeatInfo(tmp);
    setInterval(self.heartbeatInfo.bind(self), REFRESH_DELAY, tmp);

    //
    // Create an http server
    //
    this._ripc_server = new REST.Server('../htdocs', 9383);

    //
    // Modify REST server
    //
    this._ripc_server.on('ready', function(worker, data) {

        //
        // Feed data into ready() and then we'll get
        // a new URL
        //
        self.ready(data, function(url) {

            //
            // Send the URL
            //
            worker.send({ success: true, url: url });

        });

    }).on('heartbeat', function(worker, data) {


        self.heartbeatInfo(data);

        worker.send({ success: true });

    }).on('status', function(worker, data) {

        var TIMEOUT_DELAY = 60 * 1000;

        var process_update = function(workers) {
            for (machine_id in workers) {
                for (process_id in workers[machine_id]) {
                    thread = workers[machine_id][process_id];

                    var current_time = (new Date()).getTime();
                    thread.is_active = !!((thread.last_active + TIMEOUT_DELAY) > current_time);

                }
            }
        };

        process_update(self._stats.workers);

        worker.send({
            success: true,
            stats: self._stats
        });

    }).on('search', function(worker, data) {

        worker.send({
            success: true,
            results: [

                { first_name: 'Test', last_name: 'Email', full_name: 'Test Email', email: 'temail@gmail.com', url: 'http://www.google.com' }

            ]
        });

    });

    //
    // Fetch URLs(may take a couple of minutes)
    //
    this.getURLs(function(err) {

        //
        // Callback
        //
        self._stats.urls.total = self._list.size();
        callback(err, self._list.size());

    });

    const findOrCreate = function(email){
	Email.findOrCreate({
		where : { email : email.email },
		defaults : email
	})
	.then(function(){
		sum += 1;
	})
	.catch(function(e){
		// surely the problem wasn't because of the email
		self.emails = [].concat(self.emails, email);
		sum -= 1;
	});
    }

    // Implementing a semaphore for email handling...
    setInterval(function(){
    //this.saveEmails = function(){
	if(self.emails.length){
		if(!self.semaphore){
			var sum = 0;
			//console.log('Emails in queue: ', self.emails.length);
			self.semaphore = true;

			function canContinue(){
                                if(!sum) {
                                        self.semaphore = false;
                                        //  console.log('=> Emails in queue: ', self.emails.length);
					Email.destroy().then().catch();
                                }
                        }
	
			// let's insert 1000 emails per iteration
			var emailsToProcess = self.emails.splice(0,1000);
			var promises = [];
			emailsToProcess.forEach(function(email){
				sum += 1;
			        // var  promise =  Email.findOrCreate({
				var promise = Email.create({
			                where : { email : email.email },
			                defaults : email
			        });
				
				promise.then(function(){
					sum -= 1;
					canContinue()
					promise = null;
					//  sq.close();
				      	return sum;
			        })
			        .catch(function(e){
			                // surely the problem wasn't because of the email
					//
					// If this happens, it's because it was already inserted
					//
			                // self.emails = [].concat(self.emails, email);
					sum -= 1;
					promise = null;
					canContinue();

			        }).done();
			});
			console.log('=> Emails in queue: ', self.emails.length);
/*
			Promise.each(emailsToProcess, function(email){
				var promise = null;
			        const whereClause = {
			            where : { email : email.email },
			            defaults : email
			        };
				
				promise = Email.findOrCreate(whereClause);
				promises.push(promise);
				return promise;			
//			        return Email.findOrCreate(whereClause);    // Implementing a semaphore for email handling...
    			})	
			.then(function(){
				// let's continue
				promises.forEach(function(p){
					p = null;
				})

				return self.semaphore = false;
			})
			.catch(function(e){
				// Process hangs after 30k~ connections made... Doesn't cut connections after
				//self.emails = [].concat(self.emails, emailsToProcess);
				self.semaphore = false;
				console.log('Something is going on...');
			});
			console.log('Emails in queue: ', self.emails.length);	
*/
//			this.semaphore = false;
		}
	}
    }, 100);
    //}

}

Dispatcher.prototype.init = Dispatcher__init;
/////////////////////////////////////////////////////
// void Dispatcher::heartbeatInfo( info )          //
/////////////////////////////////////////////////////
// This processes heartbeat info for a worker      //
/////////////////////////////////////////////////////
function Dispatcher__heartbeatInfo(info) {

    //
    // Local variables
    //
    var id,
        pid,
        stats,
        workers;

    //
    // Init
    //
    id = info.id;
    pid = info.pid;
    workers = info.workers;
    stats = info.stats;

    if (!this._stats.workers[id]) {

        this._stats.workers[id] = {};

    }

    this._stats.workers[id][pid] = { workers: workers, stats: stats, last_active: (new Date()).getTime() };

}

Dispatcher.prototype.heartbeatInfo = Dispatcher__heartbeatInfo;
/////////////////////////////////////////////////////
// void Dispatcher::getURLs( callback )            //
/////////////////////////////////////////////////////
// This function will download a series of         //
// directory URLs so that the Workers can go       //
// through each document and parse for emails      //
/////////////////////////////////////////////////////
function Dispatcher__getURLs(callback) {

    //
    // Local variables
    //
    var self;

    //
    // Download month crawls
    //
    self = this;
    Helper.download(CommonCrawl.getStartedURL(), null, function(err, body) {

        //
        // Scope-local variables
        //
        var month_list;

        //
        // Check if there are any errors
        //
        if (err) {

            //
            // Callback. Nothing else to do
            //
            callback(err);
            return;

        }

        //
        // Process the body into a list
        //
        month_list = CommonCrawl.monthListFromHTML(body);

        //
        // Download months
        //
        CommonCrawl.downloadMonths(month_list, self._list, function() {

            //
            // Local scope variables
            //
            var tmp;

            //
            // We're done. Reset the nextUrl
            //
            if (self._nextUrl.entry == null) {

                //
                // Start of the list(default)
                //
                self._nextUrl.chunk = 0;
                self._nextUrl.entry = self._list.getFirstEntry();

                //
                // Did we leave off somewhere?
                //
                if (LastEntry.time != null) {

                    //
                    // We sure did!
                    //
                    tmp = self._list.getEntryByTime(LastEntry.time);

                    if (tmp) {

                        self._nextUrl.chunk = LastEntry.chunk;
                        self._nextUrl.entry = tmp;

                    }

                }

            }

            //
            // Execute the callback
            //
            callback(null);

        });

    });

}

Dispatcher.prototype.getURLs = Dispatcher__getURLs;
/////////////////////////////////////////////////////
// String Dispatcher::progress(data, callback)     //
/////////////////////////////////////////////////////
// Signals the dispatcher that ready for next url  //
/////////////////////////////////////////////////////
function Dispatcher__progress(data, callback) {
    this._stats.network.download = data;
    if (data.downloaded == data.total) {
        this._stats.network.total_bandwidth += parseInt(data.total);
        // console.log(data);
    }
}

Dispatcher.prototype.progress = Dispatcher__progress;

////////////////////////////////////////////////////
//const promises = [];
/*function processBatch(){
	Promise.each(Object.keys(emails), function(email){
	        const whereClause = {
        	    where : { email : email },
	            defaults : emails[email]
        	};
	});    .then(function(e) {
        console.log('\nCount of emails processed: ', len, '\n\n');
    }).catch(function(e) {
            // TODO: delete the process termination
        console.log('ERROR!!!!!!\n\n Count of emails: ', len,'\n\n', e, '\n')
        //console.log(emails[email])
//        process.exit(0)
    });

}
*/
/////////////////////////////////////////////////////
// String Dispatcher::saveEmails(emails)           //
/////////////////////////////////////////////////////
// Saves the list of emails                        //
/////////////////////////////////////////////////////
function Dispatcher__saveEmails(emails) {
    // TODO: Bulk email inserting is messing with postgres deadlock. Fix that later...

//    console.log(this.crat);
    const len = Object.keys(emails).length;

    this.emails = [].concat(this.emails, _.map(emails));
//    if(this.saveEmails) {
//	console.log('now to save emails');
//	this.saveEmails();
//    }
    console.log('Emails processed: ', len);
    console.log('Emails in queue: ', this.emails.length);
	
//    console.log(this.crat);

//    processBatch();

//    const promises = [];
/*    for (email in emails) {	
        promises.push(Email.findOrCreate(whereClause)
    }*/

    // Sequelize.Promise
/*    Promise.each(Object.keys(emails), function(email){
        const whereClause = {
            where : { email : email },
            defaults : emails[email]
        };

	return promises.push(Email.findOrCreate(whereClause))
    })*/
//    Promise.all(promises)
/*    .then(function(e) {
	console.log('\nCount of emails processed: ', len, '\n\n');
    }).catch(function(e) {
            // TODO: delete the process termination
        console.log('ERROR!!!!!!\n\n Count of emails: ', len,'\n\n', e, '\n')
        //console.log(emails[email])
//        process.exit(0)
    });*/
//    }
}

Dispatcher.prototype.saveEmails = Dispatcher__saveEmails;
/////////////////////////////////////////////////////
// String Dispatcher::ready(data, callback)        //
/////////////////////////////////////////////////////
// Signals the dispatcher that ready for next url  //
/////////////////////////////////////////////////////
function Dispatcher__ready(data, callback) {

    //
    // Local variables
    //
    var emails, time_taken, ref, fp, tmp, entry, url = "";

    //
    // Get emails from the data
    //
    time_taken = (data) ? data.time_taken : 0;
    emails = (data) ? data.emails : null;

    //
    // Get the reference
    //
    ref = this._nextUrl;

    //
    // Entry
    //
    entry = ref.entry;

    //
    // Format a URL
    //
    // url  = COMMONCRAWL_BASE_URL + entry.month + "/segments/" + entry.time;
    url = CommonCrawl.getBaseURL() + entry.month + "/segments/" + entry.time;
    url += "/wet/CC-MAIN-" + entry.date + "-" + ("00000" + ref.chunk).slice(-5) + "-ip-" + entry.server + "." + entry.ip + ".internal.warc.wet.gz";

    //
    // Handle emails
    //
    if (emails) {

        //
        // Save and process emails
        //
        tmp = Object.keys(emails).length;
        this._stats.emails.processed += tmp;
        this._stats.emails.total += tmp;

        this.saveEmails(emails);

    }

    //
    // Save current entry at "dispatchersettings.js"
    //
    tmp = this._stats.crawls.avg_per_crawl;
    this._stats.crawls.avg_per_crawl = (tmp) ? Math.ceil((tmp + time_taken) / 2) : time_taken;
    this._stats.crawls.total_time += time_taken;

    this._stats.crawls.total_bytes_processed += (data) ? data.bytes_processed : 0;

    tmp = {

        time: entry.time,
        chunk: ref.chunk,
        emails: this._stats.emails.processed,
        crawls: this._stats.urls.processed,
        time_per_crawl: this._stats.crawls.avg_per_crawl,
        total_crawl_time: this._stats.crawls.total_time,
        total_bytes_processed: this._stats.crawls.total_bytes_processed,
        total_bandwidth: this._stats.network.total_bandwidth

    };

    fp = fs.createWriteStream('./config/dispatchersettings.js');
    fp.write('/* This file is auto-generated */\r\n');
    fp.write('module.exports = ' + JSON.stringify(tmp) + ';');
    fp.end();

    //
    // Increment everything
    //
    if (ref.chunk++ > entry.chunks) {

        ref.entry = entry.next;
        ref.chunk = 0;

    }

    //
    // Increment URLs processed (NEW)
    //
    this._stats.urls.processed++;

    //
    // Execute callback with the next URL
    //
    callback(url);

}

Dispatcher.prototype.ready = Dispatcher__ready;
/////////////////////////////////////////////////////
// Export our class to other parts of the app      //
/////////////////////////////////////////////////////
module.exports = Dispatcher;
