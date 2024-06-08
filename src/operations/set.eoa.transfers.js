const config = require("../config/config");
const ethHandler = require("../services/eth.handler");
const { Web3 } = require('web3');
const web3 = new Web3(config.internalImxConfig.rpcProvider);
const txRecord = [];

async function writeEOATransfer () {

    const pvKey = config.internalImxConfig.defaultAccount.privateKey;
    const pvKeyAddress = await web3.eth.accounts.privateKeyToAccount(pvKey).address;
    const destination = config.internalImxConfig.accountDummy.publicAddress;

    console.log(`Previous State`);
    const balancePv = await ethHandler.getBalance(pvKeyAddress);
    const balanceDest = await ethHandler.getBalance(destination);
    console.log(`Balance origin ${pvKeyAddress} : ${web3.utils.fromWei(balancePv, "ether")}`);
    console.log(`Balance dest ${destination} : ${web3.utils.fromWei(balanceDest, "ether")}`);

    const receipt = await ethHandler.writeEOATransfer(pvKey, 0.1, destination);
    const object = {
        blockHash: receipt.blockHash,
        blockNumber: receipt.blockNumber,
        txHash: receipt.transactionHash
    };
    txRecord.push(object);
    return object;
}

async function populateWithEOATransfer(numberOfTxsToWrite) {
    for(let i=0; i< numberOfTxsToWrite; i++) {
       const receipt = await writeEOATransfer();
    }

    console.log(`EOA Transfer TxRecord`);
    console.log(txRecord);
}

populateWithEOATransfer(5);
