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

module.exports = {
    encodeImageHash,
    addressOf,
    encodeMetaTransactionsData,
    walletMultiSign
}