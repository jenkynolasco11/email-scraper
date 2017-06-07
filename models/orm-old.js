/***************************************************
 * orm.js                                          *
 *                                                 *
 * This defines a set of database models using     *
 * sequelize                                       *
 *                                                 *
 ***************************************************/
 
/////////////////////////////////////////////////////
// System imports                                  //
/////////////////////////////////////////////////////
var Sequelize = require('sequelize');

/////////////////////////////////////////////////////
// Create database object                          //
/////////////////////////////////////////////////////
var sequelize = new Sequelize('postgres://postgres@127.0.0.1:5432/frynet', {logging: false});

/////////////////////////////////////////////////////
// Keeps track of the amount of models             //
/////////////////////////////////////////////////////
var _models_total = 0;
var _models_complete = 0;
var _callback_on_init = null;

function _sync(model)
{
  
  model.sync().then(function() {

    //
    // Increment number of complete
    //
    _models_complete++;
    
    //
    // Check if we are done
    //
    if (_models_complete == _models_total)
    {
      
      //
      // We are done. Execute callback
      //
      if (_callback_on_init)
      {
        
        //
        // Execute
        //
        _callback_on_init();
        
      }
      
    }
    
  }); 
  
}

function _define(name, fields)
{
  
  //
  // Local variables
  //
  var result;
  
  //
  // Increment number of models
  //
  _models_total++;
  
  //
  // Call sequelize
  //
  result = sequelize.define(name, fields, {freezeTableName: true});
  
  //
  // Sync
  //
  _sync(result);
  
  //
  // Return
  //
  return result;
  
}

/////////////////////////////////////////////////////
// Callback on done                                //
/////////////////////////////////////////////////////

function _on_init(fn)
{
  
  //
  // Just set the callback
  //
  _callback_on_init = fn;
  
}


/////////////////////////////////////////////////////
// Email object                                    //
/////////////////////////////////////////////////////
global.Email = _define('email', {
  // id: TYPE_INT | PRIMARY_KEY | AUTO_INCREMENT,
  
  // email: TYPE_VARCHAR(64),
  email: Sequelize.STRING(64),
  
  // first_name: TYPE_VARCHAR(32),
  first_name: Sequelize.STRING(32),
  
  // last_name: TYPE_VARCHAR(32),
  last_name: Sequelize.STRING(32),
  
  // full_name: TYPE_VARCHAR(64),
  full_name: Sequelize.STRING(64),
  
  // has_name: TYPE_BOOLEAN,
  has_name: Sequelize.BOOLEAN,
  
  // domain: TYPE_VARCHAR(32),
  domain: Sequelize.STRING(32),
  
  // is_personal_email: TYPE_BOOLEAN
  is_personal_email: Sequelize.BOOLEAN,
  
  // crawled_by: TYPE_VARCHAR(32),
  crawled_by: Sequelize.STRING(32),
  
  // crawled_on: TYPE_DATETIME,
  crawled_on: Sequelize.DATE,
  
  // verified_by: TYPE_VARCHAR(32),
  verified_by: Sequelize.STRING,
  
  // verified_on: TYPE_DATETIME,
  verified_on: Sequelize.DATE,
  
  // verification_status: TYPE_ENUM('NONE', 'PROCESSING', 'FINISHED'),
  verification_status: Sequelize.ENUM('NONE', 'PROCESSING', 'FINISHED'),
  
  // scraped_from: TYPE_VARCHAR(128),
  scraped_from: Sequelize.STRING(128),
   
});

/////////////////////////////////////////////////////
// Nothing to export                               //
/////////////////////////////////////////////////////
 module.exports = {
   
   onInit: _on_init
   
 };
 
 