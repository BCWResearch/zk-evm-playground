import { setupAccounts } from './01.setupAccounts';
import hre from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { TransactionReceipt, HDNodeWallet, Wallet } from "ethers";
import BigNumber from "bignumber.js";
import fs from "fs";
import { DeployAccounts } from "../types/deploy.types";
import ScriptConfig from "../scriptConfig";
import { installCreate3Deployer } from './02.installCreate3Deployer';
import { installPassportWallet } from './03.installPassportWallet';
import { installSeaport } from './04.installSeaport';
import { installGemGame } from './05.installGemGame';
import { installRoyaltyAllowlist } from './06.installRoyaltyAllowlist';
import { installHuntersOnChain } from './07.installHuntersOnChain';

const main = async () => {
    const chainId = (await hre.ethers.provider.getNetwork()).chainId;
    ScriptConfig.chainId = +chainId.toString();
    console.log("Chain ID: ", ScriptConfig.chainId);

    const treasurySigner = await hre.ethers.provider.getSigner(0);
    const runName = "run1";
    const accounts = await setupAccounts(treasurySigner, runName, false);
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

    const royaltyAllowList = await installRoyaltyAllowlist(deployer, admin);
    ScriptConfig.royaltyAllowlist = royaltyAllowList;

    const huntersOnChain = await installHuntersOnChain(deployer, admin);

}

main();