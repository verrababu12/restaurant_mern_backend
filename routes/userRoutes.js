const express = require("express");
const {
  registerUser,
  loginUser,
  getUsers,
  updateUserToAdmin,
} = require("../controllers/userController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", protect, admin, getUsers);
router.put("/:id/make-admin", protect, admin, updateUserToAdmin);

module.exports = router;
