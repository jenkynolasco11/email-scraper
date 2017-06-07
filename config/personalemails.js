/***************************************************
 * personalemails.js                               *
 *                                                 *
 * Provides a list of personal emails domains to   *
 * ignore during email parsing                     *
 *                                                 *
 * TODO: Replace with database entries             *
 *                                                 *
 ***************************************************/
 
/////////////////////////////////////////////////////
// Personal Email Domains                          //
/////////////////////////////////////////////////////
var TYPE_NONE = 0, TYPE_SEMI = 1, TYPE_SPECIFIC = 2;

var _personal_emails = {
  
  "icloud.com": true,
  "msn.com": true,
  "aol.com": true,
  "gmail.com": true,
  "yahoo.com": true,
  "hotmail.com": true,
  "live.com": true,
  "outlook.com": true,
  "sbcglobal.net": true
  
};

var _email_patterns = {
  "[fn].[ln]": {id: 1, specific: TYPE_SPECIFIC},
  "[ln].[fn]": {id: 2, specific: TYPE_SPECIFIC},
  
  "[fn]-[ln]": {id: 3, specific: TYPE_SPECIFIC},
  "[ln]-[fn]": {id: 4, specific: TYPE_SPECIFIC},
  
  "[fn][ln]": {id: 5, specific: TYPE_SPECIFIC},
  "[ln][fn]": {id: 6, specific: TYPE_SPECIFIC},
  
  "[fn]_[ln]": {id: 7, specific: TYPE_SPECIFIC},
  "[ln]_[fn]": {id: 8, specific: TYPE_SPECIFIC},
  //////////////////////////////
  "[fi].[ln]": {id: 9, specific: TYPE_SEMI},
  "[ln].[fi]": {id: 10, specific: TYPE_SEMI},
  
  "[fi]-[ln]": {id: 11, specific: TYPE_SEMI},
  "[ln]-[fi]": {id: 12, specific: TYPE_SEMI},
  
  "[fi][ln]": {id: 13, specific: TYPE_SEMI},
  "[ln][fi]": {id: 14, specific: TYPE_SEMI},
  
  "[fi]_[ln]": {id: 15, specific: TYPE_SEMI},
  "[ln]_[fi]": {id: 16, specific: TYPE_SEMI},
  //////////////////////////////
  "[fn][li]": {id: 17, specific: TYPE_NONE},
  "[fn].[li]": {id: 18, specific: TYPE_NONE},
  
  "[fi][li]": {id: 19, specific: TYPE_NONE},
  "[fi].[li]": {id: 20, specific: TYPE_NONE},
  
  "[li][fn]": {id: 21, specific: TYPE_NONE},
  "[li].[fn]": {id: 22, specific: TYPE_NONE},
  
  "[li][fi]": {id: 23, specific: TYPE_NONE},
  "[li].[fi]": {id: 24, specific: TYPE_NONE},
  //////////////////////////////
  "[fi][mi][ln]": {id: 25, specific: TYPE_SEMI},
  "[fi][mi].[ln]": {id: 26, specific: TYPE_SEMI},
  
  "[fn][mi][ln]": {id: 27, specific: TYPE_SEMI},
  "[fn].[mi].[ln]": {id: 28, specific: TYPE_SEMI},
  
  "[fn][mn][ln]": {id: 29, specific: TYPE_SPECIFIC},
  "[fn].[mn].[ln]": {id: 30, specific: TYPE_SPECIFIC},
  
  "[fn]-[li]": {id: 31, specific: TYPE_NONE},
  "[fi]-[li]": {id: 32, specific: TYPE_NONE},
  //////////////////////////////
  "[li]-[fn]": {id: 33, specific: TYPE_NONE},
  "[li]-[fi]": {id: 34, specific: TYPE_NONE},
  
  "[fi][mi]-[ln]": {id: 35, specific: TYPE_SEMI},
  "[fn]-[mi]-[ln]": {id: 36, specific: TYPE_SEMI},
  
  "[fn]-[mn]-[ln]": {id: 37, specific: TYPE_SPECIFIC},
  "[fn]_[li]": {id: 38, specific: TYPE_NONE},
  
  "[fi]_[li]": {id: 39, specific: TYPE_NONE},
  "[li]_[fn]": {id: 40, specific: TYPE_NONE},
  //////////////////////////////
  "[li]_[fi]": {id: 41, specific: TYPE_NONE},
  "[fi][mi]_[ln]": {id: 42, specific: TYPE_SEMI},
  
  "[fn]_[mi]_[ln]": {id: 43, specific: TYPE_SEMI},
  "[fn]_[mn]_[ln]": {id: 44, specific: TYPE_SEMI},
  
  "[fn]": {id: 45, specific: TYPE_NONE},
  "[ln]": {id: 46, specific: TYPE_NONE}

};

/////////////////////////////////////////////////////
// Export the emails to be used in other parts     //
/////////////////////////////////////////////////////
module.exports = {
  personal_emails: _personal_emails,
  email_patterns: _email_patterns,
};