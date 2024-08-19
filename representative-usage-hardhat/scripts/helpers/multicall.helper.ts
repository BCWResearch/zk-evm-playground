import { Wallet, keccak256, hexlify, toUtf8Bytes, toBeHex, zeroPadValue, getAddress, Signature, concat, ContractTransactionResponse } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";
import hre, { ethers } from "hardhat";
import ScriptConfig from "../scriptConfig";
import { WALLET_DEPLOY_CODE } from "../deploy/04.installSeaport";

// How much gas should be given to passport transactions?
const PASSPORT_TX_GAS = BigNumber.from(100000);


/**
 * Function to execute a single call with default gas and value.
 * Equivalent to the first `passportCall` in Solidity.
 */
export const passportCall = async (
    userMagic: Wallet,
    contractAddress: string,
    data: string
): Promise<ContractTransactionResponse> => {
    // Default gas and value
    return await passportCallWithGasAndValue(userMagic, contractAddress, data, PASSPORT_TX_GAS, BigNumber.from(0));
};

/**
 * Function to execute a single call with specified gas and value.
 * Equivalent to the second `passportCall` in Solidity.
 */
export const passportCallWithGasAndValue = async (
    userMagic: Wallet,
    contractAddress: string,
    data: string,
    gas: BigNumber,
    value: BigNumber
): Promise<ContractTransactionResponse> => {
    // Preparing arrays to pass to the passportMultiCall function
    const contracts = [contractAddress];
    const dataArr = [data];
    const gasArr = [gas];
    const valueArr = [value];

    // Using the passportMultiCall to execute the transaction
    return await passportMultiCall(userMagic, contracts, dataArr, gasArr, valueArr);
};

export const passportMultiCall = async (
    userMagic: Wallet,
    contracts: string[],
    data: string[],
    gas?: BigNumber[],
    value?: BigNumber[]
) => {
    // Retrieve deployed contracts from ScriptConfig
    const {
        multiCallDeploy,
        walletFactory,
        startupWalletImpl,
        immutableSigner
    } = ScriptConfig.passportWalletV1;

    const len = contracts.length;
    gas = gas || Array(len).fill(PASSPORT_TX_GAS);
    value = value || Array(len).fill(BigNumber.from(0));

    if (len !== data.length || len !== gas.length || len !== value.length) {
        throw new Error("Mismatched lengths");
    }

    const txs: any[] = [];
    for (let i = 0; i < len; i++) {
        txs.push({
            delegateCall: false,
            revertOnError: true,
            gasLimit: gas[i]._hex,
            target: contracts[i],
            value: value[i]._hex,
            data: data[i],
        });
    }

    const walletSalt = encodeImageHash(
        userMagic.address,
        immutableSigner.target.toString()
    );
    const factory = ethers.getAddress(walletFactory.target.toString());
    const imageHash = ethers.getAddress(startupWalletImpl.target.toString());
    const walletCounterFactualAddress = await addressOf(factory, imageHash, walletSalt);

    const nonce = await getNextNonce(walletCounterFactualAddress);

    const hashToBeSigned = encodeMetaTransactionsData(
        walletCounterFactualAddress,
        txs,
        nonce
    );

    const signature = await walletMultiSign(userMagic, hashToBeSigned);

    // Using relayer to broadcast the transaction
    const relayerWallet = ScriptConfig.deployAccounts.relayer;

    console.log("Factory:", factory);
    console.log("ImageHash (Salt):", imageHash);

    return await multiCallDeploy.connect(relayerWallet).deployAndExecute(
        walletCounterFactualAddress,
        startupWalletImpl.target,
        walletSalt,
        walletFactory.target,
        txs,
        nonce,
        signature
    );
};


function compareAddr(addr1: string, addr2: string): number {
    const address1 = ethers.getAddress(addr1).toLowerCase();
    const address2 = ethers.getAddress(addr2).toLowerCase();

    if (address1 < address2) {
        return -1;
    } else if (address1 > address2) {
        return 1;
    } else {
        return 0;
    }
}


// Helper functions
function encodeImageHash(addrA: string, addrB: string): string {
    const accounts = [addrA, addrB];
    const sorted = accounts.sort((a, b) => compareAddr(a,b));
    let imageHash = ethers.solidityPacked(['uint256'], [1]);

    sorted.forEach((a) =>
        imageHash = ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(
                ['bytes32', 'uint8', 'address'],
                [imageHash, 1, a]
            )
        )
    );

    return imageHash;
}

function hexZeroPad(value: string, length: number): string {
    const hexValue = ethers.toBeHex(value);
    if (hexValue.length > length * 2 + 2) {
        throw new Error('Value is already longer than desired length');
    }
    return ethers.zeroPadValue(hexValue, length);
}

function hexDataSlice(data: string, start: number, end?: number): string {
    const hexData = ethers.getBytes(data);  // Converts to byte array
    return ethers.hexlify(hexData.slice(start, end));
}

