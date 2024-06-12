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
    const bytecode = fs.readFileSync(`${contractPath}/../contracts/artifacts/contracts_TokenDummy_sol_MyToken.bin`).toString();
    const contractJson = fs.readFileSync(`${contractPath}/../contracts/artifacts/contracts_TokenDummy_sol_MyToken.abi`);
    const ABI = JSON.parse(contractJson);
    const myContract = new ethers.ContractFactory(ABI, bytecode, signer);
    console.log(`deploying...`);
    const contract = await myContract.deploy('token', 'imxtkr', 20);
    console.log(contract);

};


deployContract();