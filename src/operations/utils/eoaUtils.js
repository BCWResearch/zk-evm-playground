const config = require("../../config/config");
const ethHandler = require("../../services/eth.handler");
const { Web3, eth } = require('web3');

async function buildEOATransferTxs(nonce, numberOfTxsToWrite) {
    const pvKey = config.internalImxConfig.defaultAccount.privateKey;
    const destination = config.internalImxConfig.accountDummy.publicAddress;
    const txs = await ethHandler.batchCreateEOATransfer(pvKey, 0.1, destination, +nonce.toString(), numberOfTxsToWrite);
    return txs;
}

async function __buildEOATransferTxs(nonce, numberOfTxsToWrite) {
    const web3 = new Web3(config.internalImxConfig.rpcProvider);
    const pvKey1 = config.internalImxConfig.defaultAccount.privateKey;
    const destination1 = web3.eth.accounts.privateKeyToAccount(pvKey1).address;

    const pvKey2 = config.internalImxConfig.defaultAccount.privateKey2;
    const destination2 = web3.eth.accounts.privateKeyToAccount(pvKey2).address

    const pvKey3 = config.internalImxConfig.defaultAccount.privateKey3;
    const destination3 = web3.eth.accounts.privateKeyToAccount(pvKey3).address

    const pvKey4 = config.internalImxConfig.defaultAccount.privateKey4;
    const destination4 = web3.eth.accounts.privateKeyToAccount(pvKey4).address
    
    
    // const nonce = +(await web3.eth.getTransactionCount(destination1)).toString();
    const nonce2 = +(await web3.eth.getTransactionCount(destination2)).toString();
    const nonce3 = +(await web3.eth.getTransactionCount(destination3)).toString();
    const nonce4 = +(await web3.eth.getTransactionCount(destination4)).toString();

    const splitNumber = Math.ceil(numberOfTxsToWrite / 4);
    const txs1 = await ethHandler.batchCreateEOATransfer(pvKey1, 0.1, destination2, +nonce.toString(), splitNumber);
    const txs2 = await ethHandler.batchCreateEOATransfer(pvKey2, 0.1, destination1, +nonce2.toString(), splitNumber);
    const txs3 = await ethHandler.batchCreateEOATransfer(pvKey3, 0.1, destination4, +nonce3.toString(), splitNumber);
    const txs4 = await ethHandler.batchCreateEOATransfer(pvKey4, 0.1, destination3, +nonce4.toString(), splitNumber);

    const txs = [];
    for (let i = 0; i < splitNumber; i++) {
        txs.push(txs1[i]);
        txs.push(txs2[i]);
        txs.push(txs3[i]);
        txs.push(txs4[i]);
    }
    
    return txs;
}

module.exports = {
    buildEOATransferTxs
};
