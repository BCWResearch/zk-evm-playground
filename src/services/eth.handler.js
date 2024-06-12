const { Web3 } = require('web3');
const config = require('../config/config');
const web3 = new Web3(config.internalImxConfig.rpcProvider);
const { ethers } = require('ethers');

class EthHandler {
    getEthersProvider = async() => {
        return new ethers.providers.JsonRpcProvider(config.internalImxConfig.rpcProvider);
    }

    getChainId = async ()  => {
        const chain  = await web3.eth.getChainId();
        console.log(`Chain retrieved  : ${chain}`);
        return chain;
    }

    getPrivateKey = async () => {
        return await config.internalImxConfig.defaultAccount.privateKey;
    }

    getDefaultAccountKey = async () => {
        const account = await web3.eth.accounts.privateKeyToAccount(config.internalImxConfig.defaultAccount.privateKey);
        return account;
    }

    getActiveAccounts = async() => {
        const accounts = await web3.eth.getAccounts();
        console.log(`Attempting to get accounts.. ${accounts[0]}`);
        return accounts;
    }

    getBlockRange = async() => {
        const firstBlock = await web3.eth.getBlock(0);
        const lastBlock = await web3.eth.getBlock('latest');

        return {
            firstBlock: Number(firstBlock.number),
            lastBlock: Number(lastBlock.number)
        }
    }

    getBlock = async(number) => {
        return await web3.eth.getBlock(number);
    }

    getBalance = async (accountAddress) => {
        var balance = await web3.eth.getBalance(accountAddress);
        return balance;
    }

    isEOATransfer = async (txHash) => {
        const tx = await web3.eth.getTransaction(txHash);
        const destination = tx.to;
        const code = await web3.eth.getCode(destination);
        return code !== null && code == '0x';
    }

    getPrivateKeyFromMnemonic = async () => {
        let mnemonic = config.nakedRpc.defaultAccount.mnemonic;
        let mnemonicWallet = ethers.Wallet.fromPhrase(mnemonic);
        return mnemonicWallet.privateKey;
    }

    createEOATransfer = async (originPrivateKey, ethAmount, destination) => {
        console.log(`Attempting to send transaction from ${originPrivateKey} of Eth ${ethAmount} to ${destination}`);
        
        const pvKeyAddress = await web3.eth.accounts.privateKeyToAccount(originPrivateKey).address;
        const createTransaction = await web3.eth.accounts.signTransaction(
            {
                from: pvKeyAddress,
                to: destination,
                value: web3.utils.toWei(ethAmount, 'ether'),
                gas: 21000,
                maxFeePerGas: 21000,
                maxPriorityFeePerGas: 21000
            },
            originPrivateKey
        );

        return createTransaction;
    }

    sendTransactionRequest = async(rawTx) => {
        return await web3.eth.sendSignedTransaction(rawTx, 'receipt', console.log);
    }

    writeTransaction = async(rawTx) => {
        const createReceipt = await web3.eth.sendSignedTransaction(rawTx);
        console.log(createReceipt);
        console.log(`Transaction successful with hash: ${createReceipt.transactionHash}`);
        return createReceipt;
    }

}

module.exports = Object.freeze(new EthHandler());
