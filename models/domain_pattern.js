module.exports = {
    // id: TYPE_INT | PRIMARY_KEY | AUTO_INCREMENT,
    // domain: TYPE_VARCHAR(32),
    domain: Sequelize.STRING(64),
    pattern_id: Sequelize.INTEGER,
    popularity: Sequelize.INTEGER
};