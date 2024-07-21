const { Web3, WebSocketProvider } = require("web3");

const websocketUrl = "wss://fantom-testnet-rpc.publicnode.com";

let web3;
let subscription;

const startSubscription = async () => {
  subscription = await web3.eth.subscribe("newBlockHeaders", (error, result) => {
    if (error) {
      console.error("Subscription error:", error);
    } else {
      console.log("Subscription result:", result);
    }
  });

  subscription.on("data", (blockHeader) => {
    console.log(new Date(), `Block number: ${blockHeader.number}`);
  });

  subscription.on("error", (error) => {
    console.error(new Date(), "Subscription data error:", error);
  });
};

const setupWeb3 = () => {
  const provider = new WebSocketProvider(websocketUrl, {
    clientConfig: {
        maxReceivedFrameSize: 100000000,
        maxReceivedMessageSize: 100000000,
        keepalive: true,
        keepaliveInterval: 10000
    },
    reconnect: {
        auto: true,
        delay: 5000,
        maxAttempts: 30,
        onTimeout: false
    }
});

  web3 = new Web3(provider);

  provider.on("connect", () => {
    console.log(new Date(), "WebSocket connected");
    startSubscription();
  });

  provider.on("disconnect", (error) => {
    console.log(new Date(), "WebSocket disconnected:", error);
  });

  provider.on("error", (error) => {
    console.log(new Date(), "WebSocket error:", error);
  });

  provider.on("reconnect", () => {
    console.log(new Date(), "WebSocket reconnected");
    startSubscription();
  });

  provider.on("reconnectFailed", () => {
    console.log(new Date(), "WebSocket reconnection failed");
  });

  provider.on("close", (code, reason) => {
    console.log(new Date(), "WebSocket closed:", code, reason);
  });

};

setupWeb3();
console.log(new Date(), "Subscribed!");