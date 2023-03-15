const con = require("./config");
const express = require('express');
const bodyparser = require('body-parser');

const app = express();


app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));



// (2) Combined GET method For Image Slider Table , Category Table
// http://localhost:4000/data?q=imageslider
// http://localhost:4000/data?q=category
app.get("/data", (req, resp) => {
  // Get the requested query from the query parameter
  const query = req.query.q;

  if (!query) {
    return resp.status(400).send('At least one query is required.');
  }

  // Execute the requested query using the MySQL connection
  con.query(`SELECT * FROM ${query}`, (error, result) => {
    if (error) {
      resp.send(error);
    } else {
      resp.send(result);
    }
  });
});

// (3) For EverydayEssential 
app.get('/everyday-essentials', (req, res) => {
  // Get all the products from the EverydayEssential table
  const sql = 'SELECT * FROM EverydayEssential';
  con.query(sql, (error, result, fields) => {
    if (error) {
      res.status(500).send('Error retrieving everyday essentials');
    } else {
      // For each product in the result, fetch the corresponding details from the product and unit tables
      const products = result.map((product) => {
        return new Promise((resolve, reject) => {
          const productSql = 'SELECT name, price, discount, discountType, image, unit_id FROM product WHERE id = ?';
          con.query(productSql, [product.productId], (error, productResult, fields) => {
            if (error) {
              reject('Error retrieving product details');
            } else {
              const unitSql = 'SELECT name FROM unit WHERE id = ?';
              con.query(unitSql, [productResult[0].unit_id], (error, unitResult, fields) => {
                if (error) {
                  reject('Error retrieving unit details');
                } else {
                  // Calculate the discounted price
                  let discountedPrice;
                  if (productResult[0].discountType === '%') {
                    // Calculate the discounted price if the discount is a percentage
                    discountedPrice = productResult[0].price - (productResult[0].price * productResult[0].discount / 100);
                  } else {
                    // Calculate the discount percentage if the discount is a fixed amount
                    const discountPercentage = (productResult[0].discount / productResult[0].price) * 100;
                    // Calculate the discounted price
                    discountedPrice = productResult[0].price - productResult[0].discount;
                    // Convert the discount from rupees to percentage (%)
                    productResult[0].discount = discountPercentage.toFixed(2) + '%';
                    // Set the discountType to percentage (%)
                    productResult[0].discountType = '%';
                  }
                  // Construct the product object with all the details
                  const productObject = {
                    productName: productResult[0].name,
                    productPrice: productResult[0].price,
                    productDiscount: productResult[0].discount,
                    productImage: productResult[0].image,
                    productUnit: unitResult[0].name,
                    discountType: productResult[0].discountType,
                    discountedPrice: discountedPrice.toFixed(2)
                  };
                  resolve(productObject);
                }
              });
            }
          });
        });
      });
      // Wait for all the promises to resolve and return the products array
      Promise.all(products).then((products) => {
        res.json({ totalProducts: products.length, products });
      }).catch((error) => {
        res.status(500).send(error);
      });
    }
  });
});

// (4) BrandMaster (GET all brands and total number of brands)
//http://localhost:4000/brands
app.get('/brands', (req, res) => {
  const getAllBrandsQuery = 'SELECT name, image FROM brandmaster';
  const getCountQuery = 'SELECT COUNT(*) AS count FROM brandmaster';

  con.query(getAllBrandsQuery, (err, results) => {
    if (err) throw err;

    con.query(getCountQuery, (err, countResults) => {
      if (err) throw err;

      const count = countResults[0].count;
      res.json({ brands: results, count });
    });
  });
});

// (6) For sendding Basket = TotalItems , TotalAmount & Totalsavings to Home Screen
//http://localhost:4000/basket/total/:userId
app.get('/basket/total/:userId', (req, resp) => {
  const { userId } = req.params;
  const sql = `SELECT COUNT(DISTINCT bi.product_id) AS totalItems,
                        SUM(bi.itemQty * p.price) AS totalAmount,
                        SUM(bi.itemQty * p.discount) AS totalDiscount,
                        SUM(bi.itemQty * p.price) - SUM(bi.quantity * p.discount) as total_price_with_discount 
                 FROM basketItem bi
                 JOIN product p ON bi.product_id = p.id
                 WHERE bi.user_id = ${userId}`;
  //  confused about this discount thing
  con.query(sql, (error, result) => {
    if (error) {
      resp.status(500).send('Error calculating basket total',error);
    } else {
      const { totalItems, totalAmount, totalDiscount } = result[0];
      const responseObj = { totalItems, totalAmount, totalDiscount };
      resp.send(responseObj);
    }
  });
});

