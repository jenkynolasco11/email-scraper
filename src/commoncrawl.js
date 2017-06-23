/***************************************************
 * commoncrawl.js                                  *
 *                                                 *
 * This defines a class for Helper methods         *
 * concerning common crawl                         *
 *                                                 *
 ***************************************************/

/////////////////////////////////////////////////////
// System imports                                  //
/////////////////////////////////////////////////////
var fs = require('fs');
var path = require('path');
var readline = require('readline');

/////////////////////////////////////////////////////
// Project Classes                                 //
/////////////////////////////////////////////////////
var CommonCrawlList = require('./commoncrawllist.js');
var Helper = require('./helper.js');

/////////////////////////////////////////////////////
// Constants                                       //
/////////////////////////////////////////////////////
const COMMONCRAWL_GET_STARTED = 'http://commoncrawl.org/the-data/get-started/';
const COMMONCRAWL_DOMAIN = 'commoncrawl.s3.amazonaws.com';
const COMMONCRAWL_BASE_URL = 'http://commoncrawl.s3.amazonaws.com/crawl-data/';
const COMMONCRAWL_WET_PATHS = '/wet.paths.gz';

/////////////////////////////////////////////////////
// String get_started_url()                        //
/////////////////////////////////////////////////////
// Returns the Get Started url for common crawl    //
/////////////////////////////////////////////////////
function get_started_url() {

    //
    // Return a constant
    //
    return COMMONCRAWL_GET_STARTED;

}
/////////////////////////////////////////////////////
// String get_base_url()                           //
/////////////////////////////////////////////////////
// Returns the base url for common crawl           //
/////////////////////////////////////////////////////
function get_base_url() {

    //
    // Return a constant
    //
    return COMMONCRAWL_BASE_URL;

}

/////////////////////////////////////////////////////
// String get_full_url( file )                     //
/////////////////////////////////////////////////////
// This function will return the full URL for a    //
// common crawl file                               //
/////////////////////////////////////////////////////
function get_full_url(file) {

    //
    // We just concatenate strings. This is to ensure
    // efficient memory use as opposed to storing the
    // entire URLs as arrays
    //
    // return {domain: COMMONCRAWL_DOMAIN, path: '/crawl-data/' + file + '/wet.paths.gz'};
    return COMMONCRAWL_BASE_URL + file + COMMONCRAWL_WET_PATHS;

}

/////////////////////////////////////////////////////
// void get_full_file( file )                      //
/////////////////////////////////////////////////////
// This function will return the full path for a   //
// monthly crawl file                              //
/////////////////////////////////////////////////////
function get_full_file(month) {

    //
    // Get the fullpath and append ".txt"
    //
    return path.resolve(__dirname, '../tmp/' + month + '-wet.paths.gz.txt');

}

/////////////////////////////////////////////////////
// void common_crawl_is_month_downloaded( void )   //
/////////////////////////////////////////////////////
// This function will determine whether a monthly  //
// crawl exists on the system                      //
/////////////////////////////////////////////////////
function common_crawl_is_month_downloaded(month) {

    //
    // Local variables
    //
    var file;

    //
    // Determine the file name
    //
    file = path.resolve(__dirname, '../tmp/' + month + '-wet.paths.gz.txt');

    //
    // Return the exist status of the file
    //
    return fs.existsSync(file);

}

/////////////////////////////////////////////////////
// void common_crawl_month_download( month, cb )   //
/////////////////////////////////////////////////////
// This function will download the paths for a     //
// monthly crawl and execute a callback after      //
// completion                                      //
/////////////////////////////////////////////////////
function common_crawl_month_download_and_process(month, cb) {

    //
    // Local variables
    //
    var url;

    //
    // Set the variables
    //
    url = get_full_url(month);

    //
    // Begin downloading file
    //
    Helper.downloadStream(url, null, cb);

}

/////////////////////////////////////////////////////
// void common_crawl_process_month( month,         //
// commonCrawlList, callback )                     //
/////////////////////////////////////////////////////
// This function will parse the downloaded crawl   //
// file                                            //
/////////////////////////////////////////////////////
function common_crawl_add_to_list(urls, month, monthId, callback) {

    // TODO : fix this in another place
    urls.splice(urls.length - 1, 1);

    //
    // Match with the regular expression
    //
    var qty = urls.length;
    var bulkData = [];

    function execCallback() {
        console.log('checking qty: Now it\'s ' + qty + ' links already inserted');
        if (!qty--) {
            console.log('Ready to head out!');
            callback();
        }
    }

    // Avoid the last item! It's an empty string, cuz of split!
    // for (var i = 0; i < urls.length - 2; i++) {
    // bulkData = [].concat(urls.map(function(url, i) {
    // console.log(CCUrl);
    urls.forEach(function(url, i) {

        var pattern = /crawl-data\/CC-MAIN-[0-9]{4}-[0-9]{2}\/segments\/([0-9.]+)\/wet\/CC-MAIN-([0-9.]+)-([0-9.]{5})-ip-([0-9-]+).([a-z0-9.-]+).internal.warc.wet.gz/gi;
        // var result = pattern.exec(urls[i]);
        var result = pattern.exec(url);

        if (!result) {
            console.log(result);
            // console.log(JSON.stringify(urls[i]));
            console.log(JSON.stringify(url));
            console.log(qty);
            console.log(i);
            process.exit();
        }

	if (!(qty-i-1)){
	    console.log('it processed everything');
	}

        var time = result[1];
        var date = result[2];
        var chunks = result[3];
        var server = result[4];
        var ip = result[5];

        var data = {
            // url: urls[i],
            url: url,
            time: time,
            date: date,
            chunks: chunks,
            server: server,
            ip: ip,
            month_id: monthId
        };

        // bulkData = [].concat(bulkData, data)

        CCUrl.create(data)
            .then(function(url) {
                console.log('Are you here?')
                return CCUrlStat.create({
                    url_id: url.id,
                    parsed: false
                });
            })
            .then(function(stat) {
                console.log('Everything ready for ' + url)
                return execCallback();
            })
            .catch(function(err) {

                // Something happened ?????
                // return callback();

                return execCallback();
            });
        // }



        // return data;
        // commonCrawlList.add(month, time, date, chunks, server, ip);
        // commonCrawlList.add(data);

        // }));

        // console.log(bulkData);

        // CCUrl.createBulk(bulkData)
        //     .then(function(bulk) {
        //         return CCUrlStat.create({
        //             url_id: url.id,
        //             parsed: false
        //         });

        //     })
        //     .then(function(stat) {
        //         return callback();
        //         // return execCallback();
        //     })
        //     .catch(function(err) {

        //         // Something happened ?????
        //         return callback();
        //     });

        //
        // We're finished. Execute callback
        //
        // callback();
    });
}



