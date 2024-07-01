const config = require("../../config/config");
const ethHandler = require("../../services/eth.handler");
const { Web3, eth } = require('web3');

async function buildEOATransferTxs(nonce, numberOfTxsToWrite) {
    const pvKey = config.internalImxConfig.defaultAccount.privateKey;
    const destination = config.internalImxConfig.accountDummy.publicAddress;
    const txs = await ethHandler.batchCreateEOATransfer(pvKey, 0.1, destination, +nonce.toString(), numberOfTxsToWrite);
    return txs;
}

module.exports = {
    buildEOATransferTxs
};
