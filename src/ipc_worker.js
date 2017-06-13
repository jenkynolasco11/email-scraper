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

    //
    // Send out emails to parent
    //
    // console.log(Object.keys(emails));
    // send_ready(emails);
    // console.log(" Finished parsing in " + (time_taken / 1000) + "s");
    // send_ready(Object.keys(emails), time_taken, bytes_processed);
    send_ready(emails, time_taken, bytes_processed);

}

/////////////////////////////////////////////////////
// void process_wet( filename )                    //
/////////////////////////////////////////////////////
// This function will process a file containing    //
// an uncompressed crawl                           //
/////////////////////////////////////////////////////
function process_wet(filename, unzippedStream) {

    //
    // Use the WetParser to process the pages in
    // crawl database
    //
    console.log(" [CHILD] Will now process file: " + filename);

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
                    console.log('File deleted\n')
                        //process.exit(0)
                }
            })
        });

        process_emails(emails, time_compare, bytes);
    });
}

/////////////////////////////////////////////////////
// boolean process_url( url )                      //
/////////////////////////////////////////////////////
// This function will process a url for emails     //
/////////////////////////////////////////////////////
function process_url(url) {

    //
    // Local variables
    //
    var name, filename;

    //
    // We'll return true to verify that IPC is 
    // working
    // 
    name = path.basename(url);
    console.log(" [CHILD] I have received url: " + url);

    //
    // Download the provided URL
    //
    filename = path.resolve(__dirname, '../tmp/' + name);

    ////////////////////////////////////
    // Helper.downloadStream(url, send_progress, function(err, stream) {
    //     if (err) {
    //         console.log('Got Error: ' + err);
    //         return false;
    //     }

    //     Helper.uncompressStream(stream, filename, process_wet);
    // });

    // send_ready();

    // return true;
    ////////////////////////////////////

    //
    // Check if the file was already downloaded
    //
    if (fs.existsSync(filename + ".txt")) {

        // Notify
        console.log(" [CHILD] File is cached");

        // File exists
        setTimeout(process_wet, 0, filename + ".txt");

        // No more business in this function
        return true;

    }

    //
    // At this point, the file does not exist. Download
    // then parse
    //

    // TODO: ECONNRESET
    Helper.download(url, filename, function(err, destination) {

        //
        // Check for error
        //
        if (err) {
            console.log('Got Error: ' + err);
            return;
        }

        //
        // Uncompress gzipped file
        //
        Helper.uncompress(filename, filename + ".txt", true, process_wet);

    }, send_progress);

    // send_ready();

    return true;

}

Process.on('url', process_url);

/////////////////////////////////////////////////////
// Send a ready event to the master                //
/////////////////////////////////////////////////////
send_ready();

/////////////////////////////////////////////////////
// PREVENT PROCESS FROM EXITING                    //
/////////////////////////////////////////////////////
Cpu.loop();