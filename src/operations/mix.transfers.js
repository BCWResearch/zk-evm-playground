const { Web3, eth } = require('web3');
const args = require('minimist')(process.argv.slice(2));
const ethHandler = require("../services/eth.handler");
const config = require("../config/config");
const { buildEOATransferTxs } = require("./utils/eoaUtils")
const { deployNFTContract, signMintNFTWithNonce } = require("./utils/nftUtils")
const { setupERC20FactoryFixture, setupERC721FactoryFixture, generateErc20SignedTx, generateErc721SignedTx } = require("./utils/passportUtils");

const web3 = new Web3(config.internalImxConfig.rpcProvider);

const NUMBER_OF_TXS = args['txs'] || 10;
const BATCH_SIZE = args['batch'] || 10;

const pvKey = config.internalImxConfig.defaultAccount.privateKey;
const pvKeyAddress = web3.eth.accounts.privateKeyToAccount(pvKey).address;


async function setup() {
    console.log(`Setting up NFT contract...`);
    const NFT_CONTRACT = await deployNFTContract();
    console.log(`Setting up Passport ERC20 contracts...`);
    const PASSPORT_ERC20 = await setupERC20FactoryFixture();
    console.log(`Setting up Passport ERC721 contracts...`);
    const PASSPORT_ERC721 = await setupERC721FactoryFixture();
    return { NFT_CONTRACT, PASSPORT_ERC20, PASSPORT_ERC721 };
}

async function main() {
    const { NFT_CONTRACT, PASSPORT_ERC20, PASSPORT_ERC721 } = await setup();
    // 1 tx for native passport including 10 txs
    // 1 tx for nft passport including 10 txs
    // remaining txs / 2 for eoa transfers
    // remaining txs / 2 for nft transfers

    // Populating EOA transfer transactions
    const EOA_TXS = Math.ceil((NUMBER_OF_TXS - 2) / 2);


    let nonce = (+(await web3.eth.getTransactionCount(pvKeyAddress)).toString()) + 1;
    console.log(`Nonce: ${nonce}`);
    console.log(`Populating ${EOA_TXS} EOA transfer transactions...`)
    const txs = await buildEOATransferTxs(nonce, EOA_TXS);
    console.log(`Total EOA Transactions built: ${txs.length}`);

    // Incrementing nonce and block number
    nonce += txs.length;

    // Populating NFT transfer transactions
    const NFT_TXS = NUMBER_OF_TXS - 2 - EOA_TXS;
    console.log(`Populating ${NFT_TXS} NFT transfer transactions...`)
    const nftTxs = await signMintNFTWithNonce(NFT_CONTRACT, NFT_TXS, nonce);
    console.log(`Total NFT Transactions built: ${nftTxs.length}`);

    // Incrementing nonce and block number
    nonce += nftTxs.length;

    // Populating Passport ERC20 transfer transactions
    const ERC20_TXS = 2;
    console.log(`Populating ${ERC20_TXS} Passport ERC20 transfer transactions...`)
    const passportErc20Txs = await generateErc20SignedTx(
        PASSPORT_ERC20.owner_a,
        PASSPORT_ERC20.salt,
        PASSPORT_ERC20.cfa,
        PASSPORT_ERC20.factory,
        PASSPORT_ERC20.mainModule,
        PASSPORT_ERC20.multiCall,
        PASSPORT_ERC20.executor,
        PASSPORT_ERC20.acc1,
        PASSPORT_ERC20.owner,
        PASSPORT_ERC20.networkId,
        PASSPORT_ERC20.optimalGasLimit,
        PASSPORT_ERC20.token,
        ERC20_TXS,
        nonce
    );

    // Incrementing nonce and block number
    nonce += 1

    // Populating Passport ERC721 transfer transactions
    const ERC721_TXS = 2;
    console.log(`Populating ${ERC721_TXS} Passport ERC721 transfer transactions...`)
    const passportErc721Txs = await generateErc721SignedTx(
        // owner_a, salt, cfa, factory, mainModule, multiCall, executor, acc1, owner, networkId, optimalGasLimit, token, TOTAL_TXS, NONCE
        PASSPORT_ERC721.owner_a,
        PASSPORT_ERC721.salt,
        PASSPORT_ERC721.cfa,
        PASSPORT_ERC721.factory,
        PASSPORT_ERC721.mainModule,
        PASSPORT_ERC721.multiCall,
        PASSPORT_ERC721.executor,
        PASSPORT_ERC721.acc1,
        PASSPORT_ERC721.owner,
        PASSPORT_ERC721.networkId,
        PASSPORT_ERC721.optimalGasLimit,
        PASSPORT_ERC721.token,
        ERC721_TXS,
        nonce
    );

    // Incrementing nonce and block number
    nonce += 1

    // Doing empty transfer to increment nonce and block num

    console.log(`Doing empty transfer to increment nonce and block num...`);
    await ethHandler.emptyTransfer(config.internalImxConfig.defaultAccount.privateKey, config.internalImxConfig.accountDummy.publicAddress);

    console.log(`Sending ${txs.length + nftTxs.length + ERC20_TXS + ERC721_TXS} transactions...`);
    const allTxs = [...txs, ...nftTxs, passportErc20Txs, passportErc721Txs];

    const batchTxs = await ethHandler.sendBatchTransactionRequest(allTxs, BATCH_SIZE);
    console.log(`Transactions written to the blockchain.`);

    const txsByBlock = batchTxs.reduce((acc, tx) => {
        if (!acc[tx.blockNumber]) {
            acc[tx.blockNumber] = [];
        }
        acc[tx.blockNumber].push(tx);
        return acc;
    }, {});

    for (const blockNum in txsByBlock) {
        console.log(`Block ${+blockNum} has ${txsByBlock[blockNum].length} transactions.`);
    }
}

main();