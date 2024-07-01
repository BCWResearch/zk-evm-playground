const {
  encodeImageHash,
  addressOf,
  encodeMetaTransactionsData,
  walletMultiSign
} = require('./utils/passportUtils')

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

  // Execution
  const dae = await multiCall
    .connect(executor)
    .deployAndExecute(cfa, mainModule.address, salt, factory.address, transactions, 0, sig);
  const daewait = await dae.wait();
  console.log('Block Number:', daewait.blockNumber);
  const tokenBalance = await token.balanceOf(cfa);
  console.log('Token Balance:', tokenBalance.toString())
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
