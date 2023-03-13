const mysql = require('mysql2');

con = mysql.createConnection({
    host: 'localhost',
    user : 'root',
    password : 'Csd@4850',
    database : 'nntmart'
});
module.exports = con;
