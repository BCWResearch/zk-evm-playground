const { ethers } = require("ethers");
const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

const config = require("../../config/config")
const ethHandler = require("../../services/eth.handler");

const WALLET_CODE = '0x6054600f3d396034805130553df3fe63906111273d3560e01c14602b57363d3d373d3d3d3d369030545af43d82803e156027573d90f35b3d90fd5b30543d5260203df3'

const MetaTransactionsType = `tuple(
  bool delegateCall,
  bool revertOnError,
  uint256 gasLimit,
  address target,
  uint256 value,
  bytes data
)[]`

function encodeImageHash(
    threshold,
    accounts
) {
    const sorted = accounts.sort((a, b) => compareAddr(a.address, b.address))
    let imageHash = ethers.utils.solidityPack(['uint256'], [threshold])

    sorted.forEach((a) =>
        imageHash = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ['bytes32', 'uint8', 'address'],
                [imageHash, a.weight, a.address]
            )
        )
    )

    return imageHash
}

function addressOf(
    factory,
    mainModule,
    imageHash
) {
    const codeHash = ethers.utils.keccak256(
        ethers.utils.solidityPack(
            ['bytes', 'bytes32'],
            [WALLET_CODE, ethers.utils.hexZeroPad(mainModule, 32)]
        )
    )

    const hash = ethers.utils.keccak256(
        ethers.utils.solidityPack(
            ['bytes1', 'address', 'bytes32', 'bytes32'],
            ['0xff', factory, imageHash, codeHash]
        )
    )

    return ethers.utils.getAddress(ethers.utils.hexDataSlice(hash, 12))
}

function encodeMetaTransactionsData(
    owner,
    txs,
    networkId,
    nonce
) {
    const transactions = ethers.utils.defaultAbiCoder.encode(['uint256', MetaTransactionsType], [nonce, txs])
    return encodeMessageData(owner, transactions, networkId)
}


function encodeMessageData(
    owner,
    message,
    networkId
) {
    return encodeMessageSubDigest(owner, ethers.utils.keccak256(message), networkId)
}

function encodeMessageSubDigest(
    owner,
    digest,
    networkId
) {
    return ethers.utils.solidityPack(
        ['string', 'uint256', 'address', 'bytes32'],
        ['\x19\x01', networkId, owner, digest]
    )
}

async function ethSign(wallet, message, hashed = false) {
    let hash = hashed ? message : ethers.utils.keccak256(message)
    let hashArray = ethers.utils.arrayify(hash)
    let ethsigNoType = await wallet.signMessage(hashArray)
    return ethsigNoType.endsWith('03') || ethsigNoType.endsWith('02') ? ethsigNoType : ethsigNoType + '02'
}

async function walletMultiSign(
    accounts,
    threshold,
    message,
    forceDynamicSize = false,
    hashed = false
) {
    const sorted = accounts.sort((a, b) => compareAddr(a.owner, b.owner))
    const accountBytes = await Promise.all(
        sorted.map(async (a) => {
            if (typeof a.owner === 'string' && !a.signature) {
                return ethers.utils.solidityPack(
                    ['uint8', 'uint8', 'address'],
                    [1, a.weight, a.owner]
                )
            } else {
                const signature = ethers.utils.arrayify(a.signature ? a.signature : await ethSign(a.owner, message, hashed))
                if (forceDynamicSize || signature.length !== 66) {
                    const address = typeof a.owner === 'string' ? a.owner : a.owner.address
                    return ethers.utils.solidityPack(
                        ['uint8', 'uint8', 'address', 'uint16', 'bytes'],
                        [2, a.weight, address, signature.length, signature]
                    )
                } else {
                    return ethers.utils.solidityPack(
                        ['uint8', 'uint8', 'bytes'],
                        [0, a.weight, signature]
                    )
                }
            }
        })
    )

    return ethers.utils.solidityPack(
        ['uint16', ...Array(accounts.length).fill('bytes')],
        [threshold, ...accountBytes]
    )
}

