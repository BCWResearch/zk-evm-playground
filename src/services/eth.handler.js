const { Web3 } = require('web3');
const config = require('../config/config');
const web3 = new Web3(config.internalImxConfig.rpcProvider);
const { ethers } = require('ethers');

class EthHandler {
    getEthersProvider = async () => {
        return new ethers.providers.JsonRpcProvider(config.internalImxConfig.rpcProvider);
    }

    getChainId = async () => {
        const chain = await web3.eth.getChainId();
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

    getActiveAccounts = async () => {
        const accounts = await web3.eth.getAccounts();
        console.log(`Attempting to get accounts.. ${accounts[0]}`);
        return accounts;
    }

    getBlockRange = async () => {
        const firstBlock = await web3.eth.getBlock(0);
        const lastBlock = await web3.eth.getBlock('latest');

        return {
            firstBlock: Number(firstBlock.number),
            lastBlock: Number(lastBlock.number)
        }
    }

    getBlock = async (number) => {
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

    createEOATransfer = async (originPrivateKey, ethAmount, destination, nonce) => {
        const pvKeyAddress = await web3.eth.accounts.privateKeyToAccount(originPrivateKey).address;
        console.log(`Creating signed transaction from ${pvKeyAddress} to ${destination} with nonce ${nonce}`);
        const createTransaction = await web3.eth.accounts.signTransaction(
            {
                from: pvKeyAddress,
                to: destination,
                value: web3.utils.toWei(ethAmount, 'ether'),
                gas: 21000,
                maxFeePerGas: 21000,
                maxPriorityFeePerGas: 21000,
                nonce
            },
            originPrivateKey
        );

        return createTransaction;
    }

    createSignedTransaction = async (originPrivateKey, destination, data, gas, nonce) => {
        const pvKeyAddress = await web3.eth.accounts.privateKeyToAccount(originPrivateKey).address;
        // console.log(`Creating signed transaction from ${pvKeyAddress} to ${destination} with nonce ${nonce}`);
        const createTransaction = await web3.eth.accounts.signTransaction(
            {
                from: pvKeyAddress,
                to: destination,
                data,
                gas: gas || 21432,
                maxFeePerGas: gas || 21432,
                maxPriorityFeePerGas: gas || 21432,
                nonce
            },
            originPrivateKey
        );
        return createTransaction;
    }

    batchCreateEOATransfer = async (originPrivateKey, ethAmount, destination, nonce, numberOfTxsToWrite) => {
        const txRecord = [];
        for (let i = 0; i < numberOfTxsToWrite; i++) {
            const tx = await this.createEOATransfer(originPrivateKey, ethAmount, destination, nonce + i);
            txRecord.push(tx);
        }
        return txRecord;
    }

    sendTransactionRequest = async (rawTx) => {
        return await web3.eth.sendSignedTransaction(rawTx, 'receipt', console.log);
    }

    sendBatchTransactionRequest = async (txs, cooldownStep = 1) => {
        const txsLength = txs.length;
        const txsByStep = Math.ceil(txsLength / cooldownStep);
        const txsSent = [];
        for (let i = 0; i < txsByStep; i++) {
            console.log(`Sending transactions ${i * cooldownStep} to ${(i + 1) * cooldownStep}...`);
            const txsGroup = txs.slice(i * cooldownStep, (i + 1) * cooldownStep);
            const txsSentGroup = await Promise.all(txsGroup.map(async tx => await this.sendTransactionRequest(tx.rawTransaction)));
            txsSent.push(...txsSentGroup);
        }
        return txsSent;
    }

    writeTransaction = async (rawTx) => {
        const createReceipt = await web3.eth.sendSignedTransaction(rawTx);
        console.log(createReceipt);
        console.log(`Transaction successful with hash: ${createReceipt.transactionHash}`);
        return createReceipt;
    }

    emptyTransfer = async (originPrivateKey, destination) => {
        const provider = await this.getEthersProvider();
        const wallet = new ethers.Wallet(originPrivateKey, provider);
        const tx = await wallet.sendTransaction({
            to: destination,
            value: 0
        });
        const txResp = await tx.wait(0);
        console.log(`Empty transfer at Block ${+txResp.blockNumber} from ${wallet.address} to ${destination} successful.`);
    }

}

module.exports = Object.freeze(new EthHandler());
