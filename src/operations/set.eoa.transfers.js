const config = require("../config/config");
const ethHandler = require("../services/eth.handler");
const { Web3, eth } = require('web3');
const args = require('minimist')(process.argv.slice(2));
const web3 = new Web3(config.internalImxConfig.rpcProvider);

const NUMBER_OF_TXS = args['txs'] || 5;

async function buildEOATransfer(numberOfTxsToWrite) {
    const pvKey = config.internalImxConfig.defaultAccount.privateKey;
    const pvKeyAddress = web3.eth.accounts.privateKeyToAccount(pvKey).address;
    const destination = config.internalImxConfig.accountDummy.publicAddress;
    const nonce = await web3.eth.getTransactionCount(pvKeyAddress);
    const txs = await ethHandler.batchCreateEOATransfer(pvKey, 0.1, destination, +nonce.toString() + 1, numberOfTxsToWrite);
    return txs;
}

async function populateWithEOATransfer(numberOfTxsToWrite) {
    console.log(`Populating ${numberOfTxsToWrite} EOA transfer transactions...`)
    const txs = await buildEOATransfer(numberOfTxsToWrite);
    console.log(`Transactions built: ${txs.length}`);

    console.log(`Doing empty transfer to increment nonce and block num...`);
    await ethHandler.emptyTransfer(config.internalImxConfig.defaultAccount.privateKey, config.internalImxConfig.accountDummy.publicAddress);

    console.log(`Sending ${txs.length} transactions...`);
    return await Promise.all(txs.map(async tx => await ethHandler.sendTransactionRequest(tx.rawTransaction)));
}

populateWithEOATransfer(NUMBER_OF_TXS).then((txs) => {
    console.log(`EOA transfers written to the blockchain.`);
    const txsByBlock = txs.reduce((acc, tx) => {
        if (!acc[tx.blockNumber]) {
            acc[tx.blockNumber] = [];
        }
        acc[tx.blockNumber].push(tx);
        return acc;
    }, {});

    for (const blockNum in txsByBlock) {
        console.log(`Block ${+blockNum} has ${txsByBlock[blockNum].length} transactions.`);
    }
});