// (7) For CatogeryProduct Screen
//http://localhost:4000/category-product?categoryId=<category_id> 
//where <category_id> is the ID of the category you want to retrieve the products for.
//example for categoryId 1:-http://localhost:4000/category-product?categoryId=1
app.get("/category-product", (req, resp) => {
  //Get the categoryId from the query params
  const categoryId = req.query.categoryId;

  // fetch the products and category name from the database
  con.query('SELECT product.name AS product_name,product.image AS product_image, product.availableqty AS product_availableqty, product.price AS product_price, product.discount AS product_discount, product.discountType AS product_discountType, categories.name AS category_name FROM product JOIN categories ON product.category_id = categories.id WHERE categories.id = ?', [categoryId], (error, result, fields) => {
    if (error) throw error;

    // Calculate the discount percentage and discounted price based on the discount type
    result.forEach((product) => {
      if (product.product_discountType === '%') {
        product.product_discountedPrice = product.product_price * (100 - product.product_discount) / 100;
        product.product_discountPercentage = product.product_discount;
      } else if (product.product_discountType === '₹') {
        const discountPercentage = (product.product_discount / product.product_price) * 100;
        product.product_discountedPrice = product.product_price - product.product_discount;
        product.product_discountPercentage = discountPercentage.toFixed(2);
      }
    });

    // Extract the category name from the result
    const category_name = result.length > 0 ? result[0].category_name : null;

    // Return the products and category name as a JSON response
    resp.json({ products: result, category_name });
  })
});

// (8) For MaxDiscount for Catogery 
app.get("/maxdiscount-product ", (req, resp) => {
  //Get the categoryId from the query params
  const categoryId = req.query.categoryId;

  // fetch the products and category name from the database
  con.query('SELECT product.name AS product_name,product.image AS product_image, product.availableqty AS product_availableqty, product.price AS product_price, product.discount AS product_discount, product.discountType AS product_discountType, categories.name AS category_name FROM product JOIN categories ON product.category_id = categories.id WHERE categories.id = ?', [categoryId], (error, result, fields) => {
    if (error) throw error;

    // Calculate the discount percentage and discounted price based on the discount type
    result.forEach((product) => {
      if (product.product_discountType === '%') {
        product.product_discountedPrice = product.product_price * (100 - product.product_discount) / 100;
        product.product_discountPercentage = product.product_discount;
      } else if (product.product_discountType === '₹') {
        const discountPercentage = (product.product_discount / product.product_price) * 100;
        product.product_discountedPrice = product.product_price - product.product_discount;
        product.product_discountPercentage = discountPercentage.toFixed(2);
      }
    });

    // Sort the products by discount in descending order and return the top 5 products
    const top5Products = result.sort((a, b) => b.product_discount - a.product_discount).slice(0, 5);

    // Extract the category name from the result
    const category_name = result.length > 0 ? result[0].category_name : null;

    // Return the top 5 products and category name as a JSON response
    resp.json({ products: top5Products, category_name });
  })
});

// (9) For filter on category-product screen
//http://localhost:4000/filter/product?minPrice=<value>&maxPrice=<value>&brand=<value>&discount=<value>
//Replace <value> with the desired value for each query parameter.
//For example:http://localhost:4000/filter/product?minPrice=10&maxPrice=50&brand=Nike&discount=10
app.get("/filter/product", (req, resp) => {
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
      resp.json(result);
    }

  });

});

// (10) For ProductDetails Screen
//http://localhost:4000/product/<productId>
app.get("/product/:productId", async (req, resp) => {
  const productId = req.params.productId;

  con.query("SELECT p.*, u.name AS unitName FROM product p JOIN unitMaster u ON p.unitId = u.id WHERE p.id = ?", [productId], (error, result, fields) => {
    if (error) throw error;
    if (result.length === 0) {
      resp.status(404).send("Product not found");
    } else {
      const product = result[0];
      const response = {
        id: product.id,
        name: product.productName,
        description: product.description,
        price: product.price,
        unit: product.unitName
      };
      resp.send(response);
    }
  });
});



// (12) For RecentlyViewed  list in ProductDetails Screen
//http://localhost:4000/recently-viewed
app.post('/recently-viewed', (req, res) => {
  const userId = req.body.user_id;
  const productId = req.body.product_id;

  con.query('INSERT INTO recently_viewed (user_id, product_id) VALUES (?, ?)', [userId, productId], (error, result, fields) => {
    if (error) throw error;
    res.status(200).send('Recently viewed product added successfully');
  });
});

//http://localhost:4000/recently-viewed/:userId
app.get('/recently-viewed/:userId', (req, res) => {
  const userId = req.params.userId;

  con.query('SELECT product.* FROM recently_viewed JOIN product ON recently_viewed.product_id = product.id WHERE recently_viewed.user_id = ? ORDER BY recently_viewed.id DESC LIMIT 10', [userId], (error, result, fields) => {
    if (error) throw error;
    res.json(result);
  });
});

