const { Client } = require('pg');

// Database connection configuration
const client = new Client({
  user: 'SenecaDB_owner',
  host: 'ep-twilight-dust-a5mhlocu.us-east-2.aws.neon.tech',
  database: 'SenecaDB',
  password: 'xRJ8MT1jwXdO',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

// Connect to the database
client.connect()
  .then(() => {
    console.log('Connected to the database');
  })
  .catch(err => {
    console.error('Error connecting to the database:', err.stack);
  });


module.exports = client;