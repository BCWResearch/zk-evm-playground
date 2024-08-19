import { Wallet } from "ethers";
import { addressOf, encodeImageHash, encodeMetaTransactionsData, walletMultiSign } from "./helpers/passport.helper";
import ScriptConfig from "./scriptConfig";
import hre from "hardhat";
import { deployAll } from "./deploy/deployAll";
import { TEST_ACCOUNTS } from "../testaccounts";

const performPassportGemGameCall = async (owner_a: Wallet, nonce: number) => {
    const salt = encodeImageHash(1, [{ weight: 1, owner: owner_a }]);
    console.log('Salt:', salt);

    const { factory, mainModule, multiCall } = ScriptConfig.passportWallet;

    // Calculate CFA (Contract Factory Address) based on the salt
    const cfa = addressOf(factory.target.toString(), mainModule.target.toString(), salt);
    console.log('CFA:', cfa);
    console.log('Signer:', owner_a.address);

    // Prepare the transaction data for calling `earnGem` on the gemGame contract
    const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: "0", 
        target: ScriptConfig.gemGame.target.toString(),
        value: "0",
        data: ScriptConfig.gemGame.interface.encodeFunctionData('earnGem')  // Encode the call to earnGem
    };

    const TOTAL_TXS = 1;
    const transactions = Array(TOTAL_TXS).fill(transaction);

    // Encode meta-transaction data
    const data = encodeMetaTransactionsData(cfa, transactions, ScriptConfig.chainId, nonce);

    // Sign the meta-transaction
    const sig = await walletMultiSign([{ weight: 1, owner: owner_a }], 1, data, false);

    const { admin } = ScriptConfig.deployAccounts;
    const executorRole = await multiCall.EXECUTOR_ROLE();

    const roleTx = await multiCall.connect(admin).grantRole(executorRole, owner_a.address)
    await roleTx.wait()


    // const grantRoleTx = await ScriptConfig.accessControlledDeployer.connect(admin).grantDeployerRole([owner_a.address]);
    // await grantRoleTx.wait();
    
    const tx = await multiCall.connect(owner_a).deployAndExecute(cfa, mainModule.target, salt, factory.target, transactions, nonce, sig);
    const receipt = await tx.wait();



    console.log('Transaction Hash:', receipt?.hash);
    console.log('Block Number:', receipt?.blockNumber);
};

const main = async () => {

    const treasurySigner = await hre.ethers.provider.getSigner(1);
    const runName = "run1";
    const resp = await deployAll(treasurySigner, runName, false);

    const owner_a = new Wallet(TEST_ACCOUNTS[112], hre.ethers.provider);
    console.log('Owner A:', owner_a.address);
    await performPassportGemGameCall(owner_a);
}



main();