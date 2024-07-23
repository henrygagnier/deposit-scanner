const { Web3 } = require("web3");
const abi = require("../ABIs/erc20.json");
const Address = require("../../models/address");

async function resetProviderAndResubscribe(
  web3,
  abi,
  ethWsUrl,
  contractAddress,
  coin
) {
  
  web3.setProvider(
    new Web3.providers.WebsocketProvider(
      ethWsUrl
    )
  );
  console.info(
    `ReConnected to ${ethWsUrl}`
  );

  const blockNumber = await web3.eth.getBlockNumber();
  // Initialize contract
  let contractInstance;
  try {
    contractInstance = new web3.eth.Contract(abi, contractAddress);
  } catch (error) {
    console.error(`Error initializing contract: ${error}`);
    return;
  }

      console.info(
        `${ethWsUrl}:=> ReSubscribing to event on block ${blockNumber}`
      );
      try {
        await subscribeToContractEvents(
          contractInstance,
          coin
        );
      } catch (error) {
        console.error(
          `Error subscribing to event: ${error}`
        );
      }
    }

async function listenEthereumEvents(cc, ca, coin) {
  const ethWsUrl = cc.wssUrl;
  const contractAddress = ca;

  let web3;
  try {
    web3 = new Web3(
      new Web3.providers.WebsocketProvider(ethWsUrl),
      {},
      {
        delay: 500,
        autoReconnect: true,
        maxAttempts: 10,
      }
    );
    console.info(`Connected to ${ethWsUrl} node: ${ethWsUrl}`);
  } catch (error) {
    console.error(`Error connecting to Ethereum node: ${error}`);
    return;
  }

  let pingInterval;
  function startWebsocketPingInterval(coin) {
    pingInterval = setInterval(async () => {
      try {
        await web3.eth.getBlockNumber();
        console.info(
          `${ethWsUrl}:=> Websocket connection alive (ping successful)`
        );
      } catch (error) {
        console.warn(
          `Ping failed, connection might be inactive, ${error}`
        );
        await resetProviderAndResubscribe(
          web3,
          abi,
          ethWsUrl,
          contractAddress,
          coin
        );
      }
    }, 5000);
  }

  startWebsocketPingInterval(coin);

  const blockNumber = await web3.eth.getBlockNumber();

      console.info(
        `${ethWsUrl}:=> Subscribing to event on block ${blockNumber}`
      );

      try {
        await subscribeToContractEvents(
          new web3.eth.Contract(abi, contractAddress),
          coin
        );
      } catch (error) {
        console.error(
          `Error subscribing to event: ${error}`
        );
      }

  web3.currentProvider.on("error", async (error) => {
    console.error(`Websocket Error: ${error}`);
    cleanup();
    startWebsocketPingInterval(coin);
  });

  web3.currentProvider.on("end", async (error) => {
    console.error(`Websocket connection ended: ${error}`);
    cleanup();
    startWebsocketPingInterval(coin);
  });

  process.stdin.resume();

  function cleanup() {
    clearInterval(pingInterval);
  }

  process.on("exit", cleanup);
  process.on("SIGINT", cleanup);
  process.on("SIGUSR1", cleanup);
  process.on("SIGUSR2", cleanup);
}

const subscribeToContractEvents = async (contract, coin) => {
    const subscription = contract.events.Transfer();
    subscription.on("data", async (event) => {
        console.log(`${coin.code} transfer found`)

        const toAddress = event.returnValues.to;
        try {
          const addressDoc = await Address.findOne({ address: toAddress })
            .populate("userId")
            .exec();

          if (addressDoc) {
            transactionSummaries[coinCode][chainId].deposits++;
            console.log(`${coin.code} deposited to ${addressDoc.userId}`);
          }

          //createUptimeIfElapsed();
        } catch (error) {
          console.error(`Error depositing ${coin.code}`, error);
        }
    });
}

module.exports = listenEthereumEvents;
