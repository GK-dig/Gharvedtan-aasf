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

app.get("/", (req, res) => {
  res.send("API is working");
});

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);  

const sellerRoutes = require('./routes/sellerRoutes');
app.use('/api/sellers', sellerRoutes);

const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

