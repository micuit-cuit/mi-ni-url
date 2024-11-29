const Sequelize = require('sequelize');
module.exports = {
    Database: {//exemple of database config
        dialect: 'sqlite',
        storage: './db/database.sqlite',
        logging: false,
        define: {
            timestamps: true
        },
    },
    Model: {//exemple of model config
        url: {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            url: {
                type: Sequelize.STRING,
                allowNull: false
            },
            redirect: {
                type: Sequelize.STRING,
                allowNull: false
            },
            ip: {
                type: Sequelize.STRING,
                allowNull: false
            }
            //by default, the table name is equal to the model name, but you can change it with the tableName property
        }
    }
};
