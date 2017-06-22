module.exports = {
    url: { type: Sequelize.STRING(128), unique: true },

    parsed: Sequelize.BOOLEAN,
};