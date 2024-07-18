const mongoose = require("mongoose");
const { Schema, models } = mongoose;

const addressSchema = new Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Address = models.Address || mongoose.model("Address", addressSchema);

module.exports = Address;
