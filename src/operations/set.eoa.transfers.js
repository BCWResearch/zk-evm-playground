const config = require("../config/config");
const ethHandler = require("../services/eth.handler");
const { Web3 } = require('web3');
const web3 = new Web3(config.internalImxConfig.rpcProvider);
const txRecord = [];
const { makeBatchRequest } = require('web3-batch-request');


async function buildEOATransfer () {

    const pvKey = config.internalImxConfig.defaultAccount.privateKey;
    const pvKeyAddress = await web3.eth.accounts.privateKeyToAccount(pvKey).address;
    const destination = config.internalImxConfig.accountDummy.publicAddress;

    console.log(`Previous State`);
    const balancePv = await ethHandler.getBalance(pvKeyAddress);
    const balanceDest = await ethHandler.getBalance(destination);
    console.log(`Balance origin ${pvKeyAddress} : ${web3.utils.fromWei(balancePv, "ether")}`);
    console.log(`Balance dest ${destination} : ${web3.utils.fromWei(balanceDest, "ether")}`);

    const fullTransaction = await ethHandler.createEOATransfer(pvKey, 0.1, destination);
  /*  const object = {
        blockHash: receipt.blockHash,
        blockNumber: receipt.blockNumber,
        txHash: receipt.transactionHash
    }; */
    
    return fullTransaction;
}

async function populateWithEOATransfer(numberOfTxsToWrite) {
    for(let i=0; i< numberOfTxsToWrite; i++) {
       const originalTx = await buildEOATransfer();
       txRecord.push(originalTx);
    }

    // How do you batch write this one?
    await ethHandler.writeTransaction(txRecord[0].rawTransaction);    
}

populateWithEOATransfer(5);
