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
        // console.log(`Creating signed transaction from ${pvKeyAddress} to ${destination} with nonce ${nonce}`);
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
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write(`Creating Tx ${i + 1}/${numberOfTxsToWrite} having nonce ${nonce + i}...`);
            // debug
            // console.log(`Creating EOA Tx ${i + 1}/${numberOfTxsToWrite} having nonce ${nonce + i}...`);
            const tx = await this.createEOATransfer(originPrivateKey, ethAmount, destination, nonce + i);
            txRecord.push(tx);
        }
        console.log();
        return txRecord;
    }

    sendTransactionRequest = async (rawTx) => {
        return await web3.eth.sendSignedTransaction(rawTx, 'receipt', console.log);
    }

    Racer_sendBatchTransactionRequest = async (txs, cooldownStep = 1, raceMode = true) => {
        const txsLength = txs.length;
        cooldownStep = txsLength < cooldownStep ? txsLength : cooldownStep;
        const txsByStep = Math.ceil(txsLength / cooldownStep);
        const txsSent = [];
        const pendingPromises = [];
        for (let i = 0; i < txsByStep; i++) {
            console.log(`Sending transactions ${i * cooldownStep} to ${(i + 1) * cooldownStep}...`);
            const txsGroup = txs.slice(i * cooldownStep, (i + 1) * cooldownStep);
            const txsSentGroupPromises = txsGroup.map(async tx => await this.sendTransactionRequest(tx.rawTransaction)
                .catch((e, f) => {
                    console.error(`Error sending transaction number ${tx.nonce} with hash ${tx.hash}: ${e}`);
                    return null;
                }));
            if (raceMode) {
                await Promise.race(txsSentGroupPromises);
                pendingPromises.push(Promise.all(txsSentGroupPromises).then((txsSentGroup) => {
                    txsSent.push(...txsSentGroup);
                }));
            } else {
                await Promise.all(txsSentGroupPromises).then((txsSentGroup) => {
                    txsSent.push(...txsSentGroup);
                });
            }

        }
        await Promise.all(pendingPromises);
        return txsSent;
    }

    NORMAL_sendBatchTransactionRequest = async (txs, cooldownStep = 1) => {
        const txsLength = txs.length;
        cooldownStep = txsLength < cooldownStep ? txsLength : cooldownStep;
        const txsByStep = Math.ceil(txsLength / cooldownStep);
        const txsSent = [];
        for (let i = 0; i < txsByStep; i++) {
            console.log(`Sending transactions ${i * cooldownStep} to ${(i + 1) * cooldownStep} ...`);
            const txsGroup = txs.slice(i * cooldownStep, (i + 1) * cooldownStep);
            const txsSentGroup = await Promise.all(txsGroup.map(async tx => await this.sendTransactionRequest(tx.rawTransaction).catch((e, f) => {
                console.error(`Error sending transaction hash ${tx.transactionHash}: ${e}`);
                return null;
            })));
            txsSent.push(...txsSentGroup);
        }
        return txsSent;
    }

    sendBatchTransactionRequest = async (txs, cooldownStep = 10, cooldownTime = 3000) => {
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const txsLength = txs.length;
        const txsSent = [];

        for (let i = 0; i < txsLength; i += cooldownStep) {
            console.log(`Sending transactions ${i} to ${Math.min(i + cooldownStep, txsLength)}...`);
            const txsGroup = txs.slice(i, i + cooldownStep);

            const txsSentGroupPromises = txsGroup.map(async tx =>
                await this.sendTransactionRequest(tx.rawTransaction).catch((e) => {
                    console.error(`Error sending transaction number ${tx.nonce} with hash ${tx.hash}: ${e}`);
                    return null;
                })
            );

            txsSent.push(...txsSentGroupPromises);

            // Cooldown period after each batch
            console.log(`Cooldown for ${cooldownTime} ms...`);
            await sleep(cooldownTime);
        }
        return Promise.all(txsSent);
    };

    writeTransaction = async (rawTx) => {
        const createReceipt = await web3.eth.sendSignedTransaction(rawTx);
        console.log(createReceipt);
        console.log(`Transaction successful with hash: ${createReceipt.transactionHash}`);
        return createReceipt;
    }

    emptyTransfer = async (originPrivateKey, destination) => {
        const provider = await this.getEthersProvider();
        const wallet = new ethers.Wallet(originPrivateKey, provider);
        const sendTimeStart = Date.now();
        const tx = await wallet.sendTransaction({
            to: destination,
            value: 0
        });
        const sendTimeEnd = Date.now();
        const txResp = await tx.wait(1);
        const waitTimeEnd = Date.now();
        const timeIntervals = {
            sendTime: sendTimeEnd - sendTimeStart,
            waitTime: waitTimeEnd - sendTimeEnd
        }
        console.log(`Empty transfer at Block ${+txResp.blockNumber} from ${wallet.address} to ${destination} successful.`);
        return timeIntervals;
    }

}

module.exports = Object.freeze(new EthHandler());
