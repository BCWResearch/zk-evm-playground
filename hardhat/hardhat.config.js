require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {},
    imm: {
      url: "http://35.208.68.173:8545",
      accounts: [
        "0x6421222a9964cbe1b411191dcac1afda173ed99346c47302c6fe88f65d83583e",
        "0x1382a7ad39f49346bf890a0c5b3b8aec820cc37a06a5bd0a24dd1035f84d160c",
        "0xf8158fb8a9f37093d009cbf7392cf51c36cd49f1514f99c803f7d47ce3cb1f21"
      ]
    }
    // Configure other networks (like Rinkeby, Mainnet, etc.) here
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
