/***************************************************
 * start.js                                        *
 *                                                 *
 * Starts executing the main code of the           *
 * application                                     *
 *                                                 *
 ***************************************************/

/***************************************************
 * DEPENDENCIES                                    *
 ***************************************************
 *                                                 *
 * This application depends on:                    *
 *  1) pg (npm install pg)                         *
 *  2) sequelize (npm install sequelize)           *
 *                                                 *
 * Please make sure that the above are installed   *
 * in order to run the application correctly       *
 *                                                 *
 ***************************************************/

//
// Import main()
//
var main = require('./src/main.js');
var fs = require('fs');
//
// Run main
//
// main.main(process.argv.length, process.argv);

var fil = './config/commoncrawl_db.js';

if (fs.existsSync(fil)) fs.unlinkSync(fil);

main.main2(function(arg) {
    console.log('it ended. arg is: ', arg);
    process.exit();
});