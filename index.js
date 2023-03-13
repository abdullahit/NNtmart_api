

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

// Combined GET method for multiple queries for  Home Screen
app.get("/data", (req, res) => {
  // Get the requested query from the query parameter
  const query = req.query.q;

  if (!query) {
    return res.status(400).send('At least one query is required.');
  }

  // Execute the requested query using the MySQL connection
  con.query(`SELECT * FROM ${query}`, (error, result) => {
    if (error) {
      res.send(error);
    } else {
      res.send(result);
    }
  });
});

//For Home Screen
// app.get('/cart-summary/:userId', (req, resp) => {
//   const { userId } = req.params;
//   const sql = `
//     SELECT SUM(cart.quantity) AS totalQuantity, SUM(products.price * cart.quantity) AS totalAmount
//     FROM cart
//     JOIN products ON cart.product_id = products.id
//     WHERE cart.user_id = ${userId}
//   `;
//   db.query(sql, (error, result) => {
//     if (error) {
//       resp.status(500).send('Error calculating cart summary');
//     } else {
//       const { totalQuantity, totalAmount } = result[0];
//       resp.send(`Total products in cart: ${totalQuantity}, Total amount: $${totalAmount.toFixed(2)}`);
//     }
//   });
// });

app.get("/basketItem-summary/:userId",(req,res)=>{
})



//For CatogeryProduct Screen
// app.get("/category-product", (req, resp) => {
//   //Get the categorId from the query params
//   const categoryId = req.query.categorId;

//   // fetch the products and category name from the database
//   con.query('SELECT product.name AS product_name,product.image AS product_image, product.availableqty AS product_availableqty, product.price AS product_price, product.mrp AS product_mrp, product.discount AS product_discount, categories.name AS category_name FROM product JOIN categories ON product.category_id = categories.id WHERE categories.id = ?', [categoryId], (error, result, fields) => {
//     if (error) throw error;

//     // return the products as a JSON response
//     resp.json(result);
//   })
// });

//For CatogeryProduct Screen
app.get("/category-product", (req, res) => {
  //Get the categoryId from the query params
  const categoryId = req.query.categoryId;

  // fetch the products and category name from the database
  con.query('SELECT product.name AS product_name, product.image AS product_image, product.availableqty AS product_availableqty, product.price AS product_price, product.mrp AS product_mrp, product.discount AS product_discount, category.name AS category_name FROM product JOIN category ON product.category_id = category.id WHERE category.id = ?', [categoryId], (error, result, fields) => {
    if (error) throw error;

    // Extract the category name from the result
    const category_name = result.length > 0 ? result[0].category_name : null;

    // Return the products and category name as a JSON response
    res.json({ products: result, category_name });
  })
});


//For filter on category-product screen
app.get("/filter/product", (req, res) => {
  const minPrice = req.query.minPrice;
  const maxPrice = req.query.maxPrice;
  const brand = req.query.brand;
  const discount = req.query.discount;

  const query = `SELECT * FROM product WHERE price BETWEEN ? AND ? AND brand = ? AND discount = ?`;

  const params = [minPrice, maxPrice, brand, discount];

  con.query(query, params, (error, result, fields) => {
    if (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    } else {
      res.json(result);
    }

  });

});

//For ProductDetails Screen
app.get("/product/:productId", async (req, res) => {
  const productId = req.params.productId;

  con.query("SELECT p.*, u.unitMaster FROM product p JOIN unitMaster u ON p.unitMaster_id = u.unitMaster_id WHERE p.productId = ?", [productId], (error, result, fields) => {
    if (error) throw error;
    res.send(result);
  });
});


//For RecentlyViewed  list in ProductDetails Screen
app.post('/recently-viewed', (req, res) => {
  const userId = req.body.user_id;
  const productId = req.body.product_id;

  con.query('INSERT INTO recently_viewed (user_id, product_id) VALUES (?, ?)', [userId, productId], (error, result, fields) => {
    if (error) throw error;
    res.status(200).send('Recently viewed product added successfully');
  });
});

app.get('/recently-viewed/:userId', (req, res) => {
  const userId = req.params.userId;

  con.query('SELECT product.* FROM recently_viewed JOIN product ON recently_viewed.product_id = product.id WHERE recently_viewed.user_id = ? ORDER BY recently_viewed.id DESC LIMIT 10', [userId], (error, result, fields) => {
    if (error) throw error;
    res.json(result);
  });
});



//For Search Screen
app.get("/search", async (req, res) => {
  const keyword = req.query.q;

  con.query("SELECT * FROM product WHERE name LIKE ?", [`%${keyword}%`], (error, result, fields) => {
    if (error) throw error;
    res.send(result);
  });
});

//For SearchResult Screen


//For ADD-TO-Basket
app.post('/add-to-cart/:userId', (req, res) => {
  const { userId } = req.params;
  const productId = req.body;
  const itemQty = 1;
  const sql = `INSERT INTO basketItem (user_id, product_id, itemQty) VALUES (${userId}, ${productId}, ${itemQty})`;
  db.query(sql, (error, result) => {
    if (error) {
      res.status(500).send('Error adding to basketItem');
    } else {
      res.send('Added to basketItem');
    }
  });
}); 


//For IncreasingQty
app.post('/increase-quantity/:userId/:productId', (req, res) => {
  const { userId, productId } = req.params;
  const sql = `UPDATE basketItem SET itemQty = itemQty + 1 WHERE user_id = ${userId} AND product_id = ${productId}`;
  db.query(sql, (error, result) => {
    if (error) {
      res.status(500).send('Error increasing quantity');
    } else {
      res.send('Quantity increased');
    }
  });
});

//For DecreasingQty
// app.post('/decrease-quantity/:userId/:productId', (req, resp) => {
//   const { userId, productId } = req.params;
//   const sql = `UPDATE cart SET itemQty = itemQty - 1 WHERE user_id = ${userId} AND product_id = ${productId} AND itemQty > 1`;
//   db.query(sql, (error, result) => {
//     if (error) {
//       resp.status(500).send('Error decreasing quantity');
//     } else if (result.affectedRows === 0) {
//       resp.status(400).send('Quantity cannot be less than 1');
//     } else {
//       resp.send('Quantity decreased');
//     }
//   });
// });

//For DecreasingQty
app.post('/decrease-quantity/:userId/:productId', (req, res) => {
  const { userId, productId } = req.params;
  const sql = `SELECT itemQty FROM basketItem WHERE user_id = ${userId} AND product_id = ${productId}`;
  db.query(sql, (error, result) => {
    if (error) {
      res.status(500).send('Error getting quantity');
    } else if (result.length === 0) {
      res.status(400).send('Product not found in basketItem');
    } else {
      const itemQty = result[0].itemQty;
      if (itemQty === 1) {
        const deleteSql = `DELETE FROM basketItem WHERE user_id = ${userId} AND product_id = ${productId}`;
        db.query(deleteSql, (error, result) => {
          if (error) {
            res.status(500).send('Error removing from basketItem');
          } else {
            res.send('Product removed from basketItem');
          }
        });
      } else {
        const updateSql = `UPDATE basketItem SET itemQty = itemQty - 1 WHERE user_id = ${userId} AND product_id = ${productId}`;
        db.query(updateSql, (error, result) => {
          if (error) {
            res.status(500).send('Error decreasing quantity');
          } else {
            res.send('Quantity decreased');
          }
        });
      }
    }
  });
});





app.listen(30001, ()={
console.log('server Listen On Port No: 30001');
});





