console.clear();

require('dotenv').config({path: '.env'});
const { Web3 } = require('web3');
const config = require('../config/config');

const fs = require('fs');
const path = require('path');
const { ethers } = require("ethers");


async function deployContract () {
    // Arrange
    const provider = new ethers.providers.JsonRpcProvider(config.internalImxConfig.rpcProvider);
    const contractPath = path.join(__dirname, '/');
    const signer = new ethers.Wallet(config.internalImxConfig.defaultAccount.privateKey, provider);
    const admin = signer.address;
    const contractJsonRaw = fs.readFileSync(`${contractPath}/../contracts/artifacts/contracts_MultiCallDeploy_abi.json`);
    const contractJSON = JSON.parse(contractJsonRaw);
    const myContract = new ethers.ContractFactory(contractJSON.abi, contractJSON.bytecode, signer);
    console.log(`deploying...`);
    const contract = await myContract.deploy(
        // admin,
        admin,
        //executer
        admin
    );
    console.log(`deploying MultiCall at ${contract.address}`);
    await contract.deployed();
    console.log(`deployed MultiCall at ${contract.address}`);

};


deployContract();