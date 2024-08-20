import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { TEST_ACCOUNTS } from "./testaccounts";

const config: HardhatUserConfig = {
  solidity: {
    // version: "0.8.17",
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 0
          }
        }
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 0
          }
        }
      },
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 0
          }
        }
      }
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 100000
      }
    }
  },

  networks: {
    hardhat: {
      accounts: TEST_ACCOUNTS.map((privateKey, i) => ({
        privateKey,
        balance: "1000000000000000000000",
      })),
      mining: {
        auto: true,
        interval: 3000,
      },
    },
    dev: {
      url: "http://0.0.0.0:8545",
      accounts: TEST_ACCOUNTS
    },
    imx: {
      url: "http://35.208.68.173:8555",
      accounts: TEST_ACCOUNTS
    },
    imxd: {
      url: "http://44.215.105.45:8545",
      accounts: TEST_ACCOUNTS
    }
  }
};



export default config;
