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
function process_wet(filename) {
    // TODO : Check for this function
    // if(!fs.existsSync(filename)) return send_ready();

    // Process.send('file', filename, function(retval){});
    //
    // Use the WetParser to process the pages in
    // crawl database
    //

    var regex = /CC-MAIN-2014[0-9]*-[0-9]{5}/;
    var file = regex.exec(filename)[0];
    var start = Date.now();

    console.log("\x1b[32m [ CHILD " + self.workerId + " ] Will now process file: " + file, '\x1b[0m');

    ////////////////////////////////////
    // WetParser.parseStream(unzippedStream, function(emails, time_compare, bytes) {
    //     process_emails(emails, time_compare, bytes);
    // });
    ////////////////////////////////////

    // WetParser.parse(filename, process_page);
    WetParser.parse(filename, function(emails, time_compare, bytes) {

        //
        // TODO: Remove the process termination if error...
        //
        fs.access(filename, function(err) {
            if (err) {
                console.log('error while checking access to the file\n\n', err, '\n\n')
                process.exit(0)
            }
            fs.unlink(filename, function(err) {
                if (err) {
                    console.log('error while unlinking the file\n\n', err, '\n\n')
                    process.exit(0)
                } else {
                    var elapsed = Date.now() - start;
                    var time = new Date(elapsed);
                    var secs = ('0' + time.getSeconds()).slice(-2);
                    var mins = ('0' + time.getMinutes()).slice(-2);
                    console.log("\x1b[32m [ CHILD " + self.workerId + " ]\x1b[33m parsing time: " + mins + ":" + secs, '\x1b[0m');
                    console.log('\x1b[34m [ File ]\x1b[33m  ' + file + ' deleted\n\x1b[0m');
                    process_emails(emails, time_compare, bytes);
                }
            })
        });

        // process_emails(emails, time_compare, bytes);
    });
}

function uncompressFile(filename) {
    start = Date.now();
    Helper.uncompress(filename, filename + '.txt', true, function(filename) {
        var elapsed = Date.now() - start;
        var time = new Date(elapsed);
        var secs = ('0' + time.getSeconds()).slice(-2);
        var mins = ('0' + time.getMinutes()).slice(-2);

        console.log("\x1b[33m [ CHILD " + self.workerId + " ]\x1b[0m Uncompressing time: " + mins + ":" + secs, '\x1b[0m');

        return process_wet(filename);
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
    //    console.log(filename)

    var regex = /CC-MAIN-2014[0-9]*-[0-9]{5}/;
    var file = regex.exec(filename)[0];

    // Check if zip file is available

    if (fs.existsSync(filename) && !self.resetted) {
        console.log("\x1b[33m [ CHILD " + self.workerId + " ] File " + file + " to be unzipped\x1b[0m");
        setTimeout(uncompressFile, 0, filename);

        return true;
    }

    //
    // Check if the file was already downloaded
    //
    if (fs.existsSync(filename + ".txt") && !self.resetted) {

        // Notify
        console.log("\x1b[33m [ CHILD " + self.workerId + " ] File " + file + " is cached\x1b[0m");

        // File exists
        setTimeout(process_wet, 0, filename + ".txt");

        // No more business in this function
        return true;

    }

    self.resetted = false;
    //
    // At this point, the file does not exist. Download
    // then parse
    //

    var start = Date.now();

    // TODO: ECONNRESET
    Helper.download(url, filename, function(err, destination) {
        // console.log(filename)

        //
        // Check for error
        //
        if (err) {
            console.log('\x1b[31mGot Error: ' + err, '\x1b[0m');
            return;
        }

        var elapsed = Date.now() - start;
        var time = new Date(elapsed);
        var secs = ('0' + time.getSeconds()).slice(-2);
        var mins = ('0' + time.getMinutes()).slice(-2);

        console.log("\x1b[33m [ CHILD " + self.workerId + " ]\x1b[0m Downloading time: " + mins + ":" + secs, '\x1b[0m');

        return setTimeout(uncompressFile, 0, filename);

    }, send_progress);

    return true;

}

Process.on('url', process_url);

/////////////////////////////////////////////////////
// Send a ready event to the master                //
/////////////////////////////////////////////////////

if (self.lastfile) console.log('\x1b[33m [ NOTICE ] There is a file to handle........ ' + self.lastfile, '\x1b[0m');
self.lastfile !== null ? process_url(self.lastfile) : send_ready();
self.lastfile = null;

/////////////////////////////////////////////////////
// PREVENT PROCESS FROM EXITING                    //
/////////////////////////////////////////////////////
Cpu.loop();