async function setupERC20FactoryFixture() {
    const provider = new ethers.providers.JsonRpcProvider(config.internalImxConfig.rpcProvider);
    const owner = new ethers.Wallet(config.internalImxConfig.defaultAccount.privateKey, provider);
    const executor = new ethers.Wallet(config.internalImxConfig.executorAccount.privateKey, provider);
    const acc1 = new ethers.Wallet(config.internalImxConfig.anotherAccount.privateKey, provider);

    const contractPath = path.join(__dirname, '..');

    // Network ID
    const networkId = (await provider.getNetwork()).chainId

    // Wallet TX
    const optimalGasLimit = ethers.constants.Two.pow(21)

    // Contracts are deployed using the first signer/account by default
    const walletJsonRaw = fs.readFileSync(`${contractPath}/../contracts/artifacts/contracts_Factory_abi.json`);
    const walletcontractJSON = JSON.parse(walletJsonRaw);
    const WalletFactory = new ethers.ContractFactory(walletcontractJSON.abi, walletcontractJSON.bytecode, owner);
    const factory = await WalletFactory.deploy(owner.address, await owner.getAddress());
    await factory.deployed();

    const mainModuleJsonRaw = fs.readFileSync(`${contractPath}/../contracts/artifacts/contracts_MainModule_abi.json`);
    const mainModuleJSON = JSON.parse(mainModuleJsonRaw);
    const MainModule = new ethers.ContractFactory(mainModuleJSON.abi, mainModuleJSON.bytecode, owner);
    const mainModule = await MainModule.deploy(factory.address)
    await mainModule.deployed()

    const multiCallDeployJsonRaw = fs.readFileSync(`${contractPath}/../contracts/artifacts/contracts_MultiCallDeploy_abi.json`);
    const multiCallDeployJSON = JSON.parse(multiCallDeployJsonRaw);
    const MultiCall = new ethers.ContractFactory(multiCallDeployJSON.abi, multiCallDeployJSON.bytecode, owner);
    const multiCall = await MultiCall.deploy(owner.address, executor.address)
    await multiCall.deployed()

    const deployerRole = await factory.DEPLOYER_ROLE()
    const roleTx = await factory.connect(owner).grantRole(deployerRole, multiCall.address)
    await roleTx.wait()

    const erc20MockJsonRaw = fs.readFileSync(`${contractPath}/../contracts/artifacts/contracts_ERC20Mock_abi.json`);
    const erc20MockJSON = JSON.parse(erc20MockJsonRaw);
    const Token = new ethers.ContractFactory(erc20MockJSON.abi, erc20MockJSON.bytecode, owner);
    const token = await Token.connect(owner).deploy()
    await token.deployed()

    const owner_a = new ethers.Wallet(ethers.utils.randomBytes(32))
    const salt = encodeImageHash(1, [{ weight: 1, address: owner_a.address }])

    // CFA
    const cfa = addressOf(factory.address, mainModule.address, salt)

    // Transfer tokens to CFA
    const transferTx = await token.connect(owner).transfer(cfa, ethers.utils.parseEther('5'))
    await transferTx.wait()

    return {
        owner_a,
        salt,
        cfa,
        owner,
        executor,
        acc1,
        factory,
        mainModule,
        multiCall,
        networkId,
        optimalGasLimit,
        token
    }
}

async function setupERC721FactoryFixture() {
    const provider = new ethers.providers.JsonRpcProvider(config.internalImxConfig.rpcProvider);
    const owner = new ethers.Wallet(config.internalImxConfig.defaultAccount.privateKey, provider);
    const executor = new ethers.Wallet(config.internalImxConfig.executorAccount.privateKey, provider);
    const acc1 = new ethers.Wallet(config.internalImxConfig.anotherAccount.privateKey, provider);

    const contractPath = path.join(__dirname, '..');

    // Network ID
    const networkId = (await provider.getNetwork()).chainId

    // Wallet TX
    const optimalGasLimit = ethers.constants.Two.pow(21)

    // Contracts are deployed using the first signer/account by default
    const walletJsonRaw = fs.readFileSync(`${contractPath}/../contracts/artifacts/contracts_Factory_abi.json`);
    const walletcontractJSON = JSON.parse(walletJsonRaw);
    const WalletFactory = new ethers.ContractFactory(walletcontractJSON.abi, walletcontractJSON.bytecode, owner);
    const factory = await WalletFactory.deploy(owner.address, await owner.getAddress());
    await factory.deployed();

    const mainModuleJsonRaw = fs.readFileSync(`${contractPath}/../contracts/artifacts/contracts_MainModule_abi.json`);
    const mainModuleJSON = JSON.parse(mainModuleJsonRaw);
    const MainModule = new ethers.ContractFactory(mainModuleJSON.abi, mainModuleJSON.bytecode, owner);
    const mainModule = await MainModule.deploy(factory.address)
    await mainModule.deployed()

    const multiCallDeployJsonRaw = fs.readFileSync(`${contractPath}/../contracts/artifacts/contracts_MultiCallDeploy_abi.json`);
    const multiCallDeployJSON = JSON.parse(multiCallDeployJsonRaw);
    const MultiCall = new ethers.ContractFactory(multiCallDeployJSON.abi, multiCallDeployJSON.bytecode, owner);
    const multiCall = await MultiCall.deploy(owner.address, executor.address)
    await multiCall.deployed()

    const deployerRole = await factory.DEPLOYER_ROLE()
    const roleTx = await factory.connect(owner).grantRole(deployerRole, multiCall.address)
    await roleTx.wait()

    const erc721MockJsonRaw = fs.readFileSync(`${contractPath}/../contracts/artifacts/contracts_ERC721Mock_abi.json`);
    const erc721MockJSON = JSON.parse(erc721MockJsonRaw);
    const Token = new ethers.ContractFactory(erc721MockJSON.abi, erc721MockJSON.bytecode, owner);
    const token = await Token.connect(owner).deploy()
    await token.deployed()

    const owner_a = new ethers.Wallet(ethers.utils.randomBytes(32))
    const salt = encodeImageHash(1, [{ weight: 1, address: owner_a.address }])

    // CFA
    const cfa = addressOf(factory.address, mainModule.address, salt)

    // Transfer tokens to CFA
    const transferTx = await token.connect(owner).mint(cfa, ethers.utils.parseEther('5'))
    await transferTx.wait()


    return {
        owner_a,
        salt,
        cfa,
        owner,
        executor,
        acc1,
        factory,
        mainModule,
        multiCall,
        networkId,
        optimalGasLimit,
        token
    }
}

