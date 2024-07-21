const { WebSocketProvider, Web3 } = require("web3");
const Address = require("../models/address");
const Uptime = require("../models/uptime");
const abi = require("./ABIs/erc20.json");
const connectMongoDB = require("../lib/mongodb");
const express = require("express");
const {
  coins,
  chains,
  testnetMode,
  nullAddress,
  wssOptions,
} = require("./config/config");

const updateInterval = 300 * 1000;
var lastUptime = new Date() - updateInterval;
const summaryInterval = 10000;

const transactionSummaries = {};
const subscriptionStatuses = {};

function getContractAddress(chainName, coinName) {
  const coinsList = coins.coins;

  for (const coin of coinsList) {
    if (coin.name === coinName) {
      for (const chain of coin.chains) {
        if (chain.chainName === chainName) {
          return chain.contractAddress;
        }
      }
    }
  }
}

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
        console.log(
          `Testnet Mode: ${testnetMode ? "ON" : "OFF"} | Uptime Updated`
        );
      }
    } catch (error) {
      console.error(
        `Testnet Mode: ${testnetMode ? "ON" : "OFF"} | Uptime Not Updated:`,
        error
      );
    }
  }
};

async function subscribeToNativeTransfers(chainName, chainConfig, coin) {
  const web3 = new Web3(new WebSocketProvider(chainConfig.wssUrl), wssOptions);
  const coinCode = coin.code;
  const chainId = chainConfig.chainId;

  if (!transactionSummaries[coinCode]) {
    transactionSummaries[coinCode] = {};
  }

  if (!transactionSummaries[coinCode][chainId]) {
    transactionSummaries[coinCode][chainId] = {
      transactions: new Set(),
      deposits: 0,
    };
  }

  if (!subscriptionStatuses[coinCode]) {
    subscriptionStatuses[coinCode] = {};
  }

  if (!subscriptionStatuses[coinCode][chainId]) {
    subscriptionStatuses[coinCode][chainId] = {
      status: "Pending",
      error: null,
    };
  }

  try {
    const subscription = await web3.eth.subscribe("newBlockHeaders");

    subscription.on("data", async (blockHeader) => {
      const block = await web3.eth.getBlock(blockHeader.number, true);
      if (block.transactions) {
        block.transactions.forEach(async (tx) => {
          if (tx.value !== 0) {
            transactionSummaries[coinCode][chainId].transactions.add(tx.hash);

            try {
              const addressDoc = await Address.findOne({ address: tx.to })
                .populate("userId")
                .exec();

              if (addressDoc) {
                transactionSummaries[coinCode][chainId].deposits++;
                console.log(`${coin.code} deposited to ${addressDoc.userId}`);
              }

              createUptimeIfElapsed();
            } catch (error) {
              console.error(`Error depositing ${coin.code}`, error);
            }
          }
        });
      }
    }).on("connected", () => {
      subscriptionStatuses[coinCode][chainId].status = "Connected";
      subscriptionStatuses[coinCode][chainId].error = null;
    }).on("error", (error) => {
      subscriptionStatuses[coinCode][chainId].status = "Error";
      subscriptionStatuses[coinCode][chainId].error = error.message;
    });
  } catch (error) {
    subscriptionStatuses[coinCode][chainId].status = "Error";
    subscriptionStatuses[coinCode][chainId].error = error.message;
  }
}

async function subscribeToTransfers(chainName, chainConfig, coin) {
  const web3 = new Web3(new WebSocketProvider(chainConfig.wssUrl), wssOptions);
  const contract = new web3.eth.Contract(
    abi,
    getContractAddress(chainName, coin.name)
  );
  const coinCode = coin.code;
  const chainId = chainConfig.chainId;

  if (!transactionSummaries[coinCode]) {
    transactionSummaries[coinCode] = {};
  }

  if (!transactionSummaries[coinCode][chainId]) {
    transactionSummaries[coinCode][chainId] = {
      transactions: new Set(),
      deposits: 0,
    };
  }

  if (!subscriptionStatuses[coinCode]) {
    subscriptionStatuses[coinCode] = {};
  }

  if (!subscriptionStatuses[coinCode][chainId]) {
    subscriptionStatuses[coinCode][chainId] = {
      status: "Pending",
      error: null,
    };
  }

  try {
    const subscription = contract.events.Transfer();

    subscription.on("data", async (event) => {
      const toAddress = event.returnValues.to;
      transactionSummaries[coinCode][chainId].transactions.add(
        event.transactionHash
      );

      try {
        const addressDoc = await Address.findOne({ address: toAddress })
          .populate("userId")
          .exec();

        if (addressDoc) {
          transactionSummaries[coinCode][chainId].deposits++;
          console.log(`${coin.code} deposited to ${addressDoc.userId}`);
        }

        createUptimeIfElapsed();
      } catch (error) {
        console.error(`Error depositing ${coin.code}`, error);
      }
    }).on("connected", () => {
      subscriptionStatuses[coinCode][chainId].status = "Connected";
      subscriptionStatuses[coinCode][chainId].error = null;
    }).on("error", (error) => {
      subscriptionStatuses[coinCode][chainId].status = "Error";
      subscriptionStatuses[coinCode][chainId].error = error.message;
    });
  } catch (error) {
    subscriptionStatuses[coinCode][chainId].status = "Error";
    subscriptionStatuses[coinCode][chainId].error = error.message;
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
  res.json(subscriptionStatuses);
});

const startServer = async () => {
  await connectMongoDB();

  coins.coins.forEach((coin) => {
    coin.chains.forEach((chain) => {
      const chainConfig = chains[chain.chainName.toLowerCase()];
      if (chainConfig) {
        if (chain.contractAddress !== nullAddress) {
          subscribeToTransfers(chain.chainName, chainConfig, coin);
          console.log(
            `Subscribed to ${coin.code} transfers on ${chain.chainName}`
          );
        } else {
          subscribeToNativeTransfers(chain.chainName, chainConfig, coin);
          console.log(
            `Subscribed to ${coin.code} transfers on ${chain.chainName}`
          );
        }
      } else {
        console.error(`No configuration found for chain: ${chain.chainName}`);
      }
    });
  });

  setInterval(() => {
    for (const [coinCode, chainSummaries] of Object.entries(
      transactionSummaries
    )) {
      for (const [chainId, summary] of Object.entries(chainSummaries)) {
        console.log(
          `${coinCode} / ${chainId}: ${summary.transactions.size} txs | ${summary.deposits} deposits`
        );
        summary.transactions.clear();
        summary.deposits = 0;
      }
    }
  }, summaryInterval);

  app.listen(PORT, () => {
    console.log(`Server started: http://localhost:${PORT}`);
  });
};

startServer();