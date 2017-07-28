global.isCrawlerRunning = true;
/***************************************************
 * main.js                                         *
 *                                                 *
 * Provides the entry-point for the application    *
 *                                                 *
 * The entry point is "function main(argc, argv)"  *
 *                                                 *
 ***************************************************/

/////////////////////////////////////////////////////
// "System" Imports                                //
/////////////////////////////////////////////////////
var fs = require('fs');
var os = require('os');

/////////////////////////////////////////////////////
// Settings                                        //
/////////////////////////////////////////////////////
var Settings = require('../config/settings.js');

/////////////////////////////////////////////////////
// Project Classes                                 //
/////////////////////////////////////////////////////
var Orm = require('./orm.js');
var Cpu = require('./cpu.js');
var populate_db = require('../models/populate_db.js');
var CrawlerController = require('./crawlercontroller.js');

/////////////////////////////////////////////////////
// void print_welcome( void )                      //
/////////////////////////////////////////////////////
// Displays a welcome screen on the console. The   //
// Welcome screen includes application name and    //
// version                                         //
/////////////////////////////////////////////////////
function print_welcome() {
    //
    // Print out a welcome screen
    //
    console.log("");
    console.log(" Welcome to", Settings.Application.APPLICATION_NAME, "version", Settings.Application.APPLICATION_VERSION);
    console.log("");
    console.log(" System settings");
    console.log(" ---------------");
    console.log(" => Processor       :", Cpu.getName());
    console.log(" => Number of Cores :", Cpu.getCores(), "(Including HyperThreaded cores)");
    console.log("");

    //
    // Delete our analytics file(debugging)
    //
    try {
        fs.unlinkSync('analytics.txt');
    } catch (e) {
        // Ignore the error
    }

}

/////////////////////////////////////////////////////
// String format_error( err )                      //
/////////////////////////////////////////////////////
// Degeneralizes an error for specific output      //
/////////////////////////////////////////////////////
function format_error(err) {
    var errstr = err.errno;

    if (errstr == 'ECONNREFUSED') {
        return 'Could not connect to endpoint ' + err.address;
    } else if (errstr == 'ENOENT') {
        return 'Could not locate ' + err.hostname;
    } else {
        return err.toString();
    }

}

/////////////////////////////////////////////////////
// void start_master( void )                       //
/////////////////////////////////////////////////////
// This is responsible for spawning the Master.    //
// The Master will fetch the latest crawl database //
// and distribute the sub-links to the workers.    //
//                                                 //
// This will return whether or not the start       //
// master was successful                           //
/////////////////////////////////////////////////////
var _master_ip = null;

function start_master(cb) {
    //
    // Local variables
    //
    var cpus, time_start, time_diff;

    //
    // Calculate the number of workers we'll need
    //
    cpus = (Settings.Worker.WORKER_MAX < 1) ? Cpu.getCores() : Settings.Worker.WORKER_MAX;

    //
    // Initialize the crawler controller environment
    //
    time_start = (Date.now());
    CrawlerController.init(cpus, _master_ip, cb, function(err, count) {

        //
        // If there was an error
        //
        if (err) {

            //
            // There was an error
            //
            console.log(" => Dispatcher failed to start: " + format_error(err));

            //
            // Kill process
            //
            // process.exit();
	    // 
	    return cb('Error while starting the dispatcher: ', format_error(err));
        }

        //
        // Calculate time difference
        //
        time_diff = (Date.now() - time_start) / 1000;

        //
        // Notify
        //
        if (_master_ip) {

            //
            // This is a child
            //
            console.log(" => Initialized with remote dispatcher: " + _master_ip + " in " + time_diff + "s");

        } else {

            //
            // This is a master
            //
            console.log(" => Dispatcher populated with " + count + " URLs in " + time_diff + "s");

        }

        //
        // Begin work
        //
        console.log(" => Begin distributing URLs");
        CrawlerController.crawl();
    });

}

/////////////////////////////////////////////////////
// void wait_for_database( callback )              //
/////////////////////////////////////////////////////
// This function will wait for database to init    //
// then execute a callback                         //
/////////////////////////////////////////////////////
function wait_for_database(fn) {

    //
    // Call this
    //
    var populate_after = function() {
        populate_db(fn);
    };

    //
    // Just specify a callback
    //
    Orm.init(populate_after);

}

/////////////////////////////////////////////////////
// ARGUMENT TABLE                                  //
/////////////////////////////////////////////////////
// Specifies callbacks for command line arguments  //
/////////////////////////////////////////////////////
var _argument_table = {

    "--help": print_help,
    "--reset": reset_crawl,
    "--master": set_master,
    "--init-db": init_db

};

