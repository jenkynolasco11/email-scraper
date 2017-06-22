module.exports = {
    url: { type: Sequelize.STRING(128), unique: true },

    time: Sequelize.STRING(64),

    date: Sequelize.STRING(64),

    chunks: Sequelize.STRING(64),

    server: Sequelize.STRING(64),

    ip: Sequelize.STRING(32),

    month_id: Sequelize.INTEGER
};