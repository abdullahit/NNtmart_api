

const express = require('express');
const con = require('./config')
const bodyParser = require('body-parser');
const randomstring =require('randomstring')

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// create new user through MobileNumber entered
app.post('/login', (req, res) => {
    const MobileNumber = req.body.MobileNumber;
    const checkMobileNumberSql = 'SELECT * FROM login WHERE MobileNumber =?';
    con.query(checkMobileNumberSql, [MobileNumber], (error, result) => {
        if (error) throw error;
        else {
            if (result.length > 0) {
                // If user already exists, send back their details
                console.warn('user is already');
                const otp = randomstring.generate({
                    length: 4,
                    charset: 'numeric'
                });
                res.send({
                    user: result[0],
                    otp: otp
                });
            } else {
                // If user does not exist, create a new user record
                const newUserSql = 'INSERT INTO login (MobileNumber) VALUES (?)';
                con.query(newUserSql, [MobileNumber], (error, result) => {
                    if (error) throw error;
                    else {
                        // Fetch the newly created user record and send it back
                        const getUserSql = 'SELECT * FROM login WHERE MobileNumber = ?';
                        con.query(getUserSql, [MobileNumber], (error, result) => {
                            if (error) throw error;
                            else {
                                const otp = randomstring.generate({
                                    length: 4,
                                    charset: 'numeric'
                                });
                                res.send({
                                    user: result[0],
                                    otp: otp
                                });
                            }
                        });
                    }
                });
            }
        }
    });
});

app.listen(30001, ()={
console.log('server Listen On Port No: 30001');
});





