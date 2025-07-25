const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();


app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.error("MongoDB connection error:", err));


require('./model/users');
require('./model/seller');
require('./model/product');
require('./model/order');
require('./model/delivery');
require('./model/cart');   


app.get("/", (req, res) => {
  res.send("API is working");
});

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);  

const sellerRoutes = require('./routes/sellerRoutes');
app.use('/api/sellers', sellerRoutes);

const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);

const deliveryRoutes = require('./routes/deliveryRoutes');
app.use('/api/deliveries', deliveryRoutes);

const cartRoutes = require('./routes/cartRoutes');  
app.use('/api/cart', cartRoutes);                   


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

