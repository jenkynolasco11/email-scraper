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
var pool = { max: 10, min: 1, idle: 20, acquire: 10000 };
var dialectOptions = { connectTimeout: 10000 };
var options = {
    dialect: 'postgres',
    //	pool : pool,
    //	dialectOptions : dialectOptions,
    logging: false
};
var sequelize = new Sequelize('postgres://postgres:postgres@127.0.0.1:5432/frynet', options);

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
        return resolve(model.sync( /*{ force: true }*/ ));
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
// Stats object                                    //
/////////////////////////////////////////////////////
// global.Stats = sequelize.define(
//     'stats',
//     require('../models/stats.js', { freezeTableName: true })
// )


/////////////////////////////////////////////////////
// Common Crawl Month objects                       //
/////////////////////////////////////////////////////
// global.CCUrl = sequelize.define(
//     'commoncrawl_url',
//     require('../models/commoncrawl_url.js', { freezeTableName: true })
// )

// global.CCUrlStat = sequelize.define(
//     'commoncrawl_url_stats',
//     require('../models/commoncrawl_url_stat.js', { freezeTableName: true })
// )

// global.MonthStat = sequelize.define(
//     'month_stat',
//     require('../models/month_stats.js', { freezeTableName: true })
// )

/////////////////////////////////////////////////////
// One-to-many relationship                        //
/////////////////////////////////////////////////////
// CCUrl.belongsTo(MonthStat, { foreignKey: 'month_id' });
// MonthStat.hasMany(CCUrl, { foreignKey: 'month_id' });

/////////////////////////////////////////////////////
// Many-to-many relationships Search vs. Email     //
/////////////////////////////////////////////////////
Email.belongsToMany(Search, { through: SearchEmail, foreignKey: 'email_id' });
Search.belongsToMany(Email, { through: SearchEmail, foreignKey: 'search_id' });


// Default Values

/////////////////////////////////////////////////////
// Sync database schema                            //
/////////////////////////////////////////////////////
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
    })
    // .then(function() {
    //     return _sync(global.Stats);
    // })
    // .then(function() {
    //     return Stats.build({
    //         id: 1,
    //         url_count: 0,
    //         email_count: 0,
    //         emails_processed: 0,
    //     }).save();
    // })
    // .then(function() {
    //     return _sync(global.MonthStat);
    // })
    // .then(function() {
    //     return _sync(global.CCUrl);
    // })
    // .then(function() {
    //     return _sync(global.CCUrlStat);
    // })
    .catch(function(err) {
        console.log(err)
    })

/////////////////////////////////////////////////////
// Nothing to export                               //
/////////////////////////////////////////////////////
module.exports = {
    init: _on_init
};