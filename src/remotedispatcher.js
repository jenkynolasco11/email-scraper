/***************************************************
 * dispatcher.js                                   *
 *                                                 *
 * This defines a class for the Crawler Master     *
 * located on the current machine                  *
 *                                                 *
 ***************************************************/

/////////////////////////////////////////////////////
// Project Classes                                 //
/////////////////////////////////////////////////////
var Cpu = require('./cpu.js');
var REST = require('./rest.js');

/////////////////////////////////////////////////////
// class RemoteDispatcher                          //
/////////////////////////////////////////////////////
// This class is designed to be a singleton class. //
// It defines an interface for communicating       //
// with a remote dispatcher                        //
/////////////////////////////////////////////////////
function RemoteDispatcher(dispatcherIp)
{
  
  //
  // Private field "ip"
  //
  this._ip = dispatcherIp;
  
  //
  // Private field ""
  //
  this._stats = {
    id: Cpu.getMachineId(), 
    pid: Cpu.getProcessId(), 
    workers: workers,
    stats: {
      network: {download: {downloaded: 0, total: 0}},
      cpu: {
        name: 'Imaginary Processor',
        ram: '12GB',
        threads: 8
      }
    }
  };
  
  //
  // Private field "_ripc"
  //
  this._ripc = new REST.Client(dispatcherIp, 9383);
  
}

/////////////////////////////////////////////////////
// void RemoteDispatcher::init(workers, callback)  //
/////////////////////////////////////////////////////
// Download the URLs                               //
/////////////////////////////////////////////////////
function RemoteDispatcher__init(workers, callback)
{
  
  //
  // Send the command
  //
  var self = this;
  var tmp = this._stats;
  
  this._ripc.send('heartbeat', tmp, function(err, data){
    
    //
    // Check for error
    //
    if (err)
    {
      
      //
      // Execute callback with error
      //
      return callback(err);
      
    }
    
    //
    // Verify data
    //
    if (data.success == true)
    {
      
      //
      // Set a timer for heartbeat
      //
      var REFRESH_DELAY = 5 * 1000;
      
      setTimeout(RemoteDispatcher__init.bind(self), REFRESH_DELAY, workers, callback);
      
      //
      // Everything is good to go! (no error, listsize=0)
      //
      callback(null, 0);
      
    }
    
  });
  
}

RemoteDispatcher.prototype.init = RemoteDispatcher__init;
/////////////////////////////////////////////////////
// void RemoteDispatcher::getURLs( callback )      //
/////////////////////////////////////////////////////
// This function will download a series of         //
// directory URLs so that the Workers can go       //
// through each document and parse for emails      //
/////////////////////////////////////////////////////
function RemoteDispatcher__getURLs(callback)
{
  
  //
  // Not required to do anything here
  //
  
}

RemoteDispatcher.prototype.getURLs = RemoteDispatcher__getURLs;
/////////////////////////////////////////////////////
// String RemoteDispatcher::ready(data,callback)   //
/////////////////////////////////////////////////////
// Signals the dispatcher that ready for next url  //
/////////////////////////////////////////////////////
function RemoteDispatcher__ready(data, callback)
{
  
  //
  // Local variables
  //
  var emails, time_taken;
  
  //
  // Send the command
  //
  emails = (data) ? data.emails : null;
  time_taken = (data) ? data.time_taken : 0;
  
  this._ripc.send('ready', {}, function(err, data){
    
    //
    // Check for error
    //
    if (err)
    {
      
      //
      // Execute callback with error
      //
      return callback(err);
      
    }
    
    //
    // Verify data
    //
    if (data.success == true)
    {
      
      //
      // Everything is good to go! (no error, listsize=0)
      //
      // console.log(data);
      callback(data.url);
      
    }
    
  });
  

  
}

RemoteDispatcher.prototype.ready = RemoteDispatcher__ready;
/////////////////////////////////////////////////////
// Export our class to other parts of the app      //
/////////////////////////////////////////////////////
module.exports = RemoteDispatcher;
