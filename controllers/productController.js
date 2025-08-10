const Product = require("../models/productModel");

const addProducts = async (req, res) => {
  try {
    const products = await Product.insertMany(req.body);
    res.status(201).json({ message: "Products added successfully", products });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding products", error: error.message });
  }
};

const getProductsById = async (req, res) => {
  try {
    const { restaurant_id } = req.params;
    const restaurant = await Product.findById(restaurant_id);
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });
    res.json({ success: true, restaurant, food_items: restaurant.food_items });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
};

const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
};

const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  await product.deleteOne();
  res.json({ message: "Product deleted" });
};

const allProductsToAdmin = async (req, res) => {
  const products = await Product.find({});
  res.json(products);
};

const getProducts = async (req, res) => {
  try {
    const { sort, page = 1, limit = 6 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let restaurants = await Product.find().skip(skip).limit(parseInt(limit));
    const totalCount = await Product.countDocuments();

    if (sort === "asc") restaurants.sort((a, b) => a.rating - b.rating);
    else if (sort === "desc") restaurants.sort((a, b) => b.rating - a.rating);

    res.json({ success: true, restaurants, totalCount });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

module.exports = {
  addProducts,
  getProductsById,
  createProduct,
  updateProduct,
  deleteProduct,
  allProductsToAdmin,
  getProducts,
};
