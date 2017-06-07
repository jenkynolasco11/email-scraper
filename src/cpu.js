/***************************************************
 * cpu.js                                          *
 *                                                 *
 * Provide helper functions for CPU related tasks  *
 *                                                 *
 ***************************************************/

/////////////////////////////////////////////////////
// "System" Imports                                //
/////////////////////////////////////////////////////
var crypto = require('crypto');
var os = require('os');
var fs = require('fs');

/////////////////////////////////////////////////////
// Project Imports                                 //
/////////////////////////////////////////////////////
var machine_info = require('../config/machineinfo.js');

if (!machine_info.id) {

    // TODO: Write variable thread amount
    var fp, tmp, id;
    id = crypto.randomBytes(4).toString('hex');
    tmp = { "id": id };
    machine_Info = tmp;
    fp = fs.createWriteStream('./config/machineinfo.js');
    fp.write('/* This file is auto-generated */\r\n');
    fp.write('module.exports = ' + JSON.stringify(tmp) + ';');
    fp.end();

}

/////////////////////////////////////////////////////
// String getMachineId( void )                     //
/////////////////////////////////////////////////////
// Returns the ID associated with this machine     //
/////////////////////////////////////////////////////
function getMachineId() {

    // Return the variable
    return machine_info.id;

}

/////////////////////////////////////////////////////
// String getProcessId( void )                     //
/////////////////////////////////////////////////////
// Returns the ID associated with this process     //
/////////////////////////////////////////////////////
function getProcessId() {

    // Return the variable
    return process.pid;

}

/////////////////////////////////////////////////////
// String getName( void )                          //
/////////////////////////////////////////////////////
// Returns the name of the processor on the first  //
// core. This assumes all CPU names will be same   //
/////////////////////////////////////////////////////
function getName() {

    // Return the amount of CPUs available
    return os.cpus()[0].model;

}

/////////////////////////////////////////////////////
// int getCores( void )                            //
/////////////////////////////////////////////////////
// Returns the amount of cores available within    //
// the system                                      //
/////////////////////////////////////////////////////
function getCores() {

    // Return the amount of CPUs available
    return os.cpus().length;

}

/////////////////////////////////////////////////////
// int getRAM( void )                              //
/////////////////////////////////////////////////////
// Returns the amount of RAM available within the  //
// system                                          //
/////////////////////////////////////////////////////
function getRAM() {

    // Return the amount of CPUs available
    return os.totalmem();

}

/////////////////////////////////////////////////////
// void loop( void )                               //
/////////////////////////////////////////////////////
// Continuously qeueus a function to prevent node  //
// from exiting the process                        //
/////////////////////////////////////////////////////
function loop() {

    //
    // Continuously queue this function
    //
    setTimeout(loop, 60 * 60 * 24);

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

    getName: getName,
    getCores: getCores,
    getRAM: getRAM,
    getMachineId: getMachineId,
    getProcessId: getProcessId,
    loop: loop

};