const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize connection
const sequelize = new Sequelize('SenecaDB', 'SenecaDB_owner', 'xRJ8MT1jwXdO', {
    host: 'ep-twilight-dust-a5mhlocu.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    }
});

// Define the Item model
const Item = sequelize.define('Item', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    postDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    published: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    categoryId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Categories', // The name of the target table
            key: 'id'
        },
        allowNull: false
    }
}, {
    timestamps: false // Disable timestamps (createdAt, updatedAt)
});

// Define the Category model
const Category = sequelize.define('Category', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: false // Disable timestamps (createdAt, updatedAt)
});

// Define relationships
Item.belongsTo(Category, { foreignKey: 'categoryId' });
Category.hasMany(Item, { foreignKey: 'categoryId' });

// Sync models with database
sequelize.sync()
    .then(() => console.log('Models synchronized successfully'))
    .catch((err) => console.error('Error synchronizing models:', err));

// Export the models and Sequelize instance
module.exports = { Item, Category, sequelize };
