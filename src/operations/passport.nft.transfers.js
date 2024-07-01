console.clear
const args = require('minimist')(process.argv.slice(2));
require('dotenv').config({ path: '.env' });
const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
const { ethers } = require("ethers");

const {
    encodeImageHash,
    addressOf,
    encodeMetaTransactionsData,
    walletMultiSign,
    createERC721SignedTx
} = require('./utils/passportUtils')
const config = require('../config/config');
const ethHandler = require("../services/eth.handler");

const provider = new ethers.providers.JsonRpcProvider(config.internalImxConfig.rpcProvider);
const owner = new ethers.Wallet(config.internalImxConfig.defaultAccount.privateKey, provider);
const executor = new ethers.Wallet(config.internalImxConfig.executorAccount.privateKey, provider);
const acc1 = new ethers.Wallet(config.internalImxConfig.anotherAccount.privateKey, provider);

const TOTAL_TXS = args['txs'] || 10;

createERC721SignedTx(TOTAL_TXS).then(async (tx) => {
    const txs = await ethHandler.sendBatchTransactionRequest([tx]);
    console.log(`${TOTAL_TXS} Passport NFT transfers written to the blockchain having block numbers [${txs.map(tx => +tx.blockNumber).join(', ')}]`);
})