/////////////////////////////////////////////////////
// This function will download ALL the monthly     //
// crawl urls in the months array and execute a    //
// callback on finish                              //
/////////////////////////////////////////////////////
function common_crawl_pop_and_download(months, list, callback) {

    //
    // Local variables
    //
    var month, tmp, len; // , list = [];

    len = months.length;

    function isResolved() {
        console.log('Len "-1" counts: ' + len)
        if (!len--) {
            console.log('it got here => cb of common_crawl_pop_and_download')
            process.exit();
            callback();
        }
    }

    function downloadAndProcessIt(month, cb) {
        common_crawl_month_download_and_process(month, function(err, stream) {
            var data = [],
                urls = '';

            stream.on('data', function(chunk) {
                data.push(chunk);
            })

            stream.on('end', function() {
                urls += Buffer.concat(data).toString();
                urls = [].concat(urls.split('\n'))
                console.log('Got all urls for ' + month + '. ' + urls.length + ' in total... Saving them!!!');
                cb(urls, month)
                    // isResolved();
            });
        });
    }

    function addMonthStatAndURLs(urls, month) {
        MonthStat.create({
                month: month,
                url_count: urls.length
            })
            .then(function(monthStat) {
                // console.log(monthStat.id);
                //list.add(urls, month);
                return common_crawl_add_to_list(urls, month, monthStat.id, isResolved);
            })
            .catch(function(err) {
                console.log("Something happened...")
                console.log(err)
                process.exit()
            });
    }
    // console.log(months);
    // process.exit();
    months.forEach(function(month) {
        MonthStat.find({
                where: { month: month }
            })
            .then(function(result) {
                if (!result) {

                    // This works! 
                    // console.log('Entry for ' + month + ' was not found. Creating one!');
                    downloadAndProcessIt(month, addMonthStatAndURLs);
                }
                // isResolved();
            })
            .catch(function(err) {
                isResolved();
            })
    })

    //
    // Check if it was already downloaded
    //
    // if (common_crawl_is_month_downloaded(month)) {

    //     //
    //     // Was downloaded. Proceed to next
    //     //
    //     common_crawl_process_month(month, list, function() {

    //         //
    //         // Call this function again. The first month
    //         // was already removed for processing
    //         //
    //         common_crawl_pop_and_download(months, list, callback);

    //     });

    //     //
    //     // Exit this function to prevent download on
    //     // current month
    //     //
    //     return;

    // }

    // //
    // // Download the wet.paths.gz file
    // //  
    // common_crawl_month_download(month, function(err, filename) {

    //     //
    //     // Scope-local variables
    //     //
    //     var gunzip, input, output;


    //     //
    //     // Uncompress the file
    //     //
    //     Helper.uncompress(filename, filename + ".txt", true, function() {

    //         //
    //         // Looks like we have the file. Let's process it
    //         //
    //         common_crawl_process_month(month, list, function() {

    //             //
    //             // Call this function again. The first month
    //             // was already removed for processing
    //             //
    //             common_crawl_pop_and_download(months, list, callback);

    //         });

    //     });

    // });


}


/////////////////////////////////////////////////////
// Array common_crawl_parse_get_started( body )    //
/////////////////////////////////////////////////////
// This function will process an HTTP body and     //
// return a list of commoncrawl database URLs      //
/////////////////////////////////////////////////////
function common_crawl_parse_get_started(body) {

    //
    // Local variables
    //
    var dates;
    var pattern = /CC-MAIN-([0-9]{4})-([0-9]{2})/gi;

    //
    // Match the pattern
    //
    dates = body.match(pattern);

    //
    // The first three entries do not follow the 
    // modern protocol
    //
    dates.splice(0, 3);

    //
    // Set global variable to list
    //
    _db_list = dates;

    return dates;

}


/////////////////////////////////////////////////////
// Export our class to other parts of the app      //
/////////////////////////////////////////////////////
module.exports = {

    //
    // Export just these four
    //
    monthListFromHTML: common_crawl_parse_get_started,
    downloadMonths: common_crawl_pop_and_download,
    getBaseURL: get_base_url,
    getStartedURL: get_started_url

};
