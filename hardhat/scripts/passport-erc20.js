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

async function setupFactoryFixture() {
  // Network ID
  const networkId = (await ethers.provider.getNetwork()).chainId

  // Wallet TX
  const optimalGasLimit = ethers.constants.Two.pow(21)

  // Contracts are deployed using the first signer/account by default
  const [owner, executor, acc1] = await ethers.getSigners()

  const WalletFactory = await ethers.getContractFactory('Factory')
  const factory = await WalletFactory.deploy(owner.address, await owner.getAddress())
  await factory.deployed()

  const MainModule = await ethers.getContractFactory('MainModuleMock')
  const mainModule = await MainModule.deploy(factory.address)
  await mainModule.deployed()

  const MultiCall = await ethers.getContractFactory('MultiCallDeploy')
  const multiCall = await MultiCall.deploy(owner.address, executor.address)
  await multiCall.deployed()

  const deployerRole = await factory.DEPLOYER_ROLE()
  const roleTx = await factory.connect(owner).grantRole(deployerRole, multiCall.address)
  await roleTx.wait()

  const Token = await ethers.getContractFactory('ERC20Mock')
  const token = await Token.connect(owner).deploy()
  await token.deployed()

  return {
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

async function main() {
  const owner_a = new ethers.Wallet(ethers.utils.randomBytes(32))
  const salt = encodeImageHash(1, [{ weight: 1, address: owner_a.address }])

  console.log('Salt:', salt)

  const { factory, mainModule, multiCall, executor, acc1, owner, networkId, optimalGasLimit, token } = await setupFactoryFixture();

  // CFA
  const cfa = addressOf(factory.address, mainModule.address, salt)
  console.log('CFA:', cfa)
  console.log('Signer:', owner.address)


  // Transfer tokens to CFA
  const transferTx = await token.connect(owner).transfer(cfa, ethers.utils.parseEther('5'))
  await transferTx.wait()
  // expect(await token.balanceOf(cfa)).to.equal(ethers.utils.parseEther('5'))

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
  
  const TOTAL_TXS = 10;
  const transactions = Array(TOTAL_TXS).fill(transaction)

  // Signing
  const data = encodeMetaTransactionsData(cfa, transactions, networkId, ethers.constants.Zero)
  const sig = walletMultiSign([{ weight: 1, owner: owner_a }], 1, data, false)

  // console.log('Data:', data)


  // estimate gas before execution
  // const gasEstimate = await multiCall.estimateGas.deployAndExecute(cfa, mainModule.address, salt, factory.address, transactions, 0, sig);
  // console.log('Gas Estimate:', gasEstimate.toString())

  // Execution
  const dae = await multiCall.connect(executor).deployAndExecute(cfa, mainModule.address, salt, factory.address, transactions, 0, sig,
    {
      // gasLimit: optimalGasLimit
    }
  );
  const daewait = await dae.wait();
  // console.log('Transaction:', daewait)
  console.log('Block Number:', daewait.blockNumber)
  // expect(await token.balanceOf(cfa)).to.equal(ethers.utils.parseEther('4.8'))
  const tokenBalance = await token.balanceOf(cfa);
  console.log('Token Balance:', tokenBalance.toString())
  /*
    // Transfer remaining, resign Tx with incremented nonce
    // Here the deployment will be skipped and the transaction will be executed
    const dataTwo = encodeMetaTransactionsData(cfa, [transaction, transaction], networkId, 1)
    const sigTwo = walletMultiSign([{ weight: 1, owner: owner_a }], 1, dataTwo, false)
    await multiCall.connect(executor).deployAndExecute(cfa, mainModule.address, salt, factory.address, [transaction, transaction], 1, sigTwo)
    const cfaBalance = await token.balanceOf(cfa);
    console.log('CFA Balance:', cfaBalance.toString())
  */
  // expect(await token.balanceOf(cfa)).to.equal(ethers.utils.parseEther('4.6'))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
