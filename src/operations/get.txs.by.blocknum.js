const config = require("../config/config");
const ethHandler = require("../services/eth.handler");
const { Web3, eth } = require('web3');
const web3 = new Web3(config.internalImxConfig.rpcProvider);

const BLOCK_NUM = 89390;
//20
//21

const getTxsByBlockNum = async (blockNum) => {
    const block = await web3.eth.getBlock(blockNum);
    const txs = block;
    console.log(`Transactions in block ${blockNum}:`, txs);
    return txs;
}

const getContractByteCode = async (contractAddress) => {
    const code = await web3.eth.getCode(contractAddress);
    console.log(`Contract Byte Code:`, code);
    return code;
}

// getTxsByBlockNum(BLOCK_NUM);

getContractByteCode('0x5FbDB2315678afecb367f032d93F642f64180aa3');