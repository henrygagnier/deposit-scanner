const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config()

const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
  } catch (error) {
    console.log("Error connecting to DB", error);
  }
};

module.exports = connectMongoDB;