// (13) For Search Suggestions
//http://localhost:4000/search?q=<keyword> ;Replace <keyword> with the actual keyword that you want to search for.
app.get("/search/suggestions", async (req, resp) => {
    const keyword = req.query.q;
  
    con.query("SELECT id, name FROM product WHERE name LIKE ?", [`%${keyword}%`], (error, result, fields) => {
      if (error) throw error;
      const productNames = result.map(product => product.name);
      resp.send(productNames);
    });
});

// Search Screen Result
app.get("/search/results", async (req, resp) => {
  const keyword = req.query.q;

  con.query(
    "SELECT * FROM product WHERE name LIKE ?",
    [`%${keyword}%`],
    (error, result, fields) => {
      if (error) throw error;

      // Add the keyword to the response object
      const responseObj = {
        keyword: keyword,
        products: result.map((product) => {
          // Determine the discount percentage
          let discountPercentage = product.discount;
          if (product.discount_type === "₹") {
            discountPercentage = ((product.discount / product.price) * 100).toFixed(2);
          }

          return {
            name: product.name,
            price: product.price,
            discount: discountPercentage,
            priceAfterDiscount: product.price - product.price * (discountPercentage / 100),
            unit: product.unit,
            image: product.image,
          };
        }),
      };

      resp.send(responseObj);
    }
  );
});


// (14) For IncreasingQty
//http://localhost:4000/increase-quantity/:userId/:productId
app.post('/increase-quantity/:userId/:productId', (req, resp) => {
  const { userId, productId } = req.params;
  const sql = `UPDATE basketItem SET itemQty = itemQty + 1, totalPrice = (SELECT price * (itemQty + 1) FROM product WHERE id = ${productId}) WHERE user_id = ${userId} AND product_id = ${productId}`;
  con.query(sql, (error, result) => {
      if (error) {
          resp.status(500).send('Error increasing quantity');
      } else {
          resp.send('Quantity increased');
      }
  });
});

//For DecreasingQty
//http://localhost:4000/decrease-quantity/:userId/:productId
app.post('/decrease-quantity/:userId/:productId', (req, resp) => {
  const { userId, productId } = req.params;
  const sql = `SELECT itemQty FROM basketItem WHERE user_id = ${userId} AND product_id = ${productId}`;
  con.query(sql, (error, result) => {
      if (error) {
          resp.status(500).send('Error getting quantity');
      } else if (result.length === 0) {
          resp.status(400).send('Product not found in basketItem');
      } else {
          const itemQty = result[0].itemQty;
          if (itemQty === 1) {
              const deleteSql = `DELETE FROM basketItem WHERE user_id = ${userId} AND product_id = ${productId}`;
              con.query(deleteSql, (error, result) => {
                  if (error) {
                      resp.status(500).send('Error removing from basketItem');
                  } else {
                      resp.send('Product removed from basketItem');
                  }
              });
          } else {
              const updateSql = `UPDATE basketItem SET itemQty = itemQty - 1, totalPrice = (SELECT price * (itemQty + 1) FROM product WHERE id = ${productId}) WHERE user_id = ${userId} AND product_id = ${productId}`;
              con.query(updateSql, (error, result) => {
                  if (error) {
                      resp.status(500).send('Error decreasing quantity');
                  } else {
                      resp.send('Quantity decreased');
                  }
              });
          }
      }
  });
});










app.listen(4000);





//(1)  login

//(2)  http://localhost:4000/data?q=imageslider
   //  http://localhost:4000/data?q=category

//(3)  http://localhost:4000/everyday-essentials

//(4)  http://localhost:4000/brands

//(5)  sub category

//(6)  http://localhost:4000/basket/total/:userId                     -> ? 

//(7)  http://localhost:4000/category-product?categoryId=<category_id>         

//(8)  http://localhost:4000/maxdiscount-product?categoryId=<categoryId>


//(9)  http://localhost:4000/filter/product?minPrice=<value>&maxPrice=<value>&brand=<value>&discount=<value>

//(10) http://localhost:4000/product/<productId>                      

//(11) product:- important details , other details

//(12) http://localhost:4000/recently-viewed
    // http://localhost:4000/recently-viewed/:userId

//(13) Search Suggestions http://localhost:4000/search/suggestions?q=<keyword>  
    // Search Screen http://localhost:4000/search/results?q=<keyword>  
    // Recent SearchHistory 

//(14) http://localhost:4000/basket/total/:userId
    // basket product table 
    // // http://localhost:4000/increase-quantity/:userId/:productId :-Increment 
       // http://localhost:4000/decrease-quantity/:userId/:productId :-Decrement
    // http://localhost:4000/recently-viewed/:userId











