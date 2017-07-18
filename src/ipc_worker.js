/***************************************************
 * ipc_worker.js                                   *
 *                                                 *
 * This is the worker process                      *
 *                                                 *
 ***************************************************/

/////////////////////////////////////////////////////
// System imports                                  //
/////////////////////////////////////////////////////
var fs = require('fs');
var path = require('path');
var process = require('process');

/////////////////////////////////////////////////////
// Project imports                                 //
/////////////////////////////////////////////////////
var WetParser = require('./wetparser.js');
var Cpu = require('./cpu.js');
var Ipc = require('./ipc.js');
var Helper = require('./helper.js');

/////////////////////////////////////////////////////
// IPC class for this process                      //
/////////////////////////////////////////////////////
var Process = new Ipc(null, null);

var self = {
    workerId: process.argv[2],
    lastfile: process.argv[3] || null,
    resetted: (process.argv[3]) ? true : false,
}

/////////////////////////////////////////////////////
// void send_ready([emails])                       //
/////////////////////////////////////////////////////
// Let the parent process know that this child is  //
// ready to begin accepting the next URL. Can      //
// send emails                                     //
/////////////////////////////////////////////////////
function send_ready(emails, time_taken, bytes_processed) {

    //
    // Receiver is crawler.js @ Crawler__start()
    //
    Process.send('ready', (emails) ? { emails: emails, time_taken: time_taken, bytes_processed: bytes_processed } : null, function(retval) {
        //  console.log(" [CHILD] Master Process has acknowledged");

    });

}

/////////////////////////////////////////////////////
// void send_ready([emails])                       //
/////////////////////////////////////////////////////
// Let the parent process know that this child is  //
// ready to begin accepting the next URL. Can      //
// send emails                                     //
/////////////////////////////////////////////////////
function send_progress(filesize) {

    //
    // Receiver is crawler.js @ Crawler__start()
    //
    Process.send('progress', filesize, function(retval) {

        //  console.log(" [CHILD] Master Process has acknowledged");

    });

}

/////////////////////////////////////////////////////
// void process_page( buffer, length )             //
/////////////////////////////////////////////////////
// This function will process a single page        //
/////////////////////////////////////////////////////
function process_page(buf, len) {

    //
    // 
    //


}

/////////////////////////////////////////////////////
// void process_emails( emails )                   //
/////////////////////////////////////////////////////
// This function will process a list of emails     //
/////////////////////////////////////////////////////
function process_emails(emails, time_taken, bytes_processed) {

    send_ready(emails, time_taken, bytes_processed);

}

/////////////////////////////////////////////////////
// void process_wet( filename )                    //
/////////////////////////////////////////////////////
// This function will process a file containing    //
// an uncompressed crawl                           //
/////////////////////////////////////////////////////
function process_wet(stream, file) {
    var start = Date.now();
    console.log("\x1b[33m [ CHILD " + self.workerId + " ]\x1b[0m Start parsing file " + file, ' \x1b[0m');
    //////////////////////////////////
    WetParser.parseStream(stream, file, self.workerId, function(emails, time_compare, bytes) {
        var elapsed = Date.now() - start;
        var time = new Date(elapsed);
        var secs = ('0' + time.getSeconds()).slice(-2);
        var mins = ('0' + time.getMinutes()).slice(-2);
        console.log("\x1b[35m [ CHILD " + self.workerId + " ]\x1b[0m Stream parsed. Time taken: " + mins + ":" + secs, '\x1b[0m');
        process_emails(emails, time_compare, bytes);
    });
}

/////////////////////////////////////////////////////
// boolean process_url( url )                      //
/////////////////////////////////////////////////////
// This function will process a url for emails     //
/////////////////////////////////////////////////////
function process_url(url) {
    Process.send('file', url, function(retval) {});

    //
    // Local variables
    //
    var name, filename;

    //
    // We'll return true to verify that IPC is 
    // working
    // 
    name = path.basename(url);
    console.log("\x1b[34m [ CHILD " + self.workerId + " ] I have received url: " + url, '\x1b[0m');

    //
    // Download the provided URL
    //
    filename = path.resolve(__dirname, '../tmp/' + name);
    filename = filename.replace(/.txt$/, '');

    // var regex = /CC-MAIN-20[0-9]*-[0-9]{5}/;
    var regex = /CC-MAIN-20[0-9]*-[0-9\-]+/;
    // console.log(filename);
    var file = regex.exec(filename)[0];

    console.log("\x1b[32m [ CHILD " + self.workerId + " ]\x1b[0m Streaming file " + file + "\x1b[0m");

    Helper.downloadStream(url, send_progress, function(err, stream) {
        if (err) {
            console.log('\x1b[31mGot Error: ' + err, '\x1b[0m');
            // Set to download next stream. This file has problems.
            return;
        }
        return process_wet(stream, file);
    });

    return true;
}

Process.on('url', process_url);

/////////////////////////////////////////////////////
// Send a ready event to the master                //
/////////////////////////////////////////////////////

if (self.lastfile) console.log('\x1b[33m [ CHILD - ' + self.workerId + ' ] \x1b[33mNOTICE:\x1b[0m There is a url to handle........ ' + self.lastfile);
self.lastfile !== null ? process_url(self.lastfile) : send_ready();
self.lastfile = null;

/////////////////////////////////////////////////////
// PREVENT PROCESS FROM EXITING                    //
/////////////////////////////////////////////////////
Cpu.loop();