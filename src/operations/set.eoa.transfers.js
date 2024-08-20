const { Web3, eth } = require('web3');
const args = require('minimist')(process.argv.slice(2));
const ethHandler = require("../services/eth.handler");
const config = require("../config/config");
const { buildEOATransferTxs } = require("./utils/eoaUtils")

const web3 = new Web3(config.internalImxConfig.rpcProvider);
const NUMBER_OF_TXS = args['txs'] || 5;
const BATCH_SIZE = args['batch'] || 10;

async function populateWithEOATransfer(numberOfTxsToWrite) {
    const pvKey = config.internalImxConfig.defaultAccount.privateKey;
    const pvKeyAddress = web3.eth.accounts.privateKeyToAccount(pvKey).address;
    const destination = config.internalImxConfig.accountDummy.publicAddress;
    const nonce = +(await web3.eth.getTransactionCount(pvKeyAddress)).toString();
    console.log(`Populating ${numberOfTxsToWrite} EOA transfer transactions...`)
    const txs = await buildEOATransferTxs(nonce + 1, numberOfTxsToWrite);
    console.log(`Transactions built: ${txs.length}`);

    console.log(`Doing empty transfer to increment nonce and block num...`);
    const intervals = await ethHandler.emptyTransfer(config.internalImxConfig.defaultAccount.privateKey, config.internalImxConfig.accountDummy.publicAddress);
    console.log(`Sending ${txs.length} transactions...`);
    return await ethHandler.sendBatchTransactionRequest(txs, BATCH_SIZE, intervals.waitTime);
}

// (async () => {
//     const { ethers } = require('ethers');
//     const provider = new ethers.providers.JsonRpcProvider(config.internalImxConfig.rpcProvider);
//     const account = "0xEFD6e8184f22C21033046A51d556e2435DEB61AC";
    
//     const pvKey = "0x9ee848a141706cafed6b804fea0d305bd05d96e932420b7c30771d6887a25c99"
//     const pvKeyAddress = web3.eth.accounts.privateKeyToAccount(pvKey).address;

//     // get balance
//     const fundFrombalance = await web3.eth.getBalance(pvKeyAddress);
//     console.log(`Fund from Balance: ${fundFrombalance}`);


//     // get balance
//     let balance = await web3.eth.getBalance(account);
//     console.log(`Fund to Balance: ${balance}`);
//     console.log(`Fund to Balance in ETH: ${web3.utils.fromWei(balance, 'ether')}`);

//     // fund half of the balance from fundFromBalance to the account
//     const toFund = (+fundFrombalance.toString() / 2).toLocaleString('fullwide', {useGrouping:false});

//     console.log(`Funding ${toFund} to ${account}...`);
//     const wallet = new ethers.Wallet(pvKey, provider);
//     const tx = {
//         to: account,
//         value: toFund,
//         nonce: await wallet.getTransactionCount(),
//         // gasLimit: 21000,
//         // gasPrice: ethers.utils.parseUnits('1', 'gwei')
//     };
//     const txResponse = await wallet.sendTransaction(tx);
//     console.log(`Transaction hash: ${txResponse.hash}`);

// })();

// (async () =>{
//     const blockRangeStart = 30;
//     const blockRangeEnd = 79;
//     // get total tx count in the block
//     // const block = await web3.eth.getBlock(blockNum);
//     // const gasUsed = block.gasUsed;
//     // const gasLimit = block.gasLimit;
//     // const txCount = block?.transactions?.length || 0;
//     // console.log(`Block ${blockNum} has ${txCount} transactions and used ${gasUsed} gas.`);


//     // console log all tx gas used and gas limit with tx count

//     for (let blockNum = blockRangeStart; blockNum <= blockRangeEnd; blockNum++) {
//         const block = await web3.eth.getBlock(blockNum);
//         const gasUsed = block.gasUsed;
//         const gasLimit = block.gasLimit;
//         const txCount = block?.transactions?.length || 0;
//         console.log(`Block ${blockNum} has ${txCount} transactions and used ${gasUsed} gas out of ${gasLimit} gas limit.`);
//     }
    
// })();

// return;
populateWithEOATransfer(NUMBER_OF_TXS).then((txs) => {
    console.log(`EOA transfers written to the blockchain.`);
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
