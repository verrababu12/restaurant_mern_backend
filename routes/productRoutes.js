const express = require("express");
const {
  addProducts,
  getProductsById,
  createProduct,
  updateProduct,
  deleteProduct,
  allProductsToAdmin,
  getProducts,
} = require("../controllers/productController");

const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add-products", addProducts);
router.post("/only-admin", protect, admin, createProduct);
router.put("/:id", protect, admin, updateProduct);
router.delete("/:id", protect, admin, deleteProduct);
router.get("/", getProducts);
router.get("/:restaurant_id", getProductsById);
router.get("/allProductsToAdmin", allProductsToAdmin);

module.exports = router;
