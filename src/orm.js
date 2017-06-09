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
global.Sequelize = require('sequelize');

/////////////////////////////////////////////////////
// Create database object                          //
/////////////////////////////////////////////////////
var sequelize = new Sequelize('postgres://postgres:postgres@127.0.0.1:5432/frynet', { logging: false });

// sequelize.authenticate().then(function(err) {
//     if (err) console.log(err)
//     else console.log('Authentication OK!')
// });

/////////////////////////////////////////////////////
// Keeps track of the amount of models             //
/////////////////////////////////////////////////////
// var _models_total = 0;
var _models_complete = 0;
var _models_total = 5; // Make sure to change this later
var _callback_on_init = null;

function _sync(model) {
    // _models_total++;

    return new Promise(function(resolve, reject) {
        //
        // Increment number of complete
        //
        _models_complete++;
        //
        // Check if we are done
        //
        // console.log(_models_complete, _models_total)
        if (_models_complete == _models_total) {
            _createAssociations(function() {
                //
                // We are done. Execute callback
                //
                if (_callback_on_init) {
                    //
                    // Execute
                    //
                    return resolve(_callback_on_init());
                }
            });
        }
        return resolve(model.sync({ force: true }));
    });
}

/////////////////////////////////////////////////////
// Callback on done                                //
/////////////////////////////////////////////////////
function _on_init(fn) {
    //
    // Just set the callback
    //
    _callback_on_init = fn;
}


function _createAssociations(fn) {
    // once models are initialized we can set the relationships
    fn();
}

/////////////////////////////////////////////////////
// User Search                                     //
// links a search to an email result               //
/////////////////////////////////////////////////////
global.Search = sequelize.define(
    'search',
    require('../models/search.js'), { freezeTableName: true }
);

/////////////////////////////////////////////////////
// User Search To Result Join Table                //
/////////////////////////////////////////////////////
global.SearchEmail = sequelize.define(
    'search_x_email',
    require('../models/search_email.js'), { freezeTableName: true }
);

/////////////////////////////////////////////////////
// Domain Object                                   //
/////////////////////////////////////////////////////
global.DomainPattern = sequelize.define(
    'domain_pattern',
    require('../models/domain_pattern.js'), { freezeTableName: true }
);

/////////////////////////////////////////////////////
// Pattern Object                                  //
/////////////////////////////////////////////////////
global.Pattern = sequelize.define(
    'pattern',
    require('../models/pattern.js'), { freezeTableName: true }
);

/////////////////////////////////////////////////////
// Email object                                    //
/////////////////////////////////////////////////////
global.Email = sequelize.define(
    'email',
    require('../models/email.js'), { freezeTableName: true }
);

/////////////////////////////////////////////////////
// Many-to-many relationships Search vs. Email     //
/////////////////////////////////////////////////////
Email.belongsToMany(Search, { through: SearchEmail, foreignKey: 'email_id' });
Search.belongsToMany(Email, { through: SearchEmail, foreignKey: 'search_id' });

/////////////////////////////////////////////////////
// Sync database schema                            //
/////////////////////////////////////////////////////
// _sync(global.DomainPattern);
// _sync(global.Pattern);
// _sync(global.Search);
// _sync(global.Email);
// _sync(global.SearchEmail);

_sync(global.Pattern)
    .then(function() {
        return _sync(global.Email);
    })
    .then(function() {
        return _sync(global.Search);
    })
    .then(function() {
        return _sync(global.DomainPattern);
    })
    .then(function() {
        return _sync(global.SearchEmail);
    }).catch(function(err) {
        console.log(err)
    })

/////////////////////////////////////////////////////
// Nothing to export                               //
/////////////////////////////////////////////////////
module.exports = {
    init: _on_init
};