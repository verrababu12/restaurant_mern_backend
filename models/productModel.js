const mongoose = require("mongoose");

const foodItemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image_url: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

// Define the Restaurant Schema
const restaurantSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true, // Title is required
  },
  description: {
    type: String,
    required: true,
  },
  image_url: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5, // Ensure rating is between 0 and 5
  },
  category: {
    type: String,
    required: true, // Example: "Andhra Cuisine", "North Indian Cuisine"
  },
  location: {
    type: String,
    required: true,
  },
  tags: {
    type: [String], // Example: ["Spicy", "Veg & Non-Veg"]
    default: [],
  },
  food_items: [foodItemsSchema],
});

// Create the Restaurant model
const Restaurant = mongoose.model("product", restaurantSchema);

module.exports = Restaurant;