async function addressOf(factory: string, mainModule: string, imageHash: string): Promise<string> {
    // const deployCode = keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address"], [mainModule]));
    const codeHash = ethers.keccak256(
        ethers.solidityPacked(
            ['bytes', 'bytes32'],
            [WALLET_DEPLOY_CODE, hexZeroPad(mainModule, 32)]
        )
    );

    const hash = ethers.keccak256(
        ethers.solidityPacked(
            ['bytes1', 'address', 'bytes32', 'bytes32'],
            ['0xff', factory, imageHash, codeHash]
        )
    );

    return ethers.getAddress(hexDataSlice(hash, 12));
}

async function getNextNonce(walletAddress: string): Promise<number> {
    // Get the next nonce from the blockchain
    const nonce = await hre.ethers.provider.getTransactionCount(walletAddress);
    return nonce;
}

function encodeMetaTransactionsData(
    owner: string,
    txs: any[],
    nonce: number
): string {
    const abiCoder = new ethers.AbiCoder();

    // Define the types of the parameters being encoded
    const types = ["uint256", "tuple(address target, uint256 value, bytes data, uint256 gasLimit, bool delegateCall, bool revertOnError)[]"];

    // Encode the nonce and the transactions (txs array)
    const encodedData = abiCoder.encode([types[0], types[1]], [nonce, txs]);

    // Return the digest of the encoded data using the owner's address
    return subDigest(owner, keccak256(encodedData));
}

function subDigest(walletAddress: string, digest: string): string {
    return keccak256(
        new ethers.AbiCoder().encode(
            ["string", "uint256", "address", "bytes32"],
            ["\x19\x01", ScriptConfig.chainId, walletAddress, digest]
        )
    );
}

async function walletMultiSign(
    userMagic: Wallet,
    toBeSigned: string
): Promise<string> {
    const passportSigner = ScriptConfig.deployAccounts.passportSigner;

    const signaturePassportSigner = await passportSigner.signMessage(ethers.getBytes(toBeSigned));
    const signatureUser = await userMagic.signMessage(ethers.getBytes(toBeSigned));

    return combineSignatures(signaturePassportSigner, signatureUser, userMagic.address);
}

// Constants
const THRESHOLD = 2;
const WEIGHT = 1;
const FLAG_SIGNATURE = 0;
const FLAG_DYNAMIC_SIGNATURE = 2;
const SIG_TYPE_EIP712 = 1;
const SIG_TYPE_WALLET_BYTES32 = 3;

function combineSignatures(
    sig1: string,
    sig2: string,
    userEOA: string
): string {
    const sig1Obj = Signature.from(sig1);
    const sig2Obj = Signature.from(sig2);

    const immutableSignerAddress = ScriptConfig.passportWalletV1.immutableSigner.target;

    // Signature components
    const sig1vHex = toBeHex(sig1Obj.v);
    const sig2vHex = toBeHex(sig2Obj.v);

    // Encoded signature for the passport signer
    const encodedSigPassportSigner = concat([
        sig1Obj.r,
        sig1Obj.s,
        sig1vHex,
        toBeHex(SIG_TYPE_EIP712),
        toBeHex(SIG_TYPE_WALLET_BYTES32),
    ]);

    // Encoded signature for the user
    const encodedSigUser = concat([
        sig2Obj.r,
        sig2Obj.s,
        sig2vHex,
        toBeHex(SIG_TYPE_EIP712),
    ]);

    // Convert the length of encodedSigPassportSigner to Uint16Array (for length encoding)
    const passportSignerLengthBytes = ethers.getBytes(toBeHex(encodedSigPassportSigner.length));

    // Create final combined signature based on address comparison
    if (BigNumber.from(userEOA).gt(BigNumber.from(immutableSignerAddress))) {
        return concat([
            zeroPadValue(BigNumber.from(THRESHOLD).toHexString(), 32),
            toBeHex(FLAG_SIGNATURE),
            toBeHex(WEIGHT),
            encodedSigUser,
            toBeHex(FLAG_DYNAMIC_SIGNATURE),
            toBeHex(WEIGHT),
            immutableSignerAddress.toString(),
            passportSignerLengthBytes,  // Correctly formatted length in bytes
            encodedSigPassportSigner
        ]);
    } else {
        return concat([
            zeroPadValue(BigNumber.from(THRESHOLD).toHexString(), 32),
            toBeHex(FLAG_DYNAMIC_SIGNATURE),
            toBeHex(WEIGHT),
            immutableSignerAddress.toString(),
            passportSignerLengthBytes,  // Correctly formatted length in bytes
            encodedSigPassportSigner,
            toBeHex(FLAG_SIGNATURE),
            toBeHex(WEIGHT),
            encodedSigUser
        ]);
    }
}