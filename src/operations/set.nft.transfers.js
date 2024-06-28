console.clear();
require('dotenv').config({ path: '.env' });
const config = require('../config/config');
const { ethers } = require("ethers");
const { Web3 } = require('web3');
const fs = require('fs');
const args = require('minimist')(process.argv.slice(2));
const path = require('path');
const ethHandler = require("../services/eth.handler");
const { deployNFTContract, signMintNFTWithNonce } = require("./utils/nftUtils")

const provider = new ethers.providers.JsonRpcProvider(config.internalImxConfig.rpcProvider);
const signer = new ethers.Wallet(config.internalImxConfig.defaultAccount.privateKey, provider);

const NUMBER_OF_TXS = args['txs'] || 5;
const BATCH_SIZE = args['batch'] || 10;

async function getSignerBalance() {
    const balance = await signer.getBalance();
    console.log(`Signer balance: ${balance}`);
}

async function getLatestBlock() {
    const block = await provider.getBlock('latest');
    console.log(`Latest block: ${block.number}`);
}

getLatestBlock()
    .then(getSignerBalance)
    .then(deployNFTContract)
    .then(async (contract) => {
        const totalBatch = Math.ceil(NUMBER_OF_TXS / BATCH_SIZE);
        console.log(`Total batches: ${totalBatch}`);
        const signedTxs = await signMintNFTWithNonce(contract, NUMBER_OF_TXS);
        console.log(`Total Signed Tx generated: ${signedTxs.length}`);

        const txs = await ethHandler.sendBatchTransactionRequest(signedTxs, BATCH_SIZE);

        const txsByBlock = txs.reduce((acc, tx) => {
            if (!tx?.blockNumber) return acc;
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