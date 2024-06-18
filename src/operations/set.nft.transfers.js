console.clear();

require('dotenv').config({ path: '.env' });
const { Web3 } = require('web3');
const config = require('../config/config');
const args = require('minimist')(process.argv.slice(2));
const fs = require('fs');
const path = require('path');
const { ethers } = require("ethers");
const ethHandler = require("../services/eth.handler");
const provider = new ethers.providers.JsonRpcProvider(config.internalImxConfig.rpcProvider);
const signer = new ethers.Wallet(config.internalImxConfig.defaultAccount.privateKey, provider);

const NUMBER_OF_TXS = args['txs'] || 5;
const BATCH_SIZE = args['batch'] || 10;

async function deployContract() {
    const contractPath = path.join(__dirname, '/');
    const contractJsonRaw = fs.readFileSync(`${contractPath}/../contracts/artifacts/contracts_SimpleNFT_abi.json`);
    const contractJSON = JSON.parse(contractJsonRaw);
    const myContract = new ethers.ContractFactory(contractJSON.abi, contractJSON.bytecode, signer);

    process.stdout.clearLine();
    process.stdout.write(`deploying NFT Contract...`);

    const contract = await myContract.deploy();

    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`deploying NFT Contract at ${contract.address}`);

    await contract.deployed();

    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`deployed NFT Contract at ${contract.address}\n`);

    return contract;
};

async function signMintNFTWithNonce(contract, numberOfTxsToWrite) {
    let nonce = +(await signer.getTransactionCount()).toString();
    const recipient = signer.address;
    const tx = await contract.populateTransaction.mintNFT(recipient);

    const estimatedGas = +(await signer.estimateGas(tx));
    console.log(`Estimated gas per tx: ${estimatedGas}`);
    console.log(`Populating ${numberOfTxsToWrite} NFT transfer transactions...`)
    const signedTxs = [];
    for (let i = 0; i < numberOfTxsToWrite; i++) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`Signing Tx ${i + 1}/${numberOfTxsToWrite}...`);
        const signedTx = await ethHandler.createSignedTransaction(
            config.internalImxConfig.defaultAccount.privateKey,
            contract.address,
            tx.data,
            estimatedGas,
            nonce++
        );
        signedTxs.push(signedTx);
    }
    console.log();
    return signedTxs;
}



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
    .then(deployContract)
    .then(async (contract) => {
        const totalBatch = Math.ceil(NUMBER_OF_TXS / BATCH_SIZE);
        console.log(`Total batches: ${totalBatch}`);
        // return Array.from({ length: totalBatch }, (_, i) => i)
        //     .reduce(async (acc, _) => {
        //         await acc;
        //         return signMintNFTWithNonce(contract, BATCH_SIZE);
        //     }, Promise.resolve());

        const signedTxs = await signMintNFTWithNonce(contract, NUMBER_OF_TXS);
        console.log(`Total Signed Tx generated: ${signedTxs.length}`);

        // const txs = await Promise.all(signedTxs.map(async tx => await ethHandler.sendTransactionRequest(tx.rawTransaction)));
        // console.log(`Transactions sent: ${txs.length}`);

        const txs = await ethHandler.sendBatchTransactionRequest(signedTxs, BATCH_SIZE);

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