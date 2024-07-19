const { WebSocketProvider, Web3 } = require("web3");
const Address = require("../models/address");
const abi = require("./ABIs/erc20.json");
const connectMongoDB = require("../lib/mongodb");
const express = require("express");
const path = require("path");

const web3 = new Web3(
  new WebSocketProvider("wss://ethereum-rpc.publicnode.com")
);

const mongoose = require("mongoose");
const { Schema, models } = mongoose;

const uptimeSchema = new Schema({}, { timestamps: true });
const Uptime = models.Uptime || mongoose.model("Uptime", uptimeSchema);

const updateInterval = 60000;
var lastUptime = new Date() - updateInterval;

const createUptimeIfElapsed = async () => {
  if (new Date() - updateInterval >= lastUptime) {
    lastUptime = new Date();
    try {
      const lastUptime = await Uptime.findOne().sort({ createdAt: -1 });

      if (
        !lastUptime ||
        Date.now() - new Date(lastUptime.createdAt).getTime() > updateInterval
      ) {
        const newUptime = new Uptime();
        await newUptime.save();
        console.log("New uptime object created");
      }
    } catch (error) {
      console.error("Error creating uptime object:", error);
    }
  }
};

async function subscribeToTransfers() {
  const contract = new web3.eth.Contract(
    abi,
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  );

  const subscription = contract.events.Transfer();

  subscription.on("data", async (event) => {
    console.log("Tokens transferred");

    const toAddress = event.returnValues.to;

    try {
      const addressDoc = await Address.findOne({ address: toAddress })
        .populate("userId")
        .exec();

      if (addressDoc) {
        console.log(`User: ${addressDoc.userId}`);
      }

      createUptimeIfElapsed();
    } catch (error) {
      console.error("Error processing event:", error);
    }
  });

  subscription.on("error", (error) => {
    console.error("Subscription error:", error);
  });
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const startServer = async () => {
  await connectMongoDB();
  subscribeToTransfers();
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

startServer();