async function generateErc20SignedTx(owner_a, salt, cfa, factory, mainModule, multiCall, executor, acc1, owner, networkId, optimalGasLimit, token, TOTAL_TXS, NONCE) {

    console.log('Token Balance:', (await token.balanceOf(cfa)).toString())

    // We don't want delegate call here as the state is contained to the ERC20 contract
    const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: optimalGasLimit,
        target: token.address,
        value: ethers.constants.Zero,
        data: token.interface.encodeFunctionData('transfer', [acc1.address, ethers.utils.parseEther('0.1')])
    }

    const transactions = Array(TOTAL_TXS).fill(transaction)

    // Signing
    const data = encodeMetaTransactionsData(cfa, transactions, networkId, ethers.constants.Zero)
    const sig = walletMultiSign([{ weight: 1, owner: owner_a }], 1, data, false)

    // Execution

    const recipient = owner.address;
    let nonce = +NONCE || +(await owner.getTransactionCount()).toString();
    console.log('generateErc20SignedTx Nonce:', nonce);
    const tx = multiCall.populateTransaction.deployAndExecute(cfa, mainModule.address, salt, factory.address, transactions, 0, sig);

    const estimatedGas = +(await owner.estimateGas(tx));

    const signedTx = await ethHandler.createSignedTransaction(
        config.internalImxConfig.defaultAccount.privateKey,
        recipient.address,
        tx.data,
        estimatedGas,
        nonce
    )
    return signedTx;
}

async function generateErc721SignedTx(owner_a, salt, cfa, factory, mainModule, multiCall, executor, acc1, owner, networkId, optimalGasLimit, token, TOTAL_TXS, NONCE) {
    const transactions = [];

    for (let i = 0; i < TOTAL_TXS; i++) {
        const transaction = {
            delegateCall: false,
            revertOnError: true,
            gasLimit: optimalGasLimit,
            target: token.address,
            value: ethers.constants.Zero,
            data: token.interface.encodeFunctionData('mint', [acc1.address, i * 5])
        }
        transactions.push(transaction)
    }

    // Signing
    const data = encodeMetaTransactionsData(cfa, transactions, networkId, ethers.constants.Zero)
    const sig = walletMultiSign([{ weight: 1, owner: owner_a }], 1, data, false)


    const recipient = owner.address;
    let nonce = +NONCE || +(await owner.getTransactionCount()).toString();
    console.log('generateErc721SignedTx Nonce:', nonce);
    const tx = multiCall.populateTransaction.deployAndExecute(cfa, mainModule.address, salt, factory.address, transactions, 0, sig);

    const estimatedGas = +(await owner.estimateGas(tx));

    const signedTx = await ethHandler.createSignedTransaction(
        config.internalImxConfig.defaultAccount.privateKey,
        recipient.address,
        tx.data,
        estimatedGas,
        nonce
    );
    return signedTx;
}

async function createERC20SignedTx(TOTAL_TXS) {
    const { owner_a, salt, cfa, factory, mainModule, multiCall, executor, acc1, owner, networkId, optimalGasLimit, token } = await setupERC20FactoryFixture();
    const signedTx = await generateErc20SignedTx(owner_a, salt, cfa, factory, mainModule, multiCall, executor, acc1, owner, networkId, optimalGasLimit, token, TOTAL_TXS);
    return signedTx;
}

async function createERC721SignedTx(TOTAL_TXS) {
    const { owner_a, salt, cfa, factory, mainModule, multiCall, executor, acc1, owner, networkId, optimalGasLimit, token } = await setupERC721FactoryFixture();
    const signedTx = await generateErc721SignedTx(owner_a, salt, cfa, factory, mainModule, multiCall, executor, acc1, owner, networkId, optimalGasLimit, token, TOTAL_TXS);
    return signedTx;
}

module.exports = {
    encodeImageHash,
    addressOf,
    encodeMetaTransactionsData,
    walletMultiSign,
    setupERC20FactoryFixture,
    setupERC721FactoryFixture,
    generateErc20SignedTx,
    generateErc721SignedTx,
    createERC20SignedTx,
    createERC721SignedTx
}