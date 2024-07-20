const name = "dakEX";

const nullAddress = "0x0000000000000000000000000000000000000000";

const testnetMode = false;

const testnetCoins = {
  coins: [
    {
      name: "Fantom",
      code: "FTM",
      logo: "https://crypto-central.io/library/uploads/fantom-ftm-logo.png",
      chains: [
        {
          chainName: "fantom",
          contractAddress: "0x0000000000000000000000000000000000000000",
        },
      ],
    },
    {
      name: "Arbitrum",
      code: "ARB",
      logo: "https://th.bing.com/th/id/R.0d9388ff20a360b06fe4f08b71f0eda2?rik=98sorNeliK4ZGw&pid=ImgRaw&r=0",
      chains: [
        {
          chainName: "arbitrum",
          contractAddress: "0x4B3fe282BF458B26930E9bA33184023023B32F9e",
        },
      ],
    },
    {
      name: "Tether USD",
      code: "USDT",
      logo: "https://www.worldcryptoindex.com/wp-content/uploads/2018/01/usdt-logo-300.png",
      chains: [
        {
          chainName: "arbitrum",
          contractAddress: "0xc6863C4475E215F0A18Fafa90134A5eC55FE6C4A",
        },
      ],
    },
  ],
};

const coins = testnetMode
  ? testnetCoins
  : {
      coins: [
        {
          name: "Fantom",
          code: "FTM",
          logo: "https://crypto-central.io/library/uploads/fantom-ftm-logo.png",
          chains: [
            {
              chainName: "fantom",
              contractAddress: "0x0000000000000000000000000000000000000000",
            },
          ],
        },
        {
          name: "Arbitrum",
          code: "ARB",
          logo: "https://th.bing.com/th/id/R.0d9388ff20a360b06fe4f08b71f0eda2?rik=98sorNeliK4ZGw&pid=ImgRaw&r=0",
          chains: [
            {
              chainName: "arbitrum",
              contractAddress: "0x912CE59144191C1204E64559FE8253a0e49E6548",
            },
          ],
        },
        {
          name: "Tether USD",
          code: "USDT",
          logo: "https://www.worldcryptoindex.com/wp-content/uploads/2018/01/usdt-logo-300.png",
          chains: [
            {
              chainName: "arbitrum",
              contractAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
            },
          ],
        },
      ],
    };

const testnetChains = {
  arbitrum: {
    chainId: 421614,
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    wssUrl: "wss://sepolia-rollup.arbitrum.io/feed",
  },
  fantom: {
    chainId: 4002,
    rpcUrl: "https://rpc.testnet.fantom.network",
    wssUrl: "wss://fantom-testnet-rpc.publicnode.com",
  },
};

const chains = testnetMode
  ? testnetChains
  : {
      arbitrum: {
        chainId: 42161,
        rpcUrl: "https://arb1.arbitrum.io/rpc",
        wssUrl: "wss://arbitrum-one-rpc.publicnode.com",
      },
      fantom: {
        chainId: 250,
        rpcUrl: "https://rpcapi.fantom.network",
        wssUrl: "wss://fantom-rpc.publicnode.com",
      },
    };

module.exports = {
  name,
  nullAddress,
  testnetMode,
  coins,
  chains,
};