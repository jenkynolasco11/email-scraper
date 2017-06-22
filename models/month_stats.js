module.exports = {
    month: { type: Sequelize.STRING(16), unique: true },
    url_count: Sequelize.INTEGER,
    // email_count: Sequelize.INTEGER,
};