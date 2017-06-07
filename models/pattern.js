global.TYPE_NONE = 0;
global.TYPE_SEMI = 1;
global.TYPE_SPECIFIC = 2;

module.exports = {
    id: {
        type: Sequelize.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    pattern: Sequelize.STRING(64),
    // anotherField: Sequelize.STRING(32),
    specific: Sequelize.INTEGER
};