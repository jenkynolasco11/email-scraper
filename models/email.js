module.exports = {
    // id: TYPE_INT | PRIMARY_KEY | AUTO_INCREMENT,

    // email: TYPE_VARCHAR(64),
    // email:  {type: Sequelize.STRING(64), unique: true},
    email: { type: Sequelize.STRING(128), unique: true },

    // tries:TYPE_INTEGER # of tries (# of times a smtp drone has tried it)
    tries: Sequelize.INTEGER,

    // first_name: TYPE_VARCHAR(32),
    first_name: Sequelize.STRING(128),

    // middle_name: TYPE_VARCHAR(32),
    middle_name: Sequelize.STRING(128),

    // last_name: TYPE_VARCHAR(32),
    last_name: Sequelize.STRING(128),

    // full_name: TYPE_VARCHAR(64),
    full_name: Sequelize.STRING(128),

    // has_name: TYPE_BOOLEAN,
    has_name: Sequelize.BOOLEAN,

    // domain: TYPE_VARCHAR(32),
    domain: Sequelize.STRING(64),

    // is_personal_email: TYPE_BOOLEAN
    is_personal_email: Sequelize.BOOLEAN,

    // crawled_by: TYPE_VARCHAR(32),
    crawled_by: Sequelize.STRING(64),

    // crawled_on: TYPE_DATETIME,
    crawled_on: Sequelize.DATE,

    found_on: Sequelize.STRING(4096),

    // verified_by: TYPE_VARCHAR(32),
    verified_by: Sequelize.STRING,

    // verified_on: TYPE_DATETIME,
    verified_on: Sequelize.DATE,

    // verification_status: TYPE_ENUM('NONE', 'PROCESSING', 'FINISHED', 'SURRENDER'),
    // SURRENDER : This email has been attempted to verify by multiple smtp servers each doing a retry of 3 times and isn't working we stop trying to validate it.
    // FINISHED: This email was successfully verified as real or fake or catch all
    // PROCESSING: Email is currently being processed by an SMTP drone
    // verification_status: TYPE_VARCHAR(128),
    verification_status: Sequelize.STRING(128),

    // scraped_from: TYPE_VARCHAR(128),
    scraped_from: Sequelize.STRING(128),

    is_valid: Sequelize.BOOLEAN,

    priority: Sequelize.INTEGER
};