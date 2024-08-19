import { ethers, Wallet, keccak256, hexlify, toUtf8Bytes, toBeHex, zeroPadValue, getAddress, Signature, concat, ContractTransactionResponse } from "ethers";

const WALLET_CODE = '0x6054600f3d396034805130553df3fe63906111273d3560e01c14602b57363d3d373d3d3d3d369030545af43d82803e156027573d90f35b3d90fd5b30543d5260203df3';

const MetaTransactionsType = `tuple(
  bool delegateCall,
  bool revertOnError,
  uint256 gasLimit,
  address target,
  uint256 value,
  bytes data
)[]`;

interface Account {
    owner: Wallet | string;
    weight: number;
    signature?: string;
}

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

function encodeImageHash(
    threshold: number,
    accounts: Account[]
): string {
    const sorted = accounts.sort((a, b) => compareAddr(typeof a.owner === 'string' ? a.owner : a.owner.address, typeof b.owner === 'string' ? b.owner : b.owner.address));
    let imageHash = ethers.solidityPacked(['uint256'], [threshold]);

    sorted.forEach((a) =>
        imageHash = ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(
                ['bytes32', 'uint8', 'address'],
                [imageHash, a.weight, typeof a.owner === 'string' ? a.owner : a.owner.address]
            )
        )
    );

    return imageHash;
}

function addressOf(
    factory: string,
    mainModule: string,
    imageHash: string
): string {
    const codeHash = ethers.keccak256(
        ethers.solidityPacked(
            ['bytes', 'bytes32'],
            [WALLET_CODE, hexZeroPad(mainModule, 32)]
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

function encodeMetaTransactionsData(
    owner: string,
    txs: any[],
    networkId: number,
    nonce: number
): string {
    const transactions = ethers.AbiCoder.defaultAbiCoder().encode(['uint256', MetaTransactionsType], [nonce, txs]);
    return encodeMessageData(owner, transactions, networkId);
}

function encodeMessageData(
    owner: string,
    message: string,
    networkId: number
): string {
    return encodeMessageSubDigest(owner, ethers.keccak256(message), networkId);
}

function encodeMessageSubDigest(
    owner: string,
    digest: string,
    networkId: number
): string {
    return ethers.solidityPacked(
        ['string', 'uint256', 'address', 'bytes32'],
        ['\x19\x01', networkId, owner, digest]
    );
}

async function ethSign(wallet: Wallet, message: string, hashed = false): Promise<string> {
    let hash = hashed ? message : ethers.keccak256(message);
    let hashArray = ethers.getBytes(hash);
    let ethsigNoType = await wallet.signMessage(hashArray);
    return ethsigNoType.endsWith('03') || ethsigNoType.endsWith('02') ? ethsigNoType : ethsigNoType + '02';
}

async function walletMultiSign(
    accounts: Account[],
    threshold: number,
    message: string,
    forceDynamicSize = false,
    hashed = false
): Promise<string> {
    const sorted = accounts.sort((a, b) => compareAddr(typeof a.owner === 'string' ? a.owner : a.owner.address, typeof b.owner === 'string' ? b.owner : b.owner.address));
    const accountBytes = await Promise.all(
        sorted.map(async (a) => {
            if (typeof a.owner === 'string' && !a.signature) {
                return ethers.solidityPacked(
                    ['uint8', 'uint8', 'address'],
                    [1, a.weight, a.owner]
                );
            } else {
                const signature = ethers.getBytes(a.signature ? a.signature : await ethSign(a.owner as Wallet, message, hashed));
                if (forceDynamicSize || signature.length !== 66) {
                    const address = typeof a.owner === 'string' ? a.owner : (a.owner as Wallet).address;
                    return ethers.solidityPacked(
                        ['uint8', 'uint8', 'address', 'uint16', 'bytes'],
                        [2, a.weight, address, signature.length, signature]
                    );
                } else {
                    return ethers.solidityPacked(
                        ['uint8', 'uint8', 'bytes'],
                        [0, a.weight, signature]
                    );
                }
            }
        })
    );

    return ethers.solidityPacked(
        ['uint16', ...Array(accounts.length).fill('bytes')],
        [threshold, ...accountBytes]
    );
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


export {
    encodeImageHash,
    addressOf,
    encodeMetaTransactionsData,
    walletMultiSign
};
