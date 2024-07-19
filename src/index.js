const { WebSocketProvider, Web3 } = require("web3");
const Address = require("../models/address");
const abi = require("./ABIs/erc20.json");
const connectMongoDB = require("../lib/mongodb");
const express = require("express");
const path = require("path");

const web3 = new Web3(
  new WebSocketProvider("wss://ethereum-rpc.publicnode.com")
);

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
      await connectMongoDB();
      const addressDoc = await Address.findOne({ address: toAddress })
        .populate("userId")
        .exec();

      if (addressDoc) {
        console.log(`User: ${addressDoc.userId}`);
      }
    } catch (error) {
      console.error("Error processing event:", error);
    }
  });

  subscription.on("error", (error) => {
    console.error("Subscription error:", error);
  });
}

subscribeToTransfers();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});