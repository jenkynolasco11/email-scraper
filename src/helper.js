/***************************************************
 * helper.js                                       *
 *                                                 *
 * Provide helper functions for miscellaneous      *
 * tasks                                           *
 *                                                 *
 ***************************************************/

/////////////////////////////////////////////////////
// "System" Imports                                //
/////////////////////////////////////////////////////
var fs = require('fs');
var zlib = require('zlib');
var http = require('http');

/////////////////////////////////////////////////////
// void _download( url, destination, callback )    //
/////////////////////////////////////////////////////
// Will download a file and output it to           //
// 'destination'. A callback will be executed      //
// passing the file when download is completed     //
/////////////////////////////////////////////////////
function _uncompress(infile, outfile, deletein, cb) {
    //    console.log('a', infile);

    //    console.log('b', outfile);
    //
    // Local variables
    //
    var gunzip, input, output;

    // TODO: Remove this bug with the library
    //
    // Potential bug here in the long run:
    // events.js:163
    //   throw er; // Unhandled 'error' event
    //   ^
    // Error: incorrect header check
    //      at Zlib._handle.onerror (zlib.js:355:17)
    //
    gunzip = zlib.createGunzip();
    input = fs.createReadStream(infile);
    output = fs.createWriteStream(outfile);
    input.pipe(gunzip).pipe(output);

    output.on('finish', function() {

        //
        // Delete the original file if requested
        //
        if (deletein == true) {

            //
            // Delete the file
            //
            fs.unlinkSync(infile);

        }

        //
        // Callback
        //
        cb(outfile);

    });

    output.on('error', function() {
        console.log("\x1b[31m [ File ]\x1b[0m Error while uncompressing file: " + infile + "\n Repeating process...");
        return _uncompress(infile, outfile, deletein, cb);
    });

    gunzip.on('error', function() {
        console.log('this one works...............!!!!!!!!!!!');
    });

}

/////////////////////////////////////////////////////
// void _download( url, destination, cb )          //
/////////////////////////////////////////////////////
// Will download a file and output it to           //
// 'destination'. A callback will be executed      //
// passing the file when download is completed     //
//                                                 //
// ref: ipc_worker.js  @ line 154                  //
// ref: dispatcher.js  @ line 243                  //
// ref: commoncrawl.js @ line 144                  //
//                                                 //
/////////////////////////////////////////////////////

function _download(url, destination, cb, update) {

    //
    // Initiate
    //
    var filesize = { downloaded: 0, total: 0 };

    var req = http.get(url, function(res) {

        //
        // Scope-local variables
        //
        var body = '';

        //
        // Get the total filesize
        //
        if (res.headers['content-length']) {
            filesize.total = res.headers['content-length'];
        }

        //
        //  Set HTTP encoding
        //
        if (destination == null) {

            //
            // We'll assume the client will handle a
            // string
            //
            res.setEncoding('utf8');

            //
            // "data" event; when data is received
            //
            res.on('data', function(chunk) {

                //
                // Add into our body
                //
                body += chunk;

            });

        } else {

            //
            // Create a write stream into destination
            //
            body = fs.createWriteStream(destination);

            //
            // We'll pipe the request into a file
            //
            res.pipe(body);

            //
            // On Data(to calculate downloaded bytes)
            //
            res.on('data', function(chunk) {
                filesize.downloaded += chunk.length;
                update(filesize);
            });

        }


        //
        // "end" event; when all data is received
        //
        res.on('end', function() {

            //
            // Check if request was aborted
            //
            if (req._aborted) {
                filesize.error = true;
                update(filesize);
                return;
            }

            //
            // Process the body into a list
            //
            if (destination == null) {

                // 
                // Return a text body to the callback
                // 
                cb(null, body);

            } else {

                //
                // Return callback with destination as
                // parameter
                //
                cb(null, destination);

            }

        });


    }).on('error', function(err) {
        console.log('Something happened while downloading.......', err);
        // console.log("Got error: " + e.message);
        cb(err, null);

    }).on('socket', function(s) {

        // console.log("Got error: " + e.message);
        // cb(err, null);
        s.setTimeout(10000);
        s.on('timeout', function() {

            req._aborted = true;
            req.abort();

        });

    });

}

// Streamable download
function _downloadStream(url, update, cb) {

    var filesize = { downloaded: 0, total: 0 };

    function getDownloadableStream(cb) {
        return http.get(url, cb)
    }

    var req = getDownloadableStream(function(res) {
        var buffer = [];
        var unzipped = '';
        var zip = zlib.createGunzip({ flush: zlib.Z_SYNC_FLUSH, chunkSize: 24 * 1024 });

        if (res.headers['content-length']) {
            filesize.total = res.headers['content-length'];
        }

        res.on('data', function(chunk) {

            //     // console.log('res data => filesize: ' + filesize.downloaded);
            //     // buffer = [].concat(buffer, chunk);

            if (update) filesize.downloaded += chunk.length;

            //     // zlib.inflate(chunk, function(err, data){
            //     //     if(err) throw err;
            //     //     buffer = [].concat(buffer, data);
            //     // });

            // zip.write(chunk);

            if (update) update(filesize);
        });

        res.on('end', function() {
            //     console.log('res end---')
            //         // buffer = Buffer.concat(buffer);
            //         // cb(buffer);
            //console.log('end');
            //res.close();
        });

        // process.exit();
        // debugger;
        cb(null, res.pipe(zip));
    });

    req.on('error', function(err) {
        cb(err, null);
    });

    req.on('socket', function(s) {
        s.setTimeout(10000);
        s.on('timeout', function() {

            req._aborted = true;
            req.abort();

        });
    });
}

function _uncompressStream(stream, filename, cb) {
    var unzip = zlib.createGunzip();
    var unzipped = stream.pipe(unzip);
    cb(filename, unzipped);
}
/////////////////////////////////////////////////////
// Export functions                                //
/////////////////////////////////////////////////////
//                                                 //
// Expose the functions to other parts of the      //
// application                                     //
//                                                 //
/////////////////////////////////////////////////////
module.exports = {
    download: _download,
    uncompress: _uncompress,
    downloadStream: _downloadStream,
    uncompressStream: _uncompressStream,
};