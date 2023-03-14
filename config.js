const mysql = require('mysql2');

con = mysql.createConnection({
    host: '3.110.181.239',
    user : 'root',
    password : 'Csd@4850',
    database : 'nntmart'
});
module.exports = con;
