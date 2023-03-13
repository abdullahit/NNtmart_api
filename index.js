const express = require('express');
const con = require('./config')
const bodyParser = require('body-parser');
const randomstring =require('randomstring')

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));



// db.connect((err) => {
//   if (err) throw err;
//   console.log('Connected to database');
// });

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
                res.send(result[0]);
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
                                res.send(result[0]);
                            }
                        });
                    }
                });
            }
        }
    });
});





// Generate and store OTP for a given mobile number
app.post('/generate-otp', (req, res) => {
    const { MobileNumber } = req.body;
    const otp = randomstring.generate({
        length: 4,
        charset: 'numeric'
    });

    // Insert the mobile number and OTP code into the MySQL database
    const sql = `INSERT INTO login (MobileNumber, otp) VALUES (?, ?)`;
    const values = [MobileNumber, otp];
    con.query(sql, values, (error, result) => {
        if (error) throw error;
        console.log('OTP inserted into MySQL database');
    });

    res.status(200).json({ otp });
});

// Validate OTP for a given mobile number
app.post('/validate-otp', (req, res) => {
    const { MobileNumber, otp } = req.body;

    // Query the MySQL database to retrieve the stored OTP for the given mobile number
    const sql = `SELECT otp FROM login WHERE MobileNumber = ?`;
    const values = [MobileNumber];
    con.query(sql, values, (error, result) => {
        if (error) throw error;
        const storedOtp = result[0].otp;
        if (otp === storedOtp) {
            // OTP code is valid, proceed with login
            // TODO: implement login logic
            res.status(200).json({ message: 'OTP validated successfully' });
        } else {
            // OTP code is invalid
            res.status(400).json({ message: 'Invalid OTP' });
        }
    });
});




// Generate and store OTP for a given mobile number
// app.post('/generate-otp', (req, res) => {
//   const { MobileNumber } = req.body;
//   const otp = randomstring.generate({
//       length: 4,
//       charset: 'numeric'
//   });

//   // Insert the mobile number and OTP code into the MySQL database
//   const sql = `INSERT INTO login (MobileNumber, otp) VALUES (?, ?)`;
//   const values = [MobileNumber, otp];
//   con.query(sql, values, (error, result) => {
//       if (error) throw error;
//       console.log('OTP inserted into MySQL database');
//   });

//   res.status(200).json({ otp });
// });

// // Validate OTP for a given mobile number
// app.post('/validate-otp', (req, res) => {
//   const { MobileNumber, otp } = req.body;

//   // Query the MySQL database to retrieve the stored OTP for the given mobile number
//   const sql = `SELECT otp FROM login WHERE MobileNumber = ?`;
//   const values = [MobileNumber];
//   con.query(sql, values, (error, result) => {
//       if (error) throw error;
//       const storedOtp = result[0].otp;
//       if (otp === storedOtp) {
//           // OTP code is valid, proceed with login
//           // TODO: implement login logic
//           res.status(200).json({ message: 'OTP validated successfully' });
//       } else {
//           // OTP code is invalid
//           res.status(400).json({ message: 'Invalid OTP' });
//       }
//   });
// });



app.listen(3000);


/* -----------------------------Sahil's code for API -----------------------------------------*/



