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
function common_crawl_add_to_list(month, urls, CCStats, commonCrawlList) {

    // // TODO : fix this in another place
    // urls.splice(urls.length - 1, 1);
    //    console.log(urls)
//    var x = 0; 
//    console.log(x)
//    console.log(urls[urls.length-1]);
    urls.forEach(function(url) {
        var pattern = /crawl-data\/CC-MAIN-[0-9]{4}-[0-9]{2}\/segments\/([0-9.]+)\/wet\/CC-MAIN-([0-9.]+)-([0-9.]{5})-ip-([0-9-]+).([a-z0-9.-]+).internal.warc.wet.gz/gi;
	//console.log(urls.slice(-10))
	var result = pattern.exec(url);
	var time, date, chunks, ip;

	if(result){
            time = result[1];
            date = result[2];
            chunks = result[3];
            server = result[4];
            ip = result[5];
	} else {
	    pattern = /crawl-data\/CC-MAIN-[0-9]{4}-[0-9]{2}\/segments\/([0-9.]+)\/wet\/CC-MAIN-([0-9.]+)-([0-9.]+)-([0-9]{5}).warc.wet.gz/gi;
//	    result = pattern.exec(url);
//	    console.log(url);
//	    console.log(urls[urls.length - 512])
	    result = pattern.exec(url);
//	    console.log(result);
	    time = result[1];
	    date = result[2];
	    chunks = result[4];
	    server = result[3];
	    ip = '';
//	    if(time != x) { 
//		x = time;
//		console.log(url);
//	    }

	}

        // var data = {
        //     // url: urls[i],
        //     url: url,
        //     time: time,
        //     date: date,
        //     chunks: chunks,
        //     server: server,
        //     ip: ip,
        //     month_id: monthId
        // };

        commonCrawlList.add(month, time, date, chunks, server, ip, url);

    });

    CCStats.months[month] = {
        emailCount: urls.length,
        status: 'nonparsed',
        last: null,
    }

    return;
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
    var CCStats = {
        emails: 0,
        processed: 0,
        months: {}
    };

    len = months.length - 1;

    // checks if all links are already processed
    function isResolved() {
        // TODO : sort the list of months
        // console.log('Len "-1" counts: ' + len)
        if (!len--) {
            return callback(CCStats);
        }

        return;
    }

    function downloadAndProcessIt(month, cb) {

        // FIX : I need to implement this when I implement the DB (idea)
        if (CCStats.months[month]) {

            // If month exists and hasn't been parsed, don't download it
            if (CCStats.months[month].status === 'complete') {
                return isResolved();
            }
        }

        common_crawl_month_download_and_process(month, function(err, stream) {
            var data = [],
                urls = '';

            stream.on('data', function(chunk) {
                data.push(chunk);
            })

            stream.on('end', function() {
                urls += Buffer.concat(data).toString();
                urls = [].concat(urls.split('\n'));

                // Eliminate the first one... It's an empty string
                urls.reverse();
                urls = [].concat(urls.slice(1));

                // // Eliminate the last one... It's an empty string
                // urls.pop();

                // TODO : Fix this logic later. This should depend of the file
                if (CCStats.months[month]) {

                    if (CCStats.months[month].status === 'halfway') {
                        var ind = urls.indexOf(CCStats.months[month].last);
			console.log('found one at ' + ind);
                        urls = [].concat(urls.slice(0, ind + 1));
			// console.log(urls.length)
                        // urls = [].concat(urls.slice(ind + 1));
                    }

                } else {

                    CCStats.emails += urls.length;
                    list._list.count += urls.length;

                }

                // console.log('Got all urls for ' + month + '. ' + urls.length + ' in total... Saving them!!!');
                return cb(month, urls, CCStats);
                // isResolved();
            });
        });

        return;
    }


    function addMonthStatAndURLs(month, urls, CCStats) {
        // console.log('about to add to list ', month)
        common_crawl_add_to_list(month, urls, CCStats, list);
        return isResolved();

        // TODO : See how to implement this part later.
        // MonthStat.create({
        //         month: month,
        //         url_count: urls.length
        //     })
        //     .then(function(monthStat) {
        //         // console.log(monthStat.id);
        //         //list.add(urls, month);
        //         return common_crawl_add_to_list(urls, month, monthStat.id, isResolved);
        //     })
        //     .catch(function(err) {
        //         console.log("Something happened...")
        //         console.log(err)
        //         process.exit()
        //     });
    }

    // Check settings in file
    if (fs.existsSync('./config/commoncrawler_db.js')) {
        CCStats = require('../config/commoncrawler_db.js');
    } else {
        var data = '/* This file is auto-generated */\r\nmodule.exports = ' + JSON.stringify(CCStats) + ';'
        fs.writeFileSync('./config/commoncrawler_db.js', data, 'utf8');
    }

    months.forEach(function(month) {

        // TODO : Implement this part with the DB later
        // MonthStat.find({
        //         where: { month: month }
        //     })
        //     .then(function(result) {
        //         if (!result) {

        //             This works!
        //                 console.log('Entry for ' + month + ' was not found. Creating one!');
        //             downloadAndProcessIt(month, addMonthStatAndURLs);
        //         }
        //         // isResolved();
        //     })
        //     .catch(function(err) {
        //         isResolved();
        //     })

        // console.log('Entry for ' + month + ' was not found. Creating one!');
        downloadAndProcessIt(month, addMonthStatAndURLs);
    });

    return;
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
