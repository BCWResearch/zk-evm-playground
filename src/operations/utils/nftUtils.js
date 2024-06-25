
const config = require('../../config/config');
const fs = require('fs');
const path = require('path');
const { ethers } = require("ethers");


const ethHandler = require("../../services/eth.handler");

const provider = new ethers.providers.JsonRpcProvider(config.internalImxConfig.rpcProvider);
const signer = new ethers.Wallet(config.internalImxConfig.defaultAccount.privateKey, provider);


async function deployNFTContract() {
    const contractPath = path.join(__dirname, '..');
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

async function signMintNFTWithNonce(contract, numberOfTxsToWrite, NONCE) {
    let nonce = +NONCE || +(await signer.getTransactionCount()).toString();
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
        // Debug
        console.log(`Signing NFT Tx ${i + 1}/${numberOfTxsToWrite} having nonce ${nonce}...`);
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

module.exports = {
    deployNFTContract,
    signMintNFTWithNonce
}