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
function get_started_url()
{
  
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
function get_base_url()
{
  
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
function get_full_url(file)
{
  
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
function get_full_file(month)
{
  
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
function common_crawl_is_month_downloaded(month)
{
  
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
function common_crawl_month_download(month, cb)
{
  
  //
  // Local variables
  //
  var url, filename;
  
  //
  // Set the variables
  //
  url = get_full_url(month);
  filename = path.resolve(__dirname, '../tmp/' + month + '-wet.paths.gz');
  
  //
  // Begin downloading file
  //
  Helper.download(url, filename, cb, function() {});
  
}

/////////////////////////////////////////////////////
// void common_crawl_process_month( month,         //
// commonCrawlList, callback )                     //
/////////////////////////////////////////////////////
// This function will parse the downloaded crawl   //
// file                                            //
/////////////////////////////////////////////////////
function common_crawl_process_month(month, commonCrawlList, callback)
{
  
  //
  // Local variables
  //
  var filename, file_pipe, line_reader, last_time;

  //
  // Get full filename
  //
  filename = get_full_file(month);
  
  //
  // Open a file stream
  //
  file_pipe = fs.createReadStream(filename);
  
  //
  // Use "readline" to read lines
  //
  line_reader = readline.createInterface({input: file_pipe});
  
  //
  // Read lines
  //
  last_time = "0";
  line_reader.on('line', function(line) {
    
    //
    // Scope-local variables
    //
    var result, current_time, pattern;
    
    //
    // Create the pattern
    //
    pattern = /crawl-data\/CC-MAIN-[0-9]{4}-[0-9]{2}\/segments\/([0-9.]+)\/wet\/CC-MAIN-([0-9.]+)-([0-9.]{5})-ip-([0-9-]+).([a-z0-9.-]+).internal.warc.wet.gz/gi;
    
    //
    // Match with the regular expression
    //
    result = pattern.exec(line);
    
    try {
      
      current_time = result[1];
      
    } catch(e) {
      
      console.log(line);
      process.exit();
      
    }
    
    commonCrawlList.add(month, result[1], result[2], result[3], result[4], result[5]);
    
  }).on('close', function() {
    
    //
    // We're finished. Execute callback
    //
    callback();
    
  });
  
}

/////////////////////////////////////////////////////
// void common_crawl_pop_and_download( months,     //
// list, callback )                                //
/////////////////////////////////////////////////////
// This function will download ALL the monthly     //
// crawl urls in the months array and execute a    //
// callback on finish                              //
/////////////////////////////////////////////////////
function common_crawl_pop_and_download(months, list, callback)
{
  //
  // Local variables
  //
  var month, tmp;
  
  //
  // Check length
  //
  if (months.length < 1)
  {
    
    //
    // Nothing else to do. Execute callback
    //
    callback();
    
    //
    // Exit the function
    //
    return;
    
  }
  
  //
  // Pop the first month
  //
  month = months.splice(0, 1)[0];
  
  //
  // Check if it was already downloaded
  //
  if (common_crawl_is_month_downloaded(month))
  {    
    
    //
    // Was downloaded. Proceed to next
    //
    common_crawl_process_month(month, list, function() {
      
      //
      // Call this function again. The first month
      // was already removed for processing
      //
      common_crawl_pop_and_download(months, list, callback);
      
    });
    
    //
    // Exit this function to prevent download on
    // current month
    //
    return;
    
  }
  
  //
  // Download the wet.paths.gz file
  //  
  common_crawl_month_download(month, function(err, filename) {
    
    //
    // Scope-local variables
    //
    var gunzip, input, output;
    
    
    //
    // Uncompress the file
    //
    Helper.uncompress(filename, filename + ".txt", true, function(){
            
      //
      // Looks like we have the file. Let's process it
      //
      common_crawl_process_month(month, list, function() {
        
        //
        // Call this function again. The first month
        // was already removed for processing
        //
        common_crawl_pop_and_download(months, list, callback);
        
      });
      
    });
    
  });
  
  
}

/////////////////////////////////////////////////////
// Array common_crawl_parse_get_started( body )    //
/////////////////////////////////////////////////////
// This function will process an HTTP body and     //
// return a list of commoncrawl database URLs      //
/////////////////////////////////////////////////////
function common_crawl_parse_get_started(body)
{
  
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
  dates.splice(0,3);
  
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