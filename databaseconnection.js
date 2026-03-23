const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.SQL_HOST,
  port: process.env.SQL_PORT,
	user: process.env.SQL_USER,
	password: process.env.SQL_PASSWORD,
	database: process.env.SQL_DATABASE,
  multipleStatements: false,
	namedPlaceholders: true
}

var database = mysql.createPool(dbConfig);

module.exports = database;