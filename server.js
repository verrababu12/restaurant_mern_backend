const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("./models/userModel");
const Product = require("./models/productModel");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.listen(3001, () => {
  console.log(`Server Running at http://localhost:3001`);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Mongodb Connected"))
  .catch((err) => console.log(err));

//Auth Middleware

const protect = async (req, res, next) => {
  let token = req.headers.authorization;
  if (token) {
    try {
      const decoded = jwt.verify(
        token.split(" ")[1],
        process.env.JWT_SECRET_TOKEN
      );
      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized" });
    }
  } else {
    res.status(401).json({ message: "No token, not authorized" });
  }
};

//Admin Secured Check

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as admin" });
  }
};

//Product APIs

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
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.json({
      success: true,
      restaurant,
      food_items: restaurant.food_items,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error ", error });
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

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
};

const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  await product.deleteOne();
  res.json({ message: "Product deleted" });
};

const getProducts = async (req, res) => {
  try {
    const { sort, page = 1, limit = 6 } = req.query;
    let sortOrder = sort === "asc" ? 1 : -1;

    const pageNumber = parseInt(page);
    const itemsPerPage = parseInt(limit);

    const totalItems = await Product.countDocuments(); // Get total items count
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const restaurants = await Product.find()
      .sort({ rating: sortOrder })
      .skip((pageNumber - 1) * itemsPerPage)
      .limit(itemsPerPage);

    res.json({
      success: true,
      restaurants,
      totalPages,
      currentPage: pageNumber,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// const getProducts = async (req, res) => {
//   try {
//     const { sort } = req.query;
//     let sortOrder = sort === "asc" ? 1 : -1;
//     const restaurants = await Product.find().sort({ rating: sortOrder });
//     res.json({
//       success: true,
//       restaurants,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "server Error ", error });
//   }
// };

//User APIs

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    //  Validate password BEFORE hashing
    const tempUser = new User({ name, email, password, role: role || "user" });
    const validationError = tempUser.validateSync();
    if (validationError) {
      const errors = Object.values(validationError.errors).map(
        (err) => err.message
      );
      return res.status(400).json({ errors });
    }

    // ✅ Now hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create user and save
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ errors });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET_TOKEN,
      { expiresIn: "30d" }
    );

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

const getUsers = async (req, res) => {
  const users = await User.find({});
  res.json(users);
};

const updateUserToAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "User is already an admin" });
    }

    if (req.user._id.toString() === user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You cannot update your own role" });
    }

    user.role = "admin";
    await user.save();

    res.json({ message: `${user.name} is now an admin` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

app.post("/api/add-products", addProducts);
app.post("/api/only-admin", protect, admin, createProduct);
app.put("/api/:id", protect, admin, updateProduct);
app.delete("/api/:id", protect, admin, deleteProduct);
app.get("/api/products", getProducts);
app.get("/api/products/:restaurant_id", getProductsById);

app.post("/api/register", registerUser);
app.post("/api/login", loginUser);
app.get("/api/users", protect, admin, getUsers);
app.put("/api/users/:id/make-admin", protect, admin, updateUserToAdmin);
