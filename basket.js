const con = require("./config");
const express = require('express');
const bodyParser = require('body-parser');

const app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



  
  // Add a product to the cart
  app.post('/basket', (req, res) => {
    const { ProductId, Quantity } = req.body;
    con.query(
      'INSERT INTO basket (ProductId, Quantity) VALUES (?, ?)',
      [ProductId, Quantity],
      (error, result, fields) => {
        if (error) throw error;
        res.send({ id: result.insertId, ProductId, Quantity });
      }
    );
  });
  
  // Get all items in the cart
  app.get('/api/cart', (req, res) => {
    connection.query(
      'SELECT cart_items.*, products.name, products.price FROM cart_items JOIN products ON cart_items.product_id = products.id',
      (error, results, fields) => {
        if (error) throw error;
        res.send(results);
      }
    );
  });
  
  // Update the quantity of an item in the cart
  app.put('/api/cart/:id', (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    connection.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ?',
      [quantity, id],
      (error, results, fields) => {
       
  




app.listen(3000, 'server listen on port 3000')