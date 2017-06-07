/***************************************************
 * ipc.js                                          *
 *                                                 *
 * This file creates an interface for facilitating *
 * IPC between processes. This extends nodes IPC   *
 * by providing a similar interface to ChildEvent  *
 * and extending the ability to have return        *
 * values, custom events, and callbacks            *
 *                                                 *
 ***************************************************/

/////////////////////////////////////////////////////
// "System" Imports                                //
/////////////////////////////////////////////////////
var crypto = require('crypto');
 
/////////////////////////////////////////////////////
// class Ipc                                       //
/////////////////////////////////////////////////////
// This is the "Master" class. It defines methods  //
// that are unique to a Master worker only         //
/////////////////////////////////////////////////////

/////////////////////////////////////////////////////
// Ipc::Ipc( child )                               //
/////////////////////////////////////////////////////
// Constructor. It is responsible for creating a   //
// IPC interface to a processworker only.          //
//                                                 //
// "child" can be null for child process callee    //
/////////////////////////////////////////////////////
function Ipc(child, context)
{
  
  //
  // Private field: "process"
  //
  // This will store the child process
  //
  this._process = child || process;
  
  //
  // Private field: "context"
  //
  // Will execute callbacks in "context" context
  //
  this._context = context || null;
  
  //
  // Private field: "ids"
  //
  // This will store a list of call ids which will
  // be used to identify the callback function
  // upon return from an IPC command
  //
  this._ids = {};
  
  //
  // Private field: "cmds"
  //
  // This will store a list of callbacks associated
  // with a string command
  //
  this._cmds = {};
  
  //
  // Apply IPC callbacks
  //
  this.apply();
  
}

/////////////////////////////////////////////////////
// Ipc::onMessage( data )                          //
/////////////////////////////////////////////////////
// This is the callback for the 'message' IPC      //
// callback                                        //
/////////////////////////////////////////////////////
function Ipc__onMessage(data)
{
  
  //
  // NOTE:
  // This function is executing in a different 
  // object context. "this" does not represent
  // an Ipc object
  // 
  
  //
  // Local variables
  //
  var fn, id, cmd, argv, ret;
  
  //
  // Set variables
  //
  id = data._id;
  cmd = data._cmd;
  argv = data._argv;
  
  //
  // Check and see if it's a return value
  //
  if (cmd == '$ret')
  {
    
    //
    // This is a return from a function
    //
    
    //
    // Look up the callback associated with
    // the id
    //
    fn = this._ipc._ids[id]
    
    if (fn)
    {
      
      //
      // Execute the function
      //
      fn(argv);
      
      //
      // Delete the ID
      //
      // NOTE: there may be a null function
      //
      delete this._ipc._ids[id];
      
    }
    
    return;
    
  }
  
  //
  // Look up the name of the variable
  //
  fn = this._ipc._cmds[cmd];
  
  if (fn)
  {
    
    //
    // Execute the function
    //
    ret = fn(argv);
    
    //
    // Send back results to appropriate process
    //
    this.send({_id: id, _cmd: "$ret", _argv: ret});
    
  }
  
}

Ipc.onMessage = Ipc__onMessage;

/////////////////////////////////////////////////////
// Ipc::apply( void )                              //
/////////////////////////////////////////////////////
// This will apply IPC callback via the process    //
// class                                           //
/////////////////////////////////////////////////////
function Ipc__apply()
{
  
  //
  // "Tag" the process class
  //
  this._process._ipc = this;
  
  //
  // Set the callback procedure
  //
  this._process.on('message', Ipc.onMessage);
  
}

Ipc.prototype.apply = Ipc__apply;

/////////////////////////////////////////////////////
// Ipc::on( cmd, callback )                        //
/////////////////////////////////////////////////////
// Executes a callback when a certain command is   //
// communicated to the process                     //
/////////////////////////////////////////////////////
function Ipc__on(cmd, callback)
{
  
  //
  // Local variables
  //
  var fn;
  
  //
  // Compose a variabe
  //
  fn = callback.bind(this._context);
  
  switch(cmd)
  {
    
    //
    // Exit event is a native event
    //
    case 'exit':
      this._process.on('exit', fn);
      break;
      
    //
    // Our other events
    //
    default:
      
      //
      // Assign the key to the "cmds" associative array
      //
      // this._cmds[cmd] = callback;
      this._cmds[cmd] = fn;
      
      break;
    
  }
  
}

Ipc.prototype.on = Ipc__on;

/////////////////////////////////////////////////////
// Ipc::send( cmd, data, callback )                //
/////////////////////////////////////////////////////
// Sends a command over to the associated child    //
// process. After the child finishes, the          //
// specified process will be executed              //
/////////////////////////////////////////////////////
function Ipc__send(cmd, data, callback)
{
  
  //
  // Local variables
  //
  var id;
  
  //
  // Generate a random id
  //
  id = crypto.randomBytes(12).toString('hex');
  
  //
  // Add the callback entry into our "ids" list
  //
  // this._ids[id] = callback;
  this._ids[id] = callback.bind(this._context);
  
  //
  // Send the packet over to the child process
  //
  this._process.send({_id: id, _cmd: cmd, _argv: data});
}

Ipc.prototype.send = Ipc__send;


/////////////////////////////////////////////////////
// Export our class to other parts of the app      //
/////////////////////////////////////////////////////
module.exports = Ipc;

