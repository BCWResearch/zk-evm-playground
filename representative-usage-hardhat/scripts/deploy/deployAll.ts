import { setupAccounts } from './01.setupAccounts';
import hre from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { TransactionReceipt, HDNodeWallet, Wallet } from "ethers";
import BigNumber from "bignumber.js";
import fs from "fs";
import { DeployAccounts } from "../types/deploy.types";
import ScriptConfig from "../scriptConfig";
import { installCreate3Deployer } from './02.installCreate3Deployer';
import { installPassportWallet, installPassportWalletV1 } from './03.installPassportWallet';
import { installSeaport } from './04.installSeaport';
import { installGemGame } from './05.installGemGame';
import { installRoyaltyAllowlist } from './06.installRoyaltyAllowlist';
import { installHuntersOnChain } from './07.installHuntersOnChain';
import { GemGame } from '../../typechain-types';
import { addressOf, encodeImageHash, encodeMetaTransactionsData, walletMultiSign } from '../helpers/passport.helper';
import { TEST_ACCOUNTS } from "../../testaccounts";
import { installGuildOfGuardians } from './08.installGuildofGuardians';

const main = async () => {
    const chainId = (await hre.ethers.provider.getNetwork()).chainId;
    ScriptConfig.chainId = +chainId.toString();
    console.log("Chain ID: ", ScriptConfig.chainId);

    const treasurySigner = await hre.ethers.provider.getSigner(0);
    const runName = "run1";
    const accounts = await setupAccounts(treasurySigner, runName, true);
    ScriptConfig.deployAccounts = accounts;


    const deployAccounts: DeployAccounts = ScriptConfig.deployAccounts;
    const { deployer, admin, relayer, passportSigner } = deployAccounts;

    console.log("Deploy Accounts: ", Object.keys(deployAccounts));

    const create3D = await installCreate3Deployer(deployer, admin);
    ScriptConfig.accessControlledDeployer = create3D.accessControlledDeployer;
    ScriptConfig.create3Deployer = create3D.create3Deployer;

    const passportWallet = await installPassportWallet(deployer, admin, relayer, passportSigner);
    ScriptConfig.passportWallet = passportWallet;
    // const seaport = await installSeaport(deployer, admin);

    const gemGame = await installGemGame(deployer, admin);
    ScriptConfig.gemGame = gemGame;

    const royaltyAllowList = await installRoyaltyAllowlist(deployer, admin);
    ScriptConfig.royaltyAllowlist = royaltyAllowList;

    const huntersOnChain = await installHuntersOnChain(deployer, admin);
    ScriptConfig.huntersOnChain = huntersOnChain;

    const guildOfGuardians = await installGuildOfGuardians(deployer, admin);
    ScriptConfig.guildOfGuardians = guildOfGuardians;

    // const owner_a = new Wallet(TEST_ACCOUNTS[112], hre.ethers.provider);
    // await performPassportGemGameCall(owner_a);
}

const performPassportGemGameCall = async (owner_a: Wallet) => {
    // Encode the image hash for the passport wallet (similar to your previous example)
    const salt = encodeImageHash(1, [{ weight: 1, owner: owner_a }]);
    console.log('Salt:', salt);

    // Get your previously deployed passport wallet components
    const { factory, mainModule, multiCall } = ScriptConfig.passportWallet;

    // Calculate CFA (Contract Factory Address) based on the salt
    const cfa = addressOf(factory.target.toString(), mainModule.target.toString(), salt);
    console.log('CFA:', cfa);
    console.log('Signer:', owner_a.address);

    // Prepare the transaction data for calling `earnGem` on the gemGame contract
    const transaction = {
        delegateCall: false,
        revertOnError: true,
        gasLimit: "0",  // You might want to adjust this based on actual gas requirements
        target: ScriptConfig.gemGame.target.toString(),  // Assuming gemGame is stored in ScriptConfig
        value: "0",
        data: ScriptConfig.gemGame.interface.encodeFunctionData('earnGem')  // Encode the call to earnGem
    };

    const TOTAL_TXS = 1;
    const transactions = Array(TOTAL_TXS).fill(transaction);

    // Encode meta-transaction data
    const data = encodeMetaTransactionsData(cfa, transactions, +((await hre.ethers.provider.getNetwork()).chainId.toString()), 0);

    // Sign the meta-transaction
    const sig = await walletMultiSign([{ weight: 1, owner: owner_a }], 1, data, false);

    // Execute the meta-transaction through MultiCall
    const relayerWallet = ScriptConfig.deployAccounts.relayer;
    const tx = await multiCall.connect(relayerWallet).deployAndExecute(cfa, mainModule.target, salt, factory.target, transactions, 0, sig);
    const receipt = await tx.wait();

    console.log('Transaction Hash:', receipt?.hash);
    console.log('Block Number:', receipt?.blockNumber);
};

main();