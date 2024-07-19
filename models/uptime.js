const mongoose = require("mongoose");
const { Schema, models } = mongoose;

const uptimeSchema = new Schema(
  { timestamps: true }
);

const Uptime = models.Uptime || mongoose.model("Uptime", uptimeSchema);

module.exports = Uptime;
