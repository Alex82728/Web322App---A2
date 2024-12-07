const { Sequelize, DataTypes } = require('sequelize');

// Create a Sequelize instance with secure connection settings
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'ep-twilight-dust-a5mhlocu.us-east-2.aws.neon.tech',
  username: 'SenecaDB_owner',
  password: 'xRJ8MT1jwXdO',
  database: 'SenecaDB',
  port: 5432,
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false, // Disable certificate validation if using self-signed certs
    },
  },
  logging: false, // Disable query logging for cleaner output
});

// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('Connected to the database successfully!');
  })
  .catch((err) => {
    console.error('Error connecting to the database:', err);
  });

// Define the Item model (with exact table name)
const Item = sequelize.define('Item', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  postDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
  published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  categoryId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Categories', // The name of the target table
      key: 'id',
    },
    allowNull: false,
  },
}, {
  tableName: 'Items', // Use the exact table name with case-sensitivity
  timestamps: false, // Disable timestamps (createdAt, updatedAt)
});

// Define the Category model (with exact table name)
const Category = sequelize.define('Category', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'Categories', // Use the exact table name with case-sensitivity
  timestamps: false, // Disable timestamps (createdAt, updatedAt)
});

// Define relationships
Item.belongsTo(Category, { foreignKey: 'categoryId' });
Category.hasMany(Item, { foreignKey: 'categoryId' });

// Export the models and sequelize instance
module.exports = {
  sequelize,
  Item,
  Category,
};
