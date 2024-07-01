console.clear();
const args = require('minimist')(process.argv.slice(2));
require('dotenv').config({ path: '.env' });
const { createERC20SignedTx } = require('./utils/passportUtils')
const ethHandler = require("../services/eth.handler");

const TOTAL_TXS = args['txs'] || 10;

createERC20SignedTx(TOTAL_TXS).then(async (tx) => {
    const txs = await ethHandler.sendBatchTransactionRequest([tx]);
    console.log(`${TOTAL_TXS} passport transfers written to the blockchain having block numbers [${txs.map(tx => +tx.blockNumber).join(', ')}]`);
})