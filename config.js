const mysql = require('mysql2');

con = mysql.createConnection({
    host: '13.233.95.37',
    user : 'ubuntu',
    password : 'Csd@4850',
    database : 'nntmart'
});
module.exports = con;
