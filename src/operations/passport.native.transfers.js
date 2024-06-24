console.clear();

require('dotenv').config({ path: '.env' });
const { Web3 } = require('web3');
const config = require('../config/config');

const fs = require('fs');
const path = require('path');
const { ethers } = require("ethers");

const provider = new ethers.providers.JsonRpcProvider(config.internalImxConfig.rpcProvider);
const signer = new ethers.Wallet(config.internalImxConfig.defaultAccount.privateKey, provider);

async function deployWalletFactoryContract() {
    // Arrange
    const contractPath = path.join(__dirname, '/');
    const admin = signer.address;
    const contractJsonRaw = fs.readFileSync(`${contractPath}/../contracts/artifacts/contracts_WalletFactory_abi.json`);
    const contractJSON = JSON.parse(contractJsonRaw);
    const myContract = new ethers.ContractFactory(contractJSON.abi, contractJSON.bytecode, signer);

    process.stdout.clearLine();
    process.stdout.write(`deploying WalletFactory Contract...`);

    const contract = await myContract.deploy();

    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`deploying WalletFactory Contract at ${contract.address}`);

    await contract.deployed();

    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`deployed WalletFactory Contract at ${contract.address}\n`);

    return contract;

};


async function deploySimpleWalletContract() {
    // Arrange
    const contractPath = path.join(__dirname, '/');
    const admin = signer.address;
    const contractJsonRaw = fs.readFileSync(`${contractPath}/../contracts/artifacts/contracts_SimpleWallet_abi.json`);
    const contractJSON = JSON.parse(contractJsonRaw);
    const myContract = new ethers.ContractFactory(contractJSON.abi, contractJSON.bytecode, signer);

    process.stdout.clearLine();
    process.stdout.write(`deploying SimpleWallet Contract...`);

    const contract = await myContract.deploy(admin);

    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`deploying SimpleWallet Contract at ${contract.address}`);

    await contract.deployed();

    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`deployed SimpleWallet Contract at ${contract.address}\n`);

    return contract;

};


async function deploySimpleMultiCallDeployContract() {
    // Arrange
    const contractPath = path.join(__dirname, '/');
    const admin = signer.address;
    const contractJsonRaw = fs.readFileSync(`${contractPath}/../contracts/artifacts/contracts_SimpleMultiCallDeploy_abi.json`);
    const contractJSON = JSON.parse(contractJsonRaw);
    const myContract = new ethers.ContractFactory(contractJSON.abi, contractJSON.bytecode, signer);

    process.stdout.clearLine();
    process.stdout.write(`deploying SimpleMultiCallDeploy Contract...`);

    const contract = await myContract.deploy(admin, admin);

    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`deploying SimpleMultiCallDeploy Contract at ${contract.address}`);

    await contract.deployed();

    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`deployed SimpleMultiCallDeploy Contract at ${contract.address}\n`);

    return contract;

};

async function passportNativeTransfers() {
    const factory = await deployWalletFactoryContract();
    const mainModule = await deploySimpleWalletContract();
    const multiCallDeploy = await deploySimpleMultiCallDeployContract();

    const recipients = [
        { address: "0x85dA99c8a7C2C95964c8EfD687E95E632Fc533D6", amount: ethers.utils.parseEther("0.1") },
        { address: "0x125FB391bA829e0865963D3B91711610049a9e78", amount: ethers.utils.parseEther("0.1") }
    ]

    // Create transactions
    const transactions = recipients.map((recipient) => ({
        target: recipient.address,
        value: recipient.amount,
        data: "0x",
    }));

    // Define the salt
    const salt = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("unique_salt"));

    // Calculate the total amount to transfer
    const totalAmount = recipients.reduce((acc, recipient) => acc.add(recipient.amount), ethers.BigNumber.from(0));


    // Encode the deployAndExecute call
    const txData = multiCallDeploy.interface.encodeFunctionData("deployAndExecute", [
        ethers.constants.AddressZero,
        mainModule.address,
        salt,
        factory.address,
        transactions,
    ]);

    // Send the transaction
    const tx = await signer.sendTransaction({
        to: multiCallDeploy.address,
        data: txData,
        value: totalAmount, // Include the total amount to be transferred
        gasLimit: 1000000, // Increased gas limit for safety
    });

    console.log("Transaction sent:", tx.hash);
    await tx.wait();
    console.log("Transaction confirmed.");
}


passportNativeTransfers();
