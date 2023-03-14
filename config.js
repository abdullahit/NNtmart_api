const mysql = require('mysql2');

con = mysql.createConnection({
    host: '3.110.181.239',
    user : 'root',
    password : 'Csd@4850',
    database : 'nntmart',
    port:3306
});
module.exports = con;
