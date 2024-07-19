import mongoose, { Schema, models } from "mongoose";

const addressSchema = new Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    privateKey: {
      type: String,
      required: true,
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

export default Address;