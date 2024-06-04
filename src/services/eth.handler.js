require('dotenv').config();
const { Web3 } = require('web3');
const config = require('../config/config');
const web3 = new Web3(config.nakedRpc.rpcProvider);
const axios = require('axios');

class EthHandler {

    getChainId = async ()  => {
        const chain  = await web3.eth.getChainId();
        console.log(`Chain retrieved Mainnet : ${chain}`);
        return chain;
    }

    getActiveAccounts = async() => {
        const accounts = await web3.eth.getAccounts();
        console.log(`accounts`);
        return accounts;
    }

    getBlock = async(number) => {
        return await web3.eth.getBlock(number);
    }

    getAccount = async (accountAddress) => {
        const account = await web3.eth.getAccount(accountAddress);
        console.log(`Accounts : ${account.length}`);
        return account;
    }

    isEOATransfer = async (txHash) => {
        const tx = await web3.eth.getTransaction(txHash);
        const destination = tx.to;
        const code = await web3.eth.getCode(destination);
        return code !== null && code == '0x';
    }

}

module.exports = Object.freeze(new EthHandler());