/////////////////////////////////////////////////////
// void print_help( argc, argv )                   //
/////////////////////////////////////////////////////
// This function is called when the -help flag is  //
// specified or there is an error with another     //
// flag                                            //
/////////////////////////////////////////////////////
function print_help(argc, argv) {

    //
    // Print help
    //
    console.log("");
    console.log(" USAGE: node start.js <options>");
    console.log(" -----");
    console.log("");
    console.log(" OPTIONS ");
    console.log(" ------- ");
    console.log("   --help        :: display this help screen");
    console.log("   --master <ip> :: connect to a master");
    console.log("   --reset       :: reset crawl");
    console.log("   --init-db     :: initialize database");
    console.log("");

    //
    // Exit the process
    //
    process.exit();

}

/////////////////////////////////////////////////////
// void init_db( argc, argv )                      //
/////////////////////////////////////////////////////
// This function is called when the --init-db flag //
// is specified in the command line parameters     //
/////////////////////////////////////////////////////
init_db_flag = false;

function init_db(argc, argv) {
    init_db_flag = true;
    return 0;
}

/////////////////////////////////////////////////////
// void reset_crawl( argc, argv )                  //
/////////////////////////////////////////////////////
// This function is called when the -reset flag.   //
// It will reset the crawl pointer and essentially //
// start crawl from the beginning                  //
/////////////////////////////////////////////////////
function reset_crawl(argc, argv) {
    //
    // Confirm message
    //
    if (argc >= 2 && argv[1] == "YES") {
        tmp = {
            "time": 0,
            "chunk": 0,
            "emails": 0,
            "crawls": 0,
            "time_per_crawl": 0,
            "total_crawl_time": 0,
            "total_bytes_processed": 0,
            "total_bandwidth": 0
        }
        fs.writeFileSync('config/dispatchersettings.js', '' +
            '/* This file is auto-generated */\r\n' +
            'module.exports = ' + JSON.stringify(tmp) + ';', 'utf8');
        console.log("");
        console.log(" NOTICE: Crawler has been reset");
    } else {

        console.log("");
        console.log(" WARNING: This will restart the crawl back to 0%. If you are certain, run");
        console.log("          this program with '-reset YES' flags");
    }
    //
    // Exit the process
    //
    process.exit();
}

/////////////////////////////////////////////////////
// void set_master( argc, argv )                   //
/////////////////////////////////////////////////////
// This function is called when the -master flag   //
// is specified in command line. This will set a   //
// master server for the node instance             //
/////////////////////////////////////////////////////
function set_master(argc, argv) {

    //
    // Check if we have enough arguments
    //
    // i.e. "-master 127.0.0.1", at least 2
    //
    if (argc < 2) {

        //
        // We cannot process without argument
        //
        console.log("");
        console.log(" ERROR: Incorrect usage of -master");

        //
        // Print help
        //
        print_help();

        //
        // We don't actually ever get here; print_help()
        // kills the process
        //
        return 0;

    }

    //
    // Set the master IP
    //
    _master_ip = argv[1];

    //
    // Return the number of function arguments
    //
    return 1;

}

/////////////////////////////////////////////////////
// void process_args( argc, argv )                 //
/////////////////////////////////////////////////////
// This function will process arguments and call   //
// the correct functions                           //
/////////////////////////////////////////////////////
function process_args(argc, argv) {

    //
    // Local variables
    //
    var fn, arg, i;

    //
    //
    //
    for (i = 0; i < argc; i++) {

        //
        // Argument value
        //
        arg = argv[i];

        //
        // Fetch the callback function
        //
        fn = _argument_table[arg]

        //
        // Check if flag has a handle
        //
        if (fn) {

            //
            // Call handler
            //
            i += fn(argc - i, argv.slice(i));

        }

    }

}

/////////////////////////////////////////////////////
// ENTRY-POINT: APPLICATION STARTS HERE            //
/////////////////////////////////////////////////////
function main(argc, argv) {

    //
    // Process arguments
    //
    process_args(argc, argv);

    // 
    // Let's print out a welcome screen displaying the 
    // application name and version
    // 
    print_welcome();

    //
    // Wait until database initialization is complete
    //
    wait_for_database(function() {

        // 
        // Start the Master worker
        // 
        start_master();

        //
        // Prevent process from ending
        //
        Cpu.loop();

    });

}

function main2(cb) {

    // 
    // Let's print out a welcome screen displaying the 
    // application name and version
    // 
    print_welcome();

    //
    // Wait until database initialization is complete
    //
    wait_for_database(function() {

        // 
        // Start the Master worker
        // 
        start_master(cb);

        //
        // Prevent process from ending
        //
        Cpu.loop();

    });

}

/////////////////////////////////////////////////////
// Export the entry-point "main" to start.js       //
/////////////////////////////////////////////////////
module.exports = {
    main: main,
    main2: main